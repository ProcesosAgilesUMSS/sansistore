// Traduce métodos de pago internos a texto legible
export function paymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    cash_on_delivery: 'Contra entrega',
    cash:             'Efectivo',
    transfer:         'Transferencia',
    qr:               'QR',
    card:             'Tarjeta',
  };
  return map[method] ?? method;
}