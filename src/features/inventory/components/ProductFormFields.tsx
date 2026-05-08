import { Controller, type UseFormReturn } from 'react-hook-form';
import { X, UploadCloud, ImageOff } from 'lucide-react';
import { type ProductFormValues } from '../models/product.model';
import { type Category } from '../hooks/useProductModal';

const toSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-red-500">{message}</p> : null;

interface Props {
  form: UseFormReturn<ProductFormValues>;
  hasOffer: boolean;
  categories: Category[];
  categoriesError: string;
  imagePreview: string;
  uploadProgress: number;
  isUploading: boolean;
  onRemoveImage: () => void;
  onImageChange: (file: File) => void;
  onCancelUpload: () => void;
}

export const ProductFormFields = ({
  form,
  hasOffer,
  categories,
  categoriesError,
  imagePreview,
  uploadProgress,
  isUploading,
  onRemoveImage,
  onImageChange,
  onCancelUpload,
}: Props) => {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      {/* Categoría */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
          Categoría *
        </label>
        {categoriesError && (
          <p className="mb-1 text-xs text-red-500">{categoriesError}</p>
        )}
        <select
          {...register('categoryId')}
          className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">
            {categories.length === 0
              ? 'Cargando categorías...'
              : 'Selecciona una categoría...'}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.categoryId?.message} />
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
          Nombre *
        </label>
        <input
          type="text"
          {...register('name', {
            onChange: (e) => setValue('slug', toSlug(e.target.value)),
          })}
          className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) focus:ring-2 focus:ring-primary outline-none"
          placeholder="Ej: Galletas de Avena Sansi"
        />
        <FieldError message={errors.name?.message} />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
          URL amigable{' '}
          <span className="opacity-40 normal-case font-normal">
            (auto-generado)
          </span>
        </label>
        <input
          type="text"
          {...register('slug')}
          className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) opacity-70 focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
          placeholder="galletas-de-avena-sansi"
        />
        <FieldError message={errors.slug?.message} />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
          Descripción
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) focus:ring-2 focus:ring-primary outline-none resize-none"
          placeholder="Describe el producto..."
        />
      </div>

      {/* Precio + Etiqueta */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
            Precio (Bs) *
          </label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) focus:ring-2 focus:ring-primary outline-none"
                placeholder="Ej: 5.50"
              />
            )}
          />
          <FieldError message={errors.price?.message} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
            Etiqueta
          </label>
          <input
            type="text"
            {...register('badge')}
            className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) focus:ring-2 focus:ring-primary outline-none"
            placeholder="Ej: Nuevo, Popular"
          />
        </div>
      </div>

      {/* Toggle oferta */}
      <div className="flex items-center justify-between bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-(--theme-text)">
            Tiene oferta
          </p>
          <p className="text-xs text-(--theme-text) opacity-40">
            Activar precio promocional
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            {...register('hasOffer')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-black/20 rounded-full peer peer-checked:bg-primary transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5" />
        </label>
      </div>

      {/* Precio oferta */}
      {hasOffer && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
            Precio de oferta (Bs)
          </label>
          <Controller
            name="offerPrice"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) focus:ring-2 focus:ring-primary outline-none"
                placeholder="Debe ser menor al precio normal"
              />
            )}
          />
          <FieldError message={errors.offerPrice?.message} />
        </div>
      )}

      {/* Imagen */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
          Imagen del producto
        </label>
        {imagePreview && (
          <div className="mb-3 flex items-start gap-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-(--theme-border) bg-(--theme-secondary-bg)">
              <img
                src={imagePreview}
                className="w-full h-full object-cover"
                alt="preview"
              />
            </div>
            <button
              type="button"
              onClick={onRemoveImage}
              className="mt-1 text-xs font-bold text-red-500 hover:opacity-80 transition flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Quitar imagen
            </button>
          </div>
        )}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImageChange(f);
            }}
            className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) text-sm file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/20 file:text-primary"
          />
          {!imagePreview && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 text-(--theme-text)">
              <UploadCloud className="w-4 h-4" />
            </div>
          )}
        </div>
        {isUploading && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--theme-text) opacity-40">
                {uploadProgress}%
              </span>
              <button
                type="button"
                onClick={onCancelUpload}
                className="text-xs font-bold text-red-500 hover:opacity-80 transition"
              >
                Cancelar subida
              </button>
            </div>
          </div>
        )}
        {!imagePreview && (
          <div className="mt-2 flex items-center gap-2 text-xs text-(--theme-text) opacity-40">
            <ImageOff className="w-4 h-4" />
            <span>Sin imagen seleccionada</span>
          </div>
        )}
      </div>

      {/* URL de referencia */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-40 mb-1">
          URL de referencia
        </label>
        <input
          type="url"
          {...register('sourceUrl')}
          className="w-full border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-3 text-(--theme-text) focus:ring-2 focus:ring-primary outline-none"
          placeholder="https://..."
        />
        <FieldError message={errors.sourceUrl?.message} />
      </div>

      {/* Toggle activo */}
      <div className="flex items-center justify-between bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-(--theme-text)">
            Producto activo
          </p>
          <p className="text-xs text-(--theme-text) opacity-40">
            Visible en la tienda
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            {...register('active')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-black/20 rounded-full peer peer-checked:bg-primary transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 peer-checked:after:translate-x-5" />
        </label>
      </div>
    </div>
  );
};
