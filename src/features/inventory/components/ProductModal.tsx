import React, { useCallback } from 'react';
import { X, CheckCircle2 } from 'lucide-react'; // Importamos el ícono de éxito
import { useProductModal } from '../hooks/useProductModal';
import { ProductFormFields } from './ProductFormFields';

export const ProductModal: React.FC = () => {
  const {
    isOpen,
    setIsOpen,
    form,
    hasOffer,
    categories,
    categoriesError,
    imagePreview,
    setImagePreview,
    setImageFile,
    uploadProgress,
    uploadError,
    isUploading,
    handleClose,
    handleCancelUpload,
    onSubmit,
    isSuccess,
    successProductName
  } = useProductModal();

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = form;
  const isBusy = isSubmitting || isUploading;

  const handleFormSubmit = useCallback(
    (e: React.SubmitEvent) => handleSubmit(onSubmit)(e),
    [handleSubmit, onSubmit]
  );

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview('');
    setValue('imageUrl', '');
  }, [setImageFile, setImagePreview, setValue]);

  const handleImageChange = useCallback(
    (file: File) => {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    },
    [setImageFile, setImagePreview]
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-(--theme-bg) font-display font-bold text-sm tracking-wide transition-all duration-200 hover:brightness-110 active:scale-95"
      >
        + Nuevo producto
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          
          {isSuccess ? (
            
            <div className="bg-(--theme-card-bg) border border-primary/30 shadow-2xl rounded-2xl p-8 animate-in zoom-in-95 fade-in duration-200 flex flex-col items-center max-w-sm w-full">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="font-display font-black text-2xl text-(--theme-text) mb-2">¡Producto Creado!</p>
              <p className="text-sm text-(--theme-text) opacity-70 text-center">
                <strong className="text-primary">{successProductName}</strong> ha sido añadido exitosamente a tu tienda.
              </p>
              <div className="mt-6 flex items-center gap-2 opacity-50">
                <div className="w-4 h-4 border-2 border-(--theme-text) border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-(--theme-text) uppercase tracking-widest font-bold">Actualizando tabla...</span>
              </div>
            </div>
          ) : (
            //FORMULARIO ORIGINAL DE CREACIÓN /ProductDetailModa
            <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl shadow-2xl max-w-lg w-full p-7 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-(--theme-secondary-bg) border border-(--theme-border) flex items-center justify-center text-(--theme-text) opacity-60 hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="font-display font-black text-2xl text-(--theme-text) mb-1">
                Nuevo Producto
              </h2>
              <p className="text-sm text-(--theme-text) opacity-50 mb-6">
                Completa la información del producto para la tienda.
              </p>

              {uploadError && (
                <div className="mb-4 p-3 rounded-2xl bg-(--theme-error-bg) border border-(--theme-error-border) text-(--theme-error) text-sm flex items-start gap-2">
                  <X className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <ProductFormFields
                  form={form}
                  hasOffer={hasOffer}
                  categories={categories}
                  categoriesError={categoriesError}
                  imagePreview={imagePreview}
                  uploadProgress={uploadProgress}
                  isUploading={isUploading}
                  onRemoveImage={handleRemoveImage}
                  onImageChange={handleImageChange}
                  onCancelUpload={handleCancelUpload}
                />

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-2xl font-display font-bold text-sm border border-(--theme-border) text-(--theme-text) opacity-70 hover:opacity-100 hover:bg-(--theme-secondary-bg) transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="flex-[1.2] px-4 py-3 rounded-2xl bg-primary text-(--theme-bg) font-display font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {isBusy ? 'Guardando...' : 'Guardar producto'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};