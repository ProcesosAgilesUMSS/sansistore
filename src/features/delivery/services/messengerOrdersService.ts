import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { DeliveryOrder, OrderStatus } from '../types';

let mockOrders: DeliveryOrder[] = [
  {
    id: 'ORD-1041',
    buyerId: 'buyer-001',
    buyerName: 'Camila Rojas',
    assignedMessengerId: 'juan.mensajero',
    assignedMessengerName: 'Juan',
    deliveryLocationLabel: 'Aula 693B - Facultad de Tecnologia',
    status: 'ASSIGNED',
    assignedAt: new Date('2026-05-06T09:10:00'),
  },
  {
    id: 'ORD-1042',
    buyerId: 'buyer-002',
    buyerName: 'Mateo Soria',
    assignedMessengerId: 'juan.mensajero',
    assignedMessengerName: 'Juan',
    deliveryLocationLabel: 'Biblioteca central - ingreso norte',
    status: 'ASSIGNED',
    assignedAt: new Date('2026-05-06T09:25:00'),
  },
  {
    id: 'ORD-1043',
    buyerId: 'buyer-003',
    buyerName: 'Lucia Vargas',
    assignedMessengerId: 'lucas.mensajero',
    assignedMessengerName: 'Lucas',
    deliveryLocationLabel: 'Laboratorio 2 - modulo sur',
    status: 'ASSIGNED',
    assignedAt: new Date('2026-05-06T09:40:00'),
  },
];

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mapUnknownDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate();
  }

  return null;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'READY_FOR_DELIVERY' ||
    value === 'ASSIGNED' ||
    value === 'ACCEPTED' ||
    value === 'PENDING_REASSIGNMENT' ||
    value === 'IN_TRANSIT' ||
    value === 'DELIVERED' ||
    value === 'CANCELLED'
  );
}

function mapFirestoreOrder(
  orderId: string,
  data: Record<string, unknown>,
): DeliveryOrder {
  return {
    id: orderId,
    buyerId: typeof data.buyerId === 'string' ? data.buyerId : '',
    buyerName:
      typeof data.buyerName === 'string' ? data.buyerName : 'Cliente sin nombre',
    assignedMessengerId:
      typeof data.assignedMessengerId === 'string'
        ? data.assignedMessengerId
        : null,
    assignedMessengerName:
      typeof data.assignedMessengerName === 'string'
        ? data.assignedMessengerName
        : null,
    deliveryLocationLabel:
      typeof data.deliveryLocationLabel === 'string'
        ? data.deliveryLocationLabel
        : 'Ubicacion no especificada',
    status: isOrderStatus(data.status) ? data.status : 'ASSIGNED',
    createdAt: mapUnknownDate(data.createdAt),
    assignedAt: mapUnknownDate(data.assignedAt),
    acceptedAt: mapUnknownDate(data.acceptedAt),
    rejectedAt: mapUnknownDate(data.rejectedAt),
  };
}

export async function getMessengerOrders(messengerId: string): Promise<DeliveryOrder[]> {
  await wait(650);

  if (messengerId === 'error.mensajero') {
    throw new Error('Mock load failure');
  }

  if (messengerId === 'empty.mensajero') {
    return [];
  }

  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('assignedMessengerId', '==', messengerId),
    );
    const snapshot = await getDocs(ordersQuery);

    if (!snapshot.empty) {
      return snapshot.docs.map((orderDoc) =>
        mapFirestoreOrder(orderDoc.id, orderDoc.data() as Record<string, unknown>),
      );
    }
  } catch {
    // Fallback to in-memory mocks when Firestore data is unavailable.
  }

  return mockOrders.filter((order) => order.assignedMessengerId === messengerId);
}

export async function acceptMessengerOrder(
  orderId: string,
  messengerId: string,
): Promise<DeliveryOrder> {
  await wait(450);

  try {
    const orderRef = doc(db, 'orders', orderId);

    const updatedOrder = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(orderRef);

      if (!snapshot.exists()) {
        throw new Error('No se encontro el pedido seleccionado.');
      }

      const data = snapshot.data() as Record<string, unknown>;

      if (data.assignedMessengerId !== messengerId) {
        throw new Error('El pedido no pertenece al mensajero activo.');
      }

      if (data.status !== 'ASSIGNED') {
        throw new Error('Solo se pueden aceptar pedidos en estado ASSIGNED.');
      }

      transaction.update(orderRef, {
        status: 'ACCEPTED',
        acceptedAt: serverTimestamp(),
      });

      return {
        ...mapFirestoreOrder(snapshot.id, data),
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      };
    });

    return updatedOrder;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message !== 'No se encontro el pedido seleccionado.'
    ) {
      throw error;
    }
  }

  const orderIndex = mockOrders.findIndex((order) => order.id === orderId);

  if (orderIndex === -1) {
    throw new Error('No se encontro el pedido seleccionado.');
  }

  const order = mockOrders[orderIndex];

  if (order.assignedMessengerId !== messengerId) {
    throw new Error('El pedido no pertenece al mensajero activo.');
  }

  if (order.status !== 'ASSIGNED') {
    throw new Error('Solo se pueden aceptar pedidos en estado ASSIGNED.');
  }

  const updatedOrder: DeliveryOrder = {
    ...order,
    status: 'ACCEPTED',
    acceptedAt: new Date(),
  };

  mockOrders = mockOrders.map((currentOrder) =>
    currentOrder.id === orderId ? updatedOrder : currentOrder,
  );

  return updatedOrder;
}

export async function rejectMessengerOrder(
  orderId: string,
  messengerId: string,
): Promise<DeliveryOrder> {
  await wait(450);

  try {
    const orderRef = doc(db, 'orders', orderId);

    const updatedOrder = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(orderRef);

      if (!snapshot.exists()) {
        throw new Error('No se encontro el pedido seleccionado.');
      }

      const data = snapshot.data() as Record<string, unknown>;

      if (data.assignedMessengerId !== messengerId) {
        throw new Error('El pedido no pertenece al mensajero activo.');
      }

      if (data.status !== 'ASSIGNED') {
        throw new Error('Solo se pueden rechazar pedidos en estado ASSIGNED.');
      }

      transaction.update(orderRef, {
        status: 'PENDING_REASSIGNMENT',
        rejectedAt: serverTimestamp(),
      });

      return {
        ...mapFirestoreOrder(snapshot.id, data),
        status: 'PENDING_REASSIGNMENT',
        rejectedAt: new Date(),
      };
    });

    return updatedOrder;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message !== 'No se encontro el pedido seleccionado.'
    ) {
      throw error;
    }
  }

  const orderIndex = mockOrders.findIndex((order) => order.id === orderId);

  if (orderIndex === -1) {
    throw new Error('No se encontro el pedido seleccionado.');
  }

  const order = mockOrders[orderIndex];

  if (order.assignedMessengerId !== messengerId) {
    throw new Error('El pedido no pertenece al mensajero activo.');
  }

  if (order.status !== 'ASSIGNED') {
    throw new Error('Solo se pueden rechazar pedidos en estado ASSIGNED.');
  }

  const updatedOrder: DeliveryOrder = {
    ...order,
    status: 'PENDING_REASSIGNMENT',
    rejectedAt: new Date(),
  };

  mockOrders = mockOrders.map((currentOrder) =>
    currentOrder.id === orderId ? updatedOrder : currentOrder,
  );

  return updatedOrder;
}
