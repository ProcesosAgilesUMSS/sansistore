import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import {
  uploadBytesResumable,
  getDownloadURL,
  ref as storageRef,
} from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  productSchema,
  type ProductFormValues,
  defautlValues,
} from '../models/product.model';

export interface Category {
  id: string;
  name: string;
}

export const useProductModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const uploadTaskRef = useRef<ReturnType<typeof uploadBytesResumable> | null>(
    null
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: 'onBlur',
    defaultValues: defautlValues,
  });

  const hasOffer = useWatch({ control: form.control, name: 'hasOffer' });

  useEffect(() => {
    if (!isOpen) return;
    getDocs(collection(db, 'categories'))
      .then((snapshot) => {
        setCategoriesError('');
        setCategories(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name as string,
          }))
        );
      })
      .catch(() => {
        setCategoriesError('No se pudieron cargar las categorías.');
        setCategories([]);
      });
  }, [isOpen]);

  const handleClose = useCallback(() => {
    uploadTaskRef.current?.cancel();
    uploadTaskRef.current = null;
    setIsOpen(false);
    form.reset();
    setImageFile(null);
    setImagePreview('');
    setUploadProgress(0);
    setUploadError('');
    setIsUploading(false);
  }, [form]);

  const handleCancelUpload = useCallback(() => {
    uploadTaskRef.current?.cancel();
    uploadTaskRef.current = null;
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError('Subida cancelada.');
  }, []);

  const uploadImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploadError('');
      setIsUploading(true);
      const fileRef = storageRef(
        storage,
        `products/${Date.now()}_${file.name}`
      );
      const uploadTask = uploadBytesResumable(fileRef, file);
      uploadTaskRef.current = uploadTask;

      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(
          new Error(
            'Tiempo de espera agotado. Verifica la configuración de CORS.'
          )
        );
      }, 15000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          setUploadProgress(
            Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          );
        },
        (err) => {
          clearTimeout(timeout);
          uploadTaskRef.current = null;
          setIsUploading(false);
          if ((err as { code?: string }).code === 'storage/canceled') {
            reject(new Error('CANCELLED'));
          } else {
            reject(err);
          }
        },
        async () => {
          clearTimeout(timeout);
          uploadTaskRef.current = null;
          setIsUploading(false);
          try {
            resolve(await getDownloadURL(uploadTask.snapshot.ref));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }, []);

  const onSubmit = useCallback(
    async (data: ProductFormValues) => {
      try {
        let imageUrl = data.imageUrl ?? '';
        if (imageFile) {
          imageUrl = await uploadImage(imageFile);
          if (!imageUrl) return;
        }

        const slug = data.name
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const formData = data as any;

        // DATOS PARA LA COLECCIÓN 'products'
        const productData = {
          ...data,
          slug,
          imageUrl,
          active: true,
          createdAt: serverTimestamp(),
          price: Number(data.price),
          offerPrice: data.hasOffer ? Number(data.offerPrice) : null,
          soldCount: Number(data.soldCount) || 0,
          categoryId: data.categoryId,
        };

        // DATOS PARA LA COLECCIÓN 'inventory' (Lo que faltaba)
        const inventoryData = {
          enabled: true,
          minStock: Number(formData.minStock || 5),
          productId: slug,
          stockAvailable: Number(formData.stockTotal || 0),
          stockReserved: 0,
          stockTotal: Number(formData.stockTotal || 0),
          updatedAt: serverTimestamp(),
        };

        // Guardar en 'products'
        await setDoc(doc(db, 'products', slug), productData);

        // Guardar en 'inventory' *
        await setDoc(doc(db, 'inventory', slug), inventoryData);

        handleClose();
      } catch (err) {
        if (err instanceof Error && err.message === 'CANCELLED') return;
        setUploadError(
          `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`
        );
      }
    },
    [imageFile, handleClose, uploadImage]
  );

  return {
    isOpen,
    setIsOpen,
    form,
    hasOffer,
    categories,
    categoriesError,
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    uploadProgress,
    uploadError,
    isUploading,
    handleClose,
    handleCancelUpload,
    onSubmit,
  };
};
