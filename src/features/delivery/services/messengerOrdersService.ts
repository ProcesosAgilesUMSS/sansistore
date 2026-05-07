import type { DeliveryOrder } from '../types';

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

export async function getMessengerOrders(messengerId: string): Promise<DeliveryOrder[]> {
  await wait(650);

  if (messengerId === 'error.mensajero') {
    throw new Error('Mock load failure');
  }

  if (messengerId === 'empty.mensajero') {
    return [];
  }

  return mockOrders.filter((order) => order.assignedMessengerId === messengerId);
}

export async function acceptMessengerOrder(
  orderId: string,
  messengerId: string,
): Promise<DeliveryOrder> {
  await wait(450);

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
