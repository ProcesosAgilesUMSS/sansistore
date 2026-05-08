import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../../../lib/firebase';
import type { CreateCategoryInput, UpdateCategoryInput, Category } from '../types';

const COLLECTION = 'categories';

// Obtener todas las categorías ordenadas por fecha de creación
export const getCategories = async (): Promise<Category[]> => {
  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    categoryId: doc.id,
    ...doc.data(),
  })) as Category[];
};

// Obtener una categoría por ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { categoryId: snapshot.id, ...snapshot.data() } as Category;
};

// Verificar si ya existe una categoría con ese nombre
const categoryNameExists = async (
  name: string,
  excludeId?: string
): Promise<boolean> => {
  const q = query(
    collection(db, COLLECTION),
    where('name', '==', name.trim())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  if (excludeId) {
    return snapshot.docs.some((doc) => doc.id !== excludeId);
  }
  return true;
};

// Crear categoría
export const createCategory = async (
  input: CreateCategoryInput
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado.');

  const nameExists = await categoryNameExists(input.name);
  if (nameExists) throw new Error('Ya existe una categoría con ese nombre.');

  const ref = await addDoc(collection(db, COLLECTION), {
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    active: true,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });

  return ref.id;
};

// Editar categoría
export const updateCategory = async (
  id: string,
  input: UpdateCategoryInput
): Promise<void> => {
  const nameExists = await categoryNameExists(input.name, id);
  if (nameExists) throw new Error('Ya existe una categoría con ese nombre.');

  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    active: input.active,
  });
};

// Cambiar estado activo/inactivo desde la lista
export const toggleCategoryStatus = async (
  id: string,
  active: boolean
): Promise<void> => {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { active });
};

// Eliminar categoría
export const deleteCategory = async (id: string): Promise<void> => {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
};