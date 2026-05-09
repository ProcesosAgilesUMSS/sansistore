import { z } from 'zod';

// Definimos los tipos que usaremos para las 4 US
export const MOVEMENT_TYPES = [
  'inicializacion', // US 03
  'ingreso_lote',    // US 01
  'ajuste_manual',   // US 04
  'salida_venta',
  
] as const;

export const movementSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  type: z.enum(MOVEMENT_TYPES, { message: 'Selecciona un tipo de movimiento' }),
  quantity: z
    .number({ message: 'Ingresa un número válido' }) // Usamos "message" directamente
    .int('Debe ser un número entero')
    .min(1, 'La cantidad debe ser al menos 1'),
  notes: z.string().optional(),
});

export type MovementFormValues = z.infer<typeof movementSchema>;
