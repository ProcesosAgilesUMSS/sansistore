import React, { useState, useEffect } from 'react';
import { Tag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createOfferService, getProductsService } from '../services/offerService';
import type { ProductOption } from '../services/offerService';
import DiscountBadge from './DiscountBadge';

const inputClass = (hasError = false) =>
  `w-full bg-[var(--theme-secondary-bg)] border rounded-xl px-4 py-3 text-sm text-[var(--theme-text)] outline-none transition-colors duration-150 ${
    hasError
      ? 'border-red-500 focus:border-red-500'
      : 'border-[var(--theme-border)] focus:border-primary'
  }`;

const labelClass =
  'text-[0.68rem] font-bold tracking-widest uppercase text-[var(--theme-text)] opacity-50';

export default function OfferForm() {
  const [productId, setProductId] = useState('');
  const [discount, setDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!successMessage) return;
    const showTimer = setTimeout(() => setToastVisible(true), 0);
    const timer = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setSuccessMessage(''), 300);
    }, 4000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(timer);
    };
  }, [successMessage]);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');

  useEffect(() => {
    getProductsService()
      .then((data) => {
        setProducts(data);
        if (data.length === 0) {
          setProductsError('No hay productos disponibles.');
        }
      })
      .catch(() => setProductsError('Error al cargar los productos.'))
      .finally(() => setLoadingProducts(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!productId || !discount || !startDate || !endDate) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (!selectedProduct) {
      setError('Producto no encontrado. Recarga la página e intenta de nuevo.');
      return;
    }

    const discountNumber = Number(discount);
    if (discountNumber <= 0 || discountNumber > 100) {
      setError('El descuento debe ser un número entre 1 y 100.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('La fecha de finalización no puede ser anterior a la de inicio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOfferService(
        { productId, discount: discountNumber, startDate, endDate, status: 'active' },
        selectedProduct.price
      );
      if (result.success) {
        setSuccessMessage(
          `¡Oferta guardada! ${selectedProduct.name} ahora aparece con ${discountNumber}% de descuento en el catálogo.`
        );
        setProductId('');
        setDiscount('');
        setStartDate('');
        setEndDate('');
      } else {
        setError('Hubo un problema al guardar la oferta.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--theme-card-bg)] border border-[var(--theme-border)] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Tag className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-['Outfit'] font-bold text-base text-[var(--theme-text)]">
            Crear Nueva Oferta
          </h2>
          <p className="text-[0.7rem] text-[var(--theme-text)] opacity-40">
            El catálogo se actualizará automáticamente
          </p>
        </div>
      </div>

      {successMessage && (
        <div
          className={`fixed top-20 right-6 z-50 max-w-xs w-full shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
            toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
          }`}
          style={{ background: 'var(--theme-card-bg)', border: '1px solid rgba(136,176,75,0.3)' }}
        >
          <div className="flex items-start gap-3 px-4 py-3.5">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--theme-text)] font-medium leading-snug">{successMessage}</p>
          </div>
          <div className="h-[3px] bg-green-500/15">
            <div
              className="h-full bg-green-500 origin-left"
              style={{ animation: 'toastProgress 4s linear forwards' }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      <form className="flex flex-col gap-5">
        {/* Producto */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Producto a aplicar oferta *</label>
          {loadingProducts ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text)] opacity-40 text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Cargando productos...
            </div>
          ) : productsError ? (
            <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm">
              {productsError}
            </div>
          ) : (
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={inputClass()}
            >
              <option value="">— Selecciona un producto —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — Bs. {p.price.toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Descuento */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Porcentaje de descuento (%) *</label>
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            placeholder="Ej: 20"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className={inputClass()}
          />

          {discount && Number(discount) > 0 && Number(discount) <= 100 && (
            <div className="mt-1">
              <span className={`${labelClass} mb-1 block`}>Vista previa para el catálogo</span>
              <DiscountBadge
                originalPrice={selectedProduct?.price ?? 100}
                discountPercentage={Number(discount)}
              />
            </div>
          )}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Fecha de inicio *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Fecha de finalización *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass()}
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loadingProducts || products.length === 0}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Guardar Oferta'}
          </button>
        </div>
      </form>
    </div>
  );
}