import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteOrder,
  getOrders,
  updateOrder,
} from "./services/ordersAdminService";
import type {
  AdminOrder,
  OrderFilters,
  UpdateOrderPayload,
} from "./types";

export function useOrdersAdmin() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<OrderFilters>({
    search: "",
    status: "TODOS",
  });

  const [orderToEdit, setOrderToEdit] = useState<AdminOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<AdminOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cargar órdenes desde Firestore
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (e) {
      setError("Error al cargar las órdenes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filtrar órdenes según búsqueda y estado
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(filters.search.toLowerCase());

      const matchStatus =
        filters.status === "TODOS" || order.status === filters.status;

      return matchSearch && matchStatus;
    });
  }, [orders, filters]);

  // Guardar edición
  const handleSaveEdit = async (payload: UpdateOrderPayload) => {
    if (!orderToEdit) return;
    setSaving(true);
    try {
      await updateOrder(orderToEdit.id, payload);
      await fetchOrders();
      setOrderToEdit(null);
    } catch (e) {
      setError("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await deleteOrder(orderToDelete.id);
      await fetchOrders();
      setOrderToDelete(null);
    } catch (e) {
      setError("Error al eliminar la orden.");
    } finally {
      setDeleting(false);
    }
  };

  return {
    // Data
    orders: filteredOrders,
    loading,
    error,
    // Filtros
    filters,
    setFilters,
    // Modal editar
    orderToEdit,
    setOrderToEdit,
    saving,
    handleSaveEdit,
    // Modal eliminar
    orderToDelete,
    setOrderToDelete,
    deleting,
    handleConfirmDelete,
    // Recargar
    fetchOrders,
  };
}