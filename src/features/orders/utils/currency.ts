export const currencyFormatter = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
});

export const formatCurrency = (amount: number | undefined | null): string => {
  return currencyFormatter.format(amount ?? 0);
};
