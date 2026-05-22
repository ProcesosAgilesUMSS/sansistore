import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { getSellerProducts, registerPurchase, type ProductForPurchase } from '../services/purchaseService';
import { ShoppingCart, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type FormState = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

const inputClass = (hasError: boolean) =>
  `w-full bg-[var(--theme-secondary-bg)] border rounded-xl px-4 py-3 text-sm text-[var(--theme-text)] outline-none transition-colors duration-150 ${
    hasError
      ? 'border-red-500 focus:border-red-500'
      : 'border-[var(--theme-border)] focus:border-primary'
  }`;

const labelClass = 'text-[0.68rem] font-bold tracking-widest uppercase text-[var(--theme-text)] opacity-50';

interface FormValues {
  productId: string;
  quantity: string;
  unitCost: string;
  purchaseDate: string;
  supplier: string;
}

const defaultValues: FormValues = {
  productId: '',
  quantity: '',
  unitCost: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  supplier: '',
};

interface FieldErrors {
  productId?: string;
  quantity?: string;
  unitCost?: string;
  purchaseDate?: string;
}

export default function PurchaseForm() {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductForPurchase[]>([]);
  const [formState, setFormState] = useState<FormState>('loading');
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFormState('error');
        setFeedback('Debes iniciar sesión para acceder a esta función.');
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const roles = userSnap.data()?.roles ?? [];
        const allowed = ['vendedor', 'administrador', 'admin'].some((r) => roles.includes(r));

        if (!allowed) {
          setFormState('error');
          setFeedback('No tienes permiso para registrar compras.');
          return;
        }

        setSellerId(user.uid);
        const data = await getSellerProducts(user.uid);
        setProducts(data);
        setFormState('idle');
      } catch {
        setFormState('error');
        setFeedback('Error al cargar los datos. Verifica tu conexión.');
      }
    });

    return unsub;
  }, []);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!values.productId) next.productId = 'Selecciona un producto';
    const qty = Number(values.quantity);
    if (!values.quantity || isNaN(qty) || qty < 1 || !Number.isInteger(qty))
      next.quantity = 'Ingresa una cantidad entera mayor a 0';
    const cost = Number(values.unitCost);
    if (!values.unitCost || isNaN(cost) || cost <= 0)
      next.unitCost = 'Ingresa un costo válido mayor a 0';
    if (!values.purchaseDate) next.purchaseDate = 'Selecciona una fecha';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'productId') {
      const product = products.find((p) => p.id === value);
      setValues((prev) => ({
        ...prev,
        productId: value,
        unitCost: product ? product.price.toFixed(2) : prev.unitCost,
      }));
      setErrors((prev) => ({ ...prev, productId: undefined, unitCost: undefined }));
      return;
    }

    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !sellerId) return;

    setFormState('submitting');
    setFeedback('');

    try {
      await registerPurchase({
        productId: values.productId,
        quantity: Number(values.quantity),
        unitCost: Number(values.unitCost),
        purchaseDate: values.purchaseDate,
        supplier: values.supplier.trim() || undefined,
        sellerId,
      });

      const productName = products.find((p) => p.id === values.productId)?.name ?? 'Producto';
      setFeedback(`Compra de "${productName}" registrada. Stock actualizado correctamente.`);
      setValues({ ...defaultValues, purchaseDate: new Date().toISOString().slice(0, 10) });
      setFormState('success');
    } catch {
      setFeedback('Error al registrar la compra. Intenta de nuevo.');
      setFormState('error');
    }
  };

  const handleReset = () => {
    setValues({ ...defaultValues, purchaseDate: new Date().toISOString().slice(0, 10) });
    setErrors({});
    setFeedback('');
    setFormState('idle');
  };

  if (formState === 'loading') {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-[var(--theme-text)] opacity-40">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Cargando productos...</span>
      </div>
    );
  }

  if (formState === 'error' && !sellerId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-semibold">{feedback}</p>
      </div>
    );
  }

  const isSubmitting = formState === 'submitting';
  const selectedProduct = products.find((p) => p.id === values.productId);

  return (
    <div className="bg-[var(--theme-card-bg)] border border-[var(--theme-border)] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShoppingCart className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-['Outfit'] font-bold text-base text-[var(--theme-text)]">
            Registrar Compra
          </h2>
          <p className="text-[0.7rem] text-[var(--theme-text)] opacity-40">
            El stock del inventario se actualizará automáticamente
          </p>
        </div>
      </div>

      {formState === 'success' && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">{feedback}</p>
        </div>
      )}

      {formState === 'error' && sellerId && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{feedback}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Producto */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Producto *</label>
          <select
            name="productId"
            value={values.productId}
            onChange={handleChange}
            disabled={isSubmitting}
            className={inputClass(!!errors.productId)}
          >
            <option value="">— Seleccionar producto —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — Bs. {p.price.toFixed(2)}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-[0.7rem] text-red-500">{errors.productId}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Cantidad */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Cantidad *</label>
            <input
              name="quantity"
              type="number"
              min={1}
              step={1}
              value={values.quantity}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="ej. 50"
              className={inputClass(!!errors.quantity)}
            />
            {errors.quantity && (
              <p className="text-[0.7rem] text-red-500">{errors.quantity}</p>
            )}
          </div>

          {/* Costo unitario */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Costo unitario (Bs.) *
              {selectedProduct && (
                <span className="ml-1 normal-case tracking-normal font-normal opacity-60">
                  — editable
                </span>
              )}
            </label>
            <input
              name="unitCost"
              type="number"
              min={0.01}
              step={0.01}
              value={values.unitCost}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="ej. 8.50"
              className={inputClass(!!errors.unitCost)}
            />
            {selectedProduct && values.unitCost && Number(values.unitCost) !== selectedProduct.price && (
              <p className="text-[0.68rem] text-amber-500 opacity-80">
                Precio catálogo: Bs. {selectedProduct.price.toFixed(2)}
              </p>
            )}
            {errors.unitCost && (
              <p className="text-[0.7rem] text-red-500">{errors.unitCost}</p>
            )}
          </div>
        </div>

        {/* Vista previa del costo total */}
        {values.quantity && values.unitCost && Number(values.quantity) > 0 && Number(values.unitCost) > 0 && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[var(--theme-text)] opacity-60">Costo total estimado</span>
              <span className="text-[0.65rem] text-[var(--theme-text)] opacity-40">
                {values.quantity} u. × Bs. {Number(values.unitCost).toFixed(2)}
              </span>
            </div>
            <span className="font-['Outfit'] font-bold text-primary text-lg">
              Bs. {(Number(values.quantity) * Number(values.unitCost)).toFixed(2)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Fecha de compra *</label>
            <input
              name="purchaseDate"
              type="date"
              value={values.purchaseDate}
              onChange={handleChange}
              disabled={isSubmitting}
              className={inputClass(!!errors.purchaseDate)}
            />
            {errors.purchaseDate && (
              <p className="text-[0.7rem] text-red-500">{errors.purchaseDate}</p>
            )}
          </div>

          {/* Proveedor */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Proveedor (opcional)</label>
            <input
              name="supplier"
              type="text"
              value={values.supplier}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="ej. Distribuidora Alfa"
              className={inputClass(false)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSubmitting ? 'Registrando...' : 'Registrar Compra'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full border border-[var(--theme-border)] text-sm text-[var(--theme-text)] uppercase tracking-wide hover:border-primary hover:text-primary transition-colors"
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}
