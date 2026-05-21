import React, { useState, useEffect } from 'react';
import { createOfferService, getProductsService } from '../services/offerService';
import type { ProductOption } from '../services/offerService';
import DiscountBadge from './DiscountBadge';

export default function OfferForm() {
  const [productId, setProductId] = useState('');
  const [discount, setDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estado para los productos reales de la base de datos
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');

  // Carga los productos desde Firestore al montar el componente
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setProductsError('');
      try {
        const data = await getProductsService();
        setProducts(data);
        if (data.length === 0) {
          setProductsError('No hay productos disponibles en la base de datos.');
        }
      } catch {
        setProductsError('Error al cargar los productos.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
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

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setError('La fecha de finalización no puede ser anterior a la de inicio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createOfferService(
        {
          productId,
          discount: discountNumber,
          startDate,
          endDate,
          status: 'active',
        },
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
      setError('Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Precio del producto seleccionado (para la vista previa del descuento)
  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md transition-colors duration-200">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Crear Nueva Oferta
      </h2>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <form className="space-y-6">

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Producto a aplicar oferta
          </label>

          {loadingProducts ? (
            <div className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-sm">
              Cargando productos...
            </div>
          ) : productsError ? (
            <div className="w-full p-2 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {productsError}
            </div>
          ) : (
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-[#88B04B] outline-none"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Selecciona un producto...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — Bs. {product.price.toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Porcentaje de Descuento (%)
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[#88B04B] outline-none"
            placeholder="Ej: 20"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />

          {/* VISTA PREVIA DEL DESCUENTO con precio real del producto */}
          {discount && Number(discount) > 0 && Number(discount) <= 100 && (
            <div className="mt-4">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Vista Previa para el Catálogo:</span>
              <DiscountBadge
                originalPrice={selectedProduct?.price ?? 100}
                discountPercentage={Number(discount)}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Inicio
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-[#88B04B] outline-none color-scheme-dark"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Finalización
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-[#88B04B] outline-none color-scheme-dark"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || loadingProducts || products.length === 0}
          className={`w-full text-white font-bold py-2 px-4 rounded transition-colors mt-4 ${
            isSubmitting || loadingProducts || products.length === 0
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-[#88B04B] hover:bg-[#769a40]'
          }`}
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Oferta'}
        </button>
      </form>
    </div>
  );
}