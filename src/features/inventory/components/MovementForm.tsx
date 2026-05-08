import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { movementSchema } from '../models/movement.model'; // Asegúrate que la carpeta sea "models"
import type { MovementFormValues } from '../models/movement.model';

interface Product {
  productId: string; // Cambiado a productId para que coincida con tu imagen de BD
  name: string;
}

interface MovementFormProps {
  products: Product[];
  onSubmit: (data: MovementFormValues) => Promise<void>;
  initialType?: MovementFormValues['type']; // Para saber si es inicialización o ajuste
}

export default function MovementForm({
  products,
  onSubmit,
  initialType = 'ingreso_lote'
}: MovementFormProps) {
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    mode: 'onBlur',
    defaultValues: {
      productId: '',
      type: initialType,
      quantity: 0,
      notes: '',
    },
  });

  const handleClear = () => reset();

  return (
    <div className="bg-[var(--theme-card-bg)] border border-[var(--theme-border)] rounded-2xl p-6">
      {/* Header Dinámico para cumplir las US */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">📦</span>
        <h2 className="font-['Outfit'] font-bold text-base text-[var(--theme-text)]">
          {initialType === 'inicializacion' ? 'Inicializar Stock' : 'Registrar Movimiento'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Producto */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.68rem] font-bold tracking-widest uppercase text-[var(--theme-text)] opacity-50">
            Producto *
          </label>
          <Controller
            name="productId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`w-full bg-[var(--theme-secondary-bg)] border rounded-xl px-4 py-3 text-sm text-[var(--theme-text)] outline-none transition-colors duration-150 ${
                  errors.productId ? 'border-red-500' : 'border-[var(--theme-border)] focus:border-primary'
                }`}
              >
                <option value="">— Seleccionar producto —</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.productId && <p className="text-[0.7rem] text-red-500">{errors.productId.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Cantidad */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-bold tracking-widest uppercase text-[var(--theme-text)] opacity-50">
              Cantidad *
            </label>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className={`w-full bg-[var(--theme-secondary-bg)] border rounded-xl px-4 py-3 text-sm text-[var(--theme-text)] outline-none ${
                    errors.quantity ? 'border-red-500' : 'border-[var(--theme-border)] focus:border-primary'
                  }`}
                />
              )}
            />
            {errors.quantity && <p className="text-[0.7rem] text-red-500">{errors.quantity.message}</p>}
          </div>

          {/* Tipo (Solo lectura si se pasa por props) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-bold tracking-widest uppercase text-[var(--theme-text)] opacity-50">
              Tipo
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <select {...field} className="w-full bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm">
                  <option value="ingreso_lote">Ingreso de Lote</option>
                  <option value="inicializacion">Inicialización</option>
                  <option value="ajuste_manual">Ajuste Manual</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Notas (Obligatorias para US 04 Ajuste) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.68rem] font-bold tracking-widest uppercase text-[var(--theme-text)] opacity-50">
            Observaciones / Motivo *
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                placeholder="Describa el motivo del movimiento..."
                className="w-full bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm outline-none resize-none"
              />
            )}
          />
          {errors.notes && <p className="text-[0.7rem] text-red-500">{errors.notes.message}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-sm uppercase hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar'}
          </button>
          <button type="button" onClick={handleClear} className="px-6 py-2.5 rounded-full border text-sm uppercase">
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}