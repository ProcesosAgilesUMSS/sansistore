export const roundMoney = (amount: number): number => {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

export const formatBolivianos = (amount: number): string =>
  `Bs ${roundMoney(amount)
    .toFixed(2)
    .replace(/\.?0+$/, '')}`;
