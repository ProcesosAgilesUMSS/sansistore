import { atom } from 'nanostores';
import { getLocalCart, getTotalUnits } from '../utils/localCart';

export const cartTotalUnits = atom<number>(0);
export const cartAnimating = atom<boolean>(false);

export function initCartStore() {
  if (typeof window === 'undefined') return;
  const items = getLocalCart();
  cartTotalUnits.set(getTotalUnits(items));
}

export function notifyCartUpdate(newTotal: number) {
  cartTotalUnits.set(newTotal);
  cartAnimating.set(true);
  setTimeout(() => cartAnimating.set(false), 800);
}