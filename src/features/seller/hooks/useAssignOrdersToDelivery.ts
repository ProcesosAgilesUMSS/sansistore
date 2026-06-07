import { useState } from "react";
import { assignCourierToDelivery, reassignCourierToDelivery } from "../services/assignCourierToDelivery"
import { db } from "../../../lib/firebase";

export const useAssignOrdersToDelivery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  const assingToDelivery = async (orderId: string, courierId: string): Promise<void> => {

    setIsLoading(true);
    setError(null);
    try {
      await assignCourierToDelivery(db, orderId, courierId);
    } catch {
      setError('Error al asignar el pedido.');
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

export const useRessignOrdersToDelivery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  const reassingToDelivery = async (deliveryId: string, orderId: string, courierId: string): Promise<void> => {

    setIsLoading(true);
    setError(null);
    try {
      await reassignCourierToDelivery(db, deliveryId, orderId, courierId);
    } catch {
      setError('Error al reasignar el pedido.');
    } finally {
      setIsLoading(false);
    }
  }
  return {
    reassingToDelivery,
    isLoading,
    error,
    reset,
  }
}
