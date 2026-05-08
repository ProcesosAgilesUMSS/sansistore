import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Truck } from 'lucide-react';
import { ProductSelectionList } from './ProductSelectionList';
import { CheckoutSummaryPanel } from './CheckoutSummaryPanel';
import { OrderTrackingPanel } from './OrderTrackingPanel';
import { getCheckoutProducts } from '../services/productCatalogService';
import { createCashOnDeliveryOrder } from '../services/cashOnDeliveryService';
import type {
  CashOnDeliveryOrderItem,
  CashPaymentMethod,
  CobroProduct,
  ConfirmedCashOrder,
} from '../types';
import { getProductPrice } from '../utils/money';

const DELIVERY_FEE = 0;

export default function CashOnDeliveryCheckout() {
  const [products, setProducts] = useState<CobroProduct[]>([]);
  // Tracks selected quantity per product id
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] =
    useState<CashPaymentMethod>('cash_on_delivery');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] =
    useState<ConfirmedCashOrder | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetched = await getCheckoutProducts();
        setProducts(fetched);
        // Initialize each product with quantity >= 1 (use stock quantity as default, min 1)
        const initial: Record<string, number> = {};
        fetched.forEach((p) => {
          initial[p.id] = Math.max(1, p.quantity ?? 1);
        });
        setQuantities(initial);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Update quantity for a single product
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
  };

  const orderItems = useMemo<CashOnDeliveryOrderItem[]>(
    () =>
      products
        .map((product) => {
          const quantity = quantities[product.id] ?? 0;
          const unitPrice = getProductPrice(product);

          return {
            productId: product.id,
            name: product.name,
            unitPrice,
            quantity,
            subtotal: Number((unitPrice * quantity).toFixed(2)),
          };
        })
        .filter((item) => item.quantity > 0),
    [products, quantities]
  );

  const productsTotal = useMemo(
    () =>
      Number(
        orderItems
          .reduce((total, item) => total + item.subtotal, 0)
          .toFixed(2)
      ),
    [orderItems]
  );

  const orderTotal = Number((productsTotal + DELIVERY_FEE).toFixed(2));
  const hasSelectedProducts = orderItems.length > 0;

  const resetMessages = () => {
    setErrorMessage('');
    setConfirmedOrder(null);
  };

  const handlePaymentMethodChange = (method: CashPaymentMethod) => {
    resetMessages();
    setPaymentMethod(method);
  };

  const handleConfirmOrder = async () => {
    if (!hasSelectedProducts) {
      setErrorMessage(
        'Debe seleccionar al menos un producto para confirmar el pedido.'
      );
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const result = await createCashOnDeliveryOrder({
        items: orderItems,
        productsTotal,
        additionalCharges: DELIVERY_FEE,
        total: orderTotal,
      });

      setConfirmedOrder({
        orderId: result.orderId,
        paymentId: result.paymentId,
        total: orderTotal,
      });
      window.location.hash = 'seguimiento-pedido';
    } catch {
      setErrorMessage('No se pudo registrar el pedido. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="pago-contra-entrega" className="py-16 bg-bg-light">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-primary">
              Entrega y cobro
            </p>
            <h2 className="text-3xl font-black text-text-light">
              Pago contra entrega
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-text-light opacity-65">
              Confirma tu pedido ahora y paga el monto pendiente cuando recibas
              los productos.
            </p>
          </div>

          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-3 text-sm font-semibold text-text-light">
              <Truck size={16} className="text-primary" />
              Pago al recibir
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-3 text-sm font-semibold text-text-light">
              <ShieldCheck size={16} className="text-primary" />
              Pago pendiente asociado
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <ProductSelectionList
            loading={loading}
            products={products}
            selectedItems={orderItems}
            onQuantityChange={handleQuantityChange}
          />

          <CheckoutSummaryPanel
            items={orderItems}
            productsTotal={productsTotal}
            additionalCharges={DELIVERY_FEE}
            orderTotal={orderTotal}
            paymentMethod={paymentMethod}
            saving={saving}
            errorMessage={errorMessage}
            onPaymentMethodChange={handlePaymentMethodChange}
            onConfirmOrder={handleConfirmOrder}
          />
        </div>

        <OrderTrackingPanel confirmedOrder={confirmedOrder} />
      </div>
    </section>
  );
}