import { z } from 'zod';

export const productSchema = z
  .object({
    categoryId: z.string().min(1, 'Selecciona una categoría'),
    name: z.string().min(1, 'El nombre es obligatorio'),
    slug: z.string().min(1, 'El slug es obligatorio'),
    description: z.string().optional(),
    price: z
      .number({ error: 'Ingresa un precio válido' })
      .positive('El precio debe ser mayor a 0'),
    imageUrl: z.string().optional(),
    active: z.boolean(),
    hasOffer: z.boolean(),
    offerPrice: z.number().positive().optional().nullable(),
    soldCount: z.number().min(0).optional(),
    badge: z.string().optional(),
    sourceUrl: z.url({ error: 'URL inválida' }).optional().or(z.literal('')),
  })
  .refine(
    (data) =>
      !data.hasOffer ||
      (data.offerPrice != null && data.offerPrice < data.price),
    {
      message: 'El precio de oferta debe ser menor al precio normal',
      path: ['offerPrice'],
    }
  );

export type ProductFormValues = z.infer<typeof productSchema>;

export interface ProductForm {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number | '';
  imageUrl: string;
  active: boolean;
  hasOffer: boolean;
  offerPrice: number | '';
  soldCount: number | '';
  badge: string;
  sourceUrl: string;
}

export interface InventoryProduct {
  id: string;
  productId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl?: string;
  active: boolean;
  hasOffer: boolean;
  offerPrice?: number;
  soldCount: number;
  badge?: string;
  sourceUrl?: string;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
}

export const defaultForm: ProductForm = {
  categoryId: '',
  name: '',
  slug: '',
  description: '',
  price: '',
  imageUrl: '',
  active: true,
  hasOffer: false,
  offerPrice: '',
  soldCount: 0,
  badge: '',
  sourceUrl: '',
};

export const defautlValues = {
  categoryId: '',
  name: '',
  slug: '',
  description: '',
  price: undefined,
  imageUrl: '',
  active: true,
  hasOffer: false,
  offerPrice: null,
  soldCount: 0,
  badge: '',
  sourceUrl: '',
};
