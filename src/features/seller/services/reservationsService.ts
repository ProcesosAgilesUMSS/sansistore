import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    type Firestore,
    type Unsubscribe,
  } from 'firebase/firestore';
  import type { Order, OrderDoc, OrderItem, OrderItemDoc } from '../types';
  
  function toDate(value: unknown): Date | null {
    if (!value) return null;
  
    if (typeof (value as { toDate?: unknown }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
  
    return new Date(value as string);
  }
  
  function docToReservation(id: string, data: OrderDoc): Order {
    return {
      orderId: id,
      buyerId: data.buyerId ?? '',
      sellerId: data.sellerId ?? '',
      status: data.status ?? 'RESERVADO',
      total: data.total ?? 0,
      locationId: data.locationId ?? '',
      paymentStatus: data.paymentStatus ?? '',
      deliveryStatus: data.deliveryStatus ?? null,
      deliveryId: data.deliveryId ?? null,
      incidentReason: data.incidentReason ?? null,
      confirmedAt: toDate(data.confirmedAt),
      createdAt: toDate(data.createdAt) ?? new Date(),
      updatedAt: toDate(data.updatedAt) ?? new Date(),
    };
  }
  
  async function fetchBuyerName(
    db: Firestore,
    buyerId: string,
  ): Promise<string | undefined> {
    if (!buyerId) return undefined;
  
    try {
      const userSnap = await getDoc(doc(db, 'users', buyerId));
  
      if (!userSnap.exists()) {
        return 'Comprador desconocido';
      }
  
      const data = userSnap.data();
  
      return data.displayName ?? data.email ?? 'Comprador desconocido';
    } catch {
      return 'Comprador desconocido';
    }
  }
  
  async function fetchLocationLabel(
    db: Firestore,
    locationId: string,
  ): Promise<string | undefined> {
    if (!locationId) return undefined;
  
    try {
      const locationSnap = await getDoc(doc(db, 'locations', locationId));
  
      if (!locationSnap.exists()) {
        return 'Ubicación no registrada';
      }
  
      const data = locationSnap.data();
  
      return data.label ?? 'Ubicación no registrada';
    } catch {
      return 'Ubicación no registrada';
    }
  }
  
  async function fetchReservationItems(
    db: Firestore,
    orderId: string,
  ): Promise<OrderItem[]> {
    const itemsRef = collection(db, 'orders', orderId, 'orderItems');
    const snap = await getDocs(itemsRef);
  
    return snap.docs.map((itemDoc) => {
      const data = itemDoc.data() as OrderItemDoc;
  
      return {
        itemId: itemDoc.id,
        productId: data.productId,
        productName: data.productName,
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        subtotal: data.subtotal,
      };
    });
  }
  
  async function enrichReservation(
    db: Firestore,
    reservation: Order,
  ): Promise<Order> {
    const [buyerName, locationLabel, items] = await Promise.all([
      fetchBuyerName(db, reservation.buyerId),
      fetchLocationLabel(db, reservation.locationId),
      fetchReservationItems(db, reservation.orderId),
    ]);
  
    return {
      ...reservation,
      buyerName,
      locationLabel,
      items,
    };
  }
  
  export function subscribeReservations(
    db: Firestore,
    sellerId: string,
    onData: (reservations: Order[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const reservationsQuery = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerId),
      where('status', '==', 'RESERVADO'),
    );
  
    return onSnapshot(
      reservationsQuery,
      async (snapshot) => {
        const reservations = snapshot.docs.map((reservationDoc) =>
          docToReservation(
            reservationDoc.id,
            reservationDoc.data() as OrderDoc,
          ),
        );
  
        const enrichedReservations = await Promise.all(
          reservations.map((reservation) =>
            enrichReservation(db, reservation),
          ),
        );
  
        onData(enrichedReservations);
      },
      (error) => {
        onError?.(error);
      },
    );
  }