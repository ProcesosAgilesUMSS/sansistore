import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export interface DailySale {
  date: string;
  orders: number;
  totalAmount: number;
  average: number;
}

export interface DailySalesSummary {
  totalSales: number;
  totalOrders: number;
  dailyAverage: number;
  daysWithSales: number;
}

export interface DailySalesState {
  summary: DailySalesSummary;
  dailySales: DailySale[];
  loading: boolean;
  error: string | null;
}

interface OrderDocument {
  createdAt?: Timestamp | Date | string | null;
  total?: number | string | null;
  status?: string | null;
  paymentStatus?: string | null;
  deliveryStatus?: string | null;
}

const EMPTY_SUMMARY: DailySalesSummary = {
  totalSales: 0,
  totalOrders: 0,
  dailyAverage: 0,
  daysWithSales: 0,
};

const VALID_STATUS_VALUES = new Set([
  'confirmed',
  'completed',
  'paid',
  'delivered',
  'collected',
  'confirmado',
  'completado',
  'pagado',
  'entregado',
  'cobrado',
]);

const INVALID_STATUS_VALUES = new Set([
  'cancelled',
  'canceled',
  'cancelado',
  'pending',
  'pendiente',
  'rejected',
  'rechazado',
  'creado',
  'registrado',
]);

function normalizeStatus(value: string | null | undefined) {
  return value
    ?.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_\s-]+/g, '_');
}

function toDate(value: OrderDocument['createdAt']): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toAmount(value: OrderDocument['total']) {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function inputDateToTimestamp(value: string, endOfDay = false) {
  if (!value) return null;

  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
}

function formatDateKey(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function isValidSale(order: OrderDocument) {
  const statuses = [
    normalizeStatus(order.status),
    normalizeStatus(order.paymentStatus),
    normalizeStatus(order.deliveryStatus),
  ].filter((status): status is string => Boolean(status));

  if (statuses.some((status) => INVALID_STATUS_VALUES.has(status))) {
    return false;
  }

  return statuses.some((status) => VALID_STATUS_VALUES.has(status));
}

function mapDocument(data: DocumentData): OrderDocument {
  return {
    createdAt: data.createdAt,
    total: data.total,
    status: typeof data.status === 'string' ? data.status : null,
    paymentStatus: typeof data.paymentStatus === 'string' ? data.paymentStatus : null,
    deliveryStatus: typeof data.deliveryStatus === 'string' ? data.deliveryStatus : null,
  };
}

function buildDailySales(orders: OrderDocument[]): Pick<DailySalesState, 'summary' | 'dailySales'> {
  const grouped = new Map<string, { dateValue: number; orders: number; totalAmount: number }>();

  for (const order of orders) {
    if (!isValidSale(order)) continue;

    const createdAt = toDate(order.createdAt);
    if (!createdAt) continue;

    const date = formatDateKey(createdAt);
    const current = grouped.get(date) ?? {
      dateValue: new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()).getTime(),
      orders: 0,
      totalAmount: 0,
    };

    current.orders += 1;
    current.totalAmount += toAmount(order.total);
    grouped.set(date, current);
  }

  const dailySales = [...grouped.entries()]
    .map(([date, sale]) => ({
      date,
      orders: sale.orders,
      totalAmount: sale.totalAmount,
      average: sale.orders > 0 ? sale.totalAmount / sale.orders : 0,
      dateValue: sale.dateValue,
    }))
    .sort((a, b) => b.dateValue - a.dateValue)
    .map((sale) => ({
      date: sale.date,
      orders: sale.orders,
      totalAmount: sale.totalAmount,
      average: sale.average,
    }));

  const totalSales = dailySales.reduce((total, sale) => total + sale.totalAmount, 0);
  const totalOrders = dailySales.reduce((total, sale) => total + sale.orders, 0);
  const daysWithSales = dailySales.length;

  return {
    dailySales,
    summary: {
      totalSales,
      totalOrders,
      dailyAverage: daysWithSales > 0 ? totalSales / daysWithSales : 0,
      daysWithSales,
    },
  };
}

export function useDailySales(startDate: string, endDate: string): DailySalesState {
  const [state, setState] = useState<DailySalesState>({
    summary: EMPTY_SUMMARY,
    dailySales: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const constraints: QueryConstraint[] = [];
    const start = inputDateToTimestamp(startDate);
    const end = inputDateToTimestamp(endDate, true);

    if (start) constraints.push(where('createdAt', '>=', start));
    if (end) constraints.push(where('createdAt', '<=', end));
    constraints.push(orderBy('createdAt', 'desc'));

    return onSnapshot(
      query(collection(db, 'orders'), ...constraints),
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => mapDocument(doc.data()));
        const sales = buildDailySales(orders);

        setState({
          ...sales,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          summary: EMPTY_SUMMARY,
          dailySales: [],
          loading: false,
          error: error.message,
        });
      },
    );
  }, [endDate, startDate]);

  return state;
}
