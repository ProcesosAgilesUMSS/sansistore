import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type {
  MessengerDeliveryPerformance,
  MessengerOption,
  MessengerPerformanceReport,
} from './types';

const DELIVERIES_COLLECTION = 'deliveries';
const USERS_COLLECTION = 'users';
const COMPLETED_DELIVERY_STATUSES = ['delivered', 'DELIVERED'];

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInputValue = (date: Date): string => date.toISOString().split('T')[0];

const isSameInputDay = (date: Date, inputDate: string): boolean =>
  toDateInputValue(date) === inputDate;

const getElapsedMinutes = (assignedAt: Date, deliveredAt: Date): number =>
  Math.max(0, Math.round((deliveredAt.getTime() - assignedAt.getTime()) / 60000));

const getUserDisplayName = async (messengerId: string): Promise<string> => {
  const userSnap = await getDoc(doc(db, USERS_COLLECTION, messengerId));
  if (!userSnap.exists()) return 'Mensajero';

  const user = userSnap.data();
  return user.displayName ?? user.name ?? user.email ?? 'Mensajero';
};

export const getMessengers = async (): Promise<MessengerOption[]> => {
  const messengersQuery = query(
    collection(db, USERS_COLLECTION),
    where('roles', 'array-contains', 'mensajero'),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(messengersQuery);

  return snapshot.docs
    .map((messengerDoc) => {
      const data = messengerDoc.data();
      return {
        id: messengerDoc.id,
        name: data.displayName ?? data.name ?? data.email ?? 'Mensajero',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getMessengerPerformanceByDay = async (
  messengerId: string,
  date: string
): Promise<MessengerPerformanceReport> => {
  try {
    const [messengerName, deliveriesSnapshot] = await Promise.all([
      getUserDisplayName(messengerId),
      getDocs(
        query(
          collection(db, DELIVERIES_COLLECTION),
          where('courierId', '==', messengerId)
        )
      ),
    ]);

    const deliveries: MessengerDeliveryPerformance[] = deliveriesSnapshot.docs
      .map((deliveryDoc) => {
        const delivery = deliveryDoc.data();
        const assignedAt = toDate(delivery.assignedAt);
        const deliveredAt = toDate(delivery.deliveredAt);

        if (
          !assignedAt ||
          !deliveredAt ||
          !COMPLETED_DELIVERY_STATUSES.includes(String(delivery.status)) ||
          !isSameInputDay(assignedAt, date)
        ) {
          return null;
        }

        return {
          orderId: String(delivery.orderId || delivery.orderCode || deliveryDoc.id),
          assignedAt: assignedAt.toISOString(),
          deliveredAt: deliveredAt.toISOString(),
          elapsedTimeMinutes: getElapsedMinutes(assignedAt, deliveredAt),
        };
      })
      .filter((delivery): delivery is MessengerDeliveryPerformance => Boolean(delivery))
      .sort(
        (a, b) =>
          new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime()
      );

    const totalElapsedTime = deliveries.reduce(
      (total, delivery) => total + delivery.elapsedTimeMinutes,
      0
    );

    return {
      messengerId,
      messengerName,
      date,
      totalDeliveries: deliveries.length,
      averageDeliveryTimeMinutes:
        deliveries.length > 0 ? Math.round(totalElapsedTime / deliveries.length) : 0,
      deliveries,
    };
  } catch (error) {
    console.error('Messenger performance query failed', error);
    throw error;
  }
};
