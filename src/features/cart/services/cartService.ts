import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { CartInventory, CartItem, CartProduct } from '../types';

function toPositiveInteger(value: unknown) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity < 1) return 1;
  return Math.floor(quantity);
}

function toMoneyNumber(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

function toPositiveStock(value: unknown) {
  const stock = Number(value);
  if (!Number.isFinite(stock) || stock < 0) return 0;
  return Math.floor(stock);
}

function getProductPrice(product: CartProduct | null) {
  if (!product) return 0;
  const offerPrice = toMoneyNumber(product.offerPrice);
  if (product.hasOffer && offerPrice > 0) return offerPrice;
  return toMoneyNumber(product.price);
}

function getAvailabilityMessage({
  product,
  inventory,
  unitPrice,
  stockAvailable,
  quantity,
}: {
  product: CartProduct | null;
  inventory: CartInventory | null;
  unitPrice: number;
  stockAvailable: number;
  quantity: number;
}) {
  if (!product) return 'El producto ya no existe.';
  if (product.active === false) return 'El producto ya no está activo.';
  if (!inventory || inventory.enabled === false) {
    return 'El producto no está disponible para venta.';
  }
  if (stockAvailable < quantity) return `Stock insuficiente. Disponible: ${stockAvailable}.`;
  if (unitPrice <= 0) return 'El producto no tiene un precio válido.';
  return '';
}

export async function getUserCartItems(userId: string): Promise<CartItem[]> {
  const cartCol = collection(db, 'users', userId, 'cartItems');
  const snap = await getDocs(cartCol);

  return Promise.all(
    snap.docs.map(async (cartDoc) => {
      const cartData = cartDoc.data();
      const productId = String(cartData.productId || '');
      const quantity = toPositiveInteger(cartData.quantity);

      const [productSnap, inventorySnap] = await Promise.all([
        productId ? getDoc(doc(db, 'products', productId)) : Promise.resolve(null),
        productId ? getDoc(doc(db, 'inventory', productId)) : Promise.resolve(null),
      ]);

      const product =
        productSnap && productSnap.exists()
          ? ({ id: productSnap.id, ...productSnap.data() } as CartProduct)
          : null;
      const inventory =
        inventorySnap && inventorySnap.exists()
          ? (inventorySnap.data() as CartInventory)
          : null;
      const unitPrice = getProductPrice(product);
      const stockAvailable = toPositiveStock(inventory?.stockAvailable);
      const availabilityMessage = getAvailabilityMessage({
        product,
        inventory,
        unitPrice,
        stockAvailable,
        quantity,
      });
      const isAvailable = availabilityMessage === '';

      return {
        id: cartDoc.id,
        productId,
        name: product?.name || productId || 'Producto desconocido',
        imageUrl: product?.imageUrl,
        quantity,
        unitPrice,
        stockAvailable,
        isAvailable,
        availabilityMessage,
        subtotal: isAvailable ? Number((unitPrice * quantity).toFixed(2)) : 0,
      };
    }),
  );
}

export function formatMoney(value: number) {
  return `Bs ${toMoneyNumber(value).toFixed(2)}`;
}
