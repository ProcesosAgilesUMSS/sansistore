import type { Order } from '../types';
import OrderCard from './OrderCard';

interface OrderListProps {
  orders: Order[];
}

export default function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-2xl opacity-60">
        Aún no has realizado ninguna compra.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
        />
      ))}
    </div>
  );
}
