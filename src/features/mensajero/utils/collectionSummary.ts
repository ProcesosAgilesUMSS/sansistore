import type { MessengerOrder } from '../types';

const COLLECTED_PAYMENT_STATUSES = new Set(['cobrado', 'pagado', 'paid']);

const normalizeStatus = (value: string | null | undefined) =>
  value
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase() ?? '';

export const isMessengerOrderCollected = (order: MessengerOrder) =>
  order.deliveryStatus === 'delivered' &&
  (COLLECTED_PAYMENT_STATUSES.has(normalizeStatus(order.paymentStatus)) ||
    COLLECTED_PAYMENT_STATUSES.has(normalizeStatus(order.paymentStatusLabel)));

export const isSameLocalDay = (date: Date, day: Date) =>
  date.getFullYear() === day.getFullYear() &&
  date.getMonth() === day.getMonth() &&
  date.getDate() === day.getDate();

export const getCollectedOrdersForDay = (
  orders: MessengerOrder[],
  day = new Date()
) =>
  orders.filter(
    (order) =>
      isMessengerOrderCollected(order) &&
      order.paymentCollectedAt != null &&
      isSameLocalDay(order.paymentCollectedAt, day)
  );

export const getCollectedTotal = (orders: MessengerOrder[]) =>
  orders
    .filter(isMessengerOrderCollected)
    .reduce((total, order) => total + order.cashToCollect, 0);

export const getCollectedTotalForDay = (
  orders: MessengerOrder[],
  day = new Date()
) =>
  getCollectedOrdersForDay(orders, day).reduce(
    (total, order) => total + order.cashToCollect,
    0
  );
