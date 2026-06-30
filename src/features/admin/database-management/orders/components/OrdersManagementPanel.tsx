import DeleteOrderModal from "./DeleteOrderModal";
import EditOrderModal from "./EditOrderModal";
import OrdersFilters from "./OrdersFilters";
import OrdersTable from "./OrdersTable";
import { useOrdersAdmin } from "../useOrdersAdmin";

export default function OrdersManagementPanel() {
  const {
    orders,
    loading,
    error,
    filters,
    setFilters,
    orderToEdit,
    setOrderToEdit,
    saving,
    handleSaveEdit,
    orderToDelete,
    setOrderToDelete,
    deleting,
    handleConfirmDelete,
    fetchOrders,
  } = useOrdersAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-(--theme-text)">
          Gestión de órdenes
        </h1>
        <p className="text-sm text-(--theme-text)/50 mt-1">
          Edita o elimina órdenes sin acceder directamente a Firestore.
        </p>
      </div>

      {/* Filtros */}
      <OrdersFilters
        filters={filters}
        onChange={setFilters}
        onRefresh={fetchOrders}
      />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-16 text-(--theme-text)/40 text-sm">
          Cargando órdenes…
        </div>
      ) : (
        <>
          {/* Contador */}
          <p className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/40">
            {orders.length} {orders.length === 1 ? "orden encontrada" : "órdenes encontradas"}
          </p>

          {/* Tabla */}
          <OrdersTable
            orders={orders}
            onEdit={setOrderToEdit}
            onDelete={setOrderToDelete}
          />
        </>
      )}

      {/* Modal editar */}
      {orderToEdit && (
        <EditOrderModal
          order={orderToEdit}
          saving={saving}
          onSave={handleSaveEdit}
          onClose={() => setOrderToEdit(null)}
        />
      )}

      {/* Modal eliminar */}
      {orderToDelete && (
        <DeleteOrderModal
          orderName={orderToDelete.customerName}
          orderId={orderToDelete.id}
          deleting={deleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setOrderToDelete(null)}
        />
      )}
    </div>
  );
}