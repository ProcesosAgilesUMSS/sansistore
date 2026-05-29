import { useState } from "react";
import { assignCourierToDelivery } from "../services/assignCourierToDelivery"
import { db } from "../../../lib/firebase";

export const useAssignOrdersToDelivery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  const assingToDelivery = async (deliveryId: string, orderId: string, courierId: string, reassign: boolean = false): Promise<void> => {

    setIsLoading(true);
    setError(null);
    try {
      await assignCourierToDelivery(db, deliveryId, orderId, courierId, reassign);
    } catch {
      setError(reassign ? 'Error al reasignar el pedido.' : 'Error al asignar el pedido.');
    } finally {
      setIsLoading(false);
    }
  }
  return {
    assingToDelivery,
    isLoading,
    error,
    reset,
  }
}
