import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Truck } from 'lucide-react';
import { ProductSelectionList } from './ProductSelectionList';
import { CheckoutSummaryPanel } from './CheckoutSummaryPanel';
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] =
    useState<CashPaymentMethod>('cash_on_delivery');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] =
    useState<ConfirmedCashOrder | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProducts(await getCheckoutProducts());
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
    setSuccessMessage('');
    setConfirmedOrder(null);
  };

  const updateQuantity = (productId: string, nextQuantity: number) => {
    resetMessages();

    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(0, nextQuantity),
    }));
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
    setSuccessMessage('');

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
      setSuccessMessage(
        'Pedido registrado correctamente. El pago será realizado al momento de la entrega.'
      );
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
            quantities={quantities}
            selectedItems={orderItems}
            onQuantityChange={updateQuantity}
          />

          <CheckoutSummaryPanel
            items={orderItems}
            productsTotal={productsTotal}
            additionalCharges={DELIVERY_FEE}
            orderTotal={orderTotal}
            paymentMethod={paymentMethod}
            saving={saving}
            errorMessage={errorMessage}
            successMessage={successMessage}
            confirmedOrder={confirmedOrder}
            onPaymentMethodChange={handlePaymentMethodChange}
            onConfirmOrder={handleConfirmOrder}
          />
        </div>
      </div>
    </section>
  );
}
