import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import PaymentSuccessModal from '../modals/PaymentSuccessModal';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    DollarSign,
    Eye,
    MapPin,
    Package,
    Phone,
    Send,
    Truck,
    X,
    XCircle,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { getSellerData } from '../../location/services/locationService';
import { auth } from '../../../lib/firebase';
import { parseOrderId } from '../../cart/services/orderService';
import {
    markMessengerOrderAsCancelledByNoPayment,
    markMessengerOrderAsNotDelivered,
    registerMessengerCashPayment,
    setMessengerOrderStatus,
    subscribeToMessengerOrders,
} from '../services/messengerOrdersService';
import type { MessengerOrder } from '../types';
import {
    sortAcceptedOrdersByAge,
    type AcceptedOrderSort,
} from '../utils/acceptedOrderSorting';
import { getDeliveryStatusLabel } from '../utils/deliveryStatusFlow';
import {
    getCollectedOrdersForDay,
    getCollectedTotal,
    getCollectedTotalForDay,
    isMessengerOrderCollected,
} from '../utils/collectionSummary';
import { formatBolivianos } from '../utils/money';
import UndeliveredModal from '../modals/UndeliveredModal';

import CancelNoPaymentModal from '../modals/CancelNoPaymentModal';
import './MessengerDashboard.css';
import ConfirmPaymentModal from '../modals/Confirmpaymentmodal';

const DEV_COURIER_ID = 'user-nadia';

const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const formatOrderAgeDate = (order: MessengerOrder) => {
    const date = order.assignedAt ?? order.createdAt ?? order.updatedAt;

    if (!date) return 'Fecha no disponible';

    return new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

function CopyableOrderId({
    order,
    codeClassName,
}: {
    order: MessengerOrder;
    codeClassName: string;
}) {
    const { uuid, friendlyName } = parseOrderId(order.id);
    const copyOrderId = () => {
        void navigator.clipboard?.writeText(order.id);
    };

    return (
        <button
            className="block text-left"
            onClick={copyOrderId}
            title="Copiar ID del pedido"
            type="button"
        >
            <p className="font-mono text-[10px] font-bold opacity-40">{uuid}</p>
            <h3 className={codeClassName}>{friendlyName}</h3>
        </button>
    );
}

const getOrderDisplayId = (order: MessengerOrder) => parseOrderId(order.id).friendlyName;

const formatDeliveryStatus = (status: MessengerOrder['deliveryStatus']) => {
    return getDeliveryStatusLabel(status);
};

const getStatusUpdateMessage = (status: MessengerOrder['deliveryStatus']) => {
    if (status === 'accepted') return 'Pedido aceptado correctamente.';
    if (status === 'in_transit') return 'Entrega iniciada correctamente.';
    if (status === 'pending_reassignment') {
        return 'Pedido rechazado y enviado a reasignacion.';
    }

    return `Estado actualizado a ${getDeliveryStatusLabel(status)}.`;
};

const buildBuyerMapUrl = (order: MessengerOrder) => {
    const url = new URL('/mapa', window.location.origin);

    if (order.deliveryLat != null && order.deliveryLng != null) {
        url.searchParams.set('lat', String(order.deliveryLat));
        url.searchParams.set('lng', String(order.deliveryLng));
    }

    url.searchParams.set('order', order.id);

    return url.toString();
};

const storeBuyerMapOrder = (order: MessengerOrder) => {
    localStorage.setItem(
        'courier_panel_order',
        JSON.stringify({
            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            reference: order.reference || order.locationLabel,
            items: order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
            })),
            cashToCollect: order.cashToCollect,
        })
    );
};





const openDeliveryMap = (order: MessengerOrder) => {
    storeBuyerMapOrder(order);
    window.location.href = buildBuyerMapUrl(order);
};

const canCancelByNoPayment = (order: MessengerOrder) => {
    const paymentText = `${order.paymentStatus} ${order.paymentStatusLabel}`
        .toLowerCase()
        .trim();

    return (
        (order.deliveryStatus === 'accepted' || order.deliveryStatus === 'in_transit') &&
        !paymentText.includes('cobrado') &&
        !paymentText.includes('pagado') &&
        !paymentText.includes('cancelado')
    );
};

function MessageToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [message, onDismiss]);

    const isError =
        message.toLowerCase().includes('error') ||
        message.toLowerCase().includes('no se pudo');

    return (
        <div
            className={`messenger-toast mt-6 mb-6 flex items-center gap-4 rounded-[20px] border-2 px-5 py-4 text-sm font-bold shadow-lg ${isError ? 'messenger-toast--error' : 'messenger-toast--success'
                }`}
        >
            <span className="messenger-toast-dot h-2.5 w-2.5 shrink-0 rounded-full" />
            <span className="flex-1">{message}</span>
            <button
                className="messenger-toast-close ml-2 opacity-50 transition hover:opacity-100"
                onClick={onDismiss}
                type="button"
            >
                <X size={15} />
            </button>
        </div>
    );
}

function NewOrderToast({
    count,
    onDismiss,
}: {
    count: number;
    onDismiss: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [count, onDismiss]);

    const pedidoLabel = count === 1 ? 'pedido' : 'pedidos';

    return (
        <aside
            aria-live="polite"
            className="messenger-new-order-toast"
            role="status"
        >
            <div className="flex items-start gap-4">
                <span className="messenger-new-order-icon inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                    <Package size={24} />
                </span>

                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black">Nuevo pedido disponible</h3>
                    <p className="messenger-copy mt-1 text-sm font-semibold">
                        Tienes {count} {pedidoLabel} por revisar.
                    </p>
                </div>

                <button
                    aria-label="Cerrar alerta de nuevo pedido"
                    className="messenger-new-order-close inline-flex h-8 w-8 items-center justify-center rounded-full transition"
                    onClick={onDismiss}
                    type="button"
                >
                    <X size={17} />
                </button>
            </div>

            <div className="messenger-new-order-progress mt-4" aria-hidden="true">
                <span />
            </div>

            <p className="messenger-copy mt-2 text-xs font-semibold">
                Se cerrará automáticamente en unos segundos.
            </p>
        </aside>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    featured = false,
}: {
    icon: ReactNode;
    label: string;
    value: string | number;
    featured?: boolean;
}) {
    return (
        <article
            className={`messenger-summary-card rounded-[28px] border px-7 py-8 shadow-[0_14px_30px_rgba(38,33,22,0.10)] ${featured ? 'messenger-summary-card--featured' : ''
                }`}
        >
            <div className="flex items-center gap-4">
                <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${featured ? 'messenger-icon--featured' : 'messenger-icon'
                        }`}
                >
                    {icon}
                </span>
                <span className="messenger-muted text-sm font-medium">{label}</span>
            </div>
            <p className="mt-4 text-3xl font-black tracking-normal">{value}</p>
        </article>
    );
}

function PendingOrderCard({
    order,
    onAccept,
    onDelivered,
    onCancelNoPayment,
    onDetail,
    onInTransit,
    onNotDelivered,
    onReject,
}: {
    order: MessengerOrder;
    onAccept: (orderId: string) => void;
    onDelivered: (order: MessengerOrder) => void;
    onCancelNoPayment: (order: MessengerOrder) => void;
    onDetail: (order: MessengerOrder) => void;
    onInTransit: (orderId: string) => void;
    onNotDelivered: (order: MessengerOrder) => void;
    onReject: (orderId: string) => void;
}) {
    const [sellerLocationUrl, setSellerLocationUrl] = useState<string | null>(null);
    const customerLocationUrl = useMemo(() => {
        return buildBuyerMapUrl(order);
    }, [order]);

    const [sellerData, setSellerData] = useState<Awaited<ReturnType<typeof getSellerData>> | null>(null);

    useEffect(() => {
        getSellerData(order.id).then(setSellerData).catch(() => setSellerData(null));
    }, [order.id]);

    const openSellerMap = () => {
        if (!sellerData) return;

        localStorage.setItem(
            'courier_panel_seller',
            JSON.stringify({
                customerName: sellerData.sellerName ?? 'Vendedor',
                phone: sellerData.sellerPhone ?? '',
                address: sellerData.address,
                reference: null,
                items: [],
                cashToCollect: 0,
            })
        );

        const url = new URL('/mapa', window.location.origin);
        url.searchParams.set('lat', String(sellerData.lat));
        url.searchParams.set('lng', String(sellerData.lng));
        url.searchParams.set('order', order.id);
        url.searchParams.set('mode', 'seller');
        window.location.href = url.toString();
    };
    return (
        <article className="messenger-order-card rounded-[28px] border p-6 shadow-[0_14px_30px_rgba(38,33,22,0.10)]">
            <div className="messenger-order-grid grid gap-8">
                <div>
                    <div className="mb-6 flex items-center gap-3">
                        <CopyableOrderId order={order} codeClassName="text-base font-black" />
                        <span className="messenger-status-badge rounded-full px-3 py-1 text-xs font-bold">
                            {formatDeliveryStatus(order.deliveryStatus)}
                        </span>
                        <span className="messenger-charge-badge rounded-full px-3 py-1 text-xs font-bold">
                            {order.paymentStatusLabel.toUpperCase()}
                        </span>
                    </div>

                    <div className="messenger-copy space-y-4 text-sm">
                        {(order.deliveryStatus === 'accepted' ||
                            order.deliveryStatus === 'in_transit') && (
                                <div>
                                    <p className="messenger-muted mb-1 text-xs">Asignado</p>
                                    <p className="font-bold">{formatOrderAgeDate(order)}</p>
                                </div>
                            )}

                        <div>
                            <p className="messenger-muted mb-1 text-xs">Cliente</p>
                            <p className="font-bold">{order.customerName}</p>
                        </div>

                        <p className="flex items-center gap-2">
                            <Phone size={16} />
                            <a className="hover:text-green-600" href={`tel:${order.phone}`}>
                                {order.phone}
                            </a>
                        </p>

                        <p className="flex items-start gap-2">
                            <MapPin className="mt-0.5 shrink-0" size={16} />
                            <span>
                                {order.address}
                                <span className="messenger-muted block text-xs">
                                    {order.city}
                                </span>
                            </span>
                        </p>

                        {order.reference && (
                            <p className="messenger-reference border-l-4 px-3 py-3 text-xs font-medium">
                                {order.reference}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <p className="messenger-muted mb-3 text-xs font-medium">Productos</p>
                    <div className="space-y-3">
                        {order.items.map((item) => (
                            <p
                                className="messenger-copy flex items-center gap-2 text-sm"
                                key={item.id}
                            >
                                <Package size={16} />
                                <span>
                                    {item.quantity}x {item.name} — {formatBolivianos(item.price)}
                                </span>
                            </p>
                        ))}
                    </div>

                    <div className="messenger-cash-box mt-5 rounded-2xl border-2 p-5">
                        <p className="text-xs font-medium uppercase">Monto a cobrar</p>
                        <p className="mt-2 text-3xl font-black">
                            {formatBolivianos(order.cashToCollect)}
                        </p>
                        <p className="messenger-copy mt-1 text-xs">en efectivo</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a
                        className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                        href={customerLocationUrl}
                        onClick={() => storeBuyerMapOrder(order)}
                    >
                        <Send size={17} />
                        Abrir Maps
                    </a>

                    {order.deliveryStatus !== 'assigned' && (
                        <button
                            className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                            onClick={() => onDetail(order)}
                            type="button"
                        >
                            <Eye size={17} />
                            Ver detalle
                        </button>
                    )}

                    {order.deliveryStatus === 'assigned' && (
                        <>
                            <button
                                className="messenger-deliver-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition"
                                onClick={() => onAccept(order.id)}
                                type="button"
                            >
                                <CheckCircle2 size={17} />
                                Aceptar pedido
                            </button>
                            <button
                                className="messenger-reject-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                                onClick={() => onReject(order.id)}
                                type="button"
                            >
                                <XCircle size={17} />
                                Rechazar
                            </button>
                        </>
                    )}

                    {order.deliveryStatus === 'accepted' && (
                        <button
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-blue-700"
                            onClick={() => onInTransit(order.id)}
                            type="button"
                        >
                            <Truck size={17} />
                            Iniciar entrega
                        </button>
                    )}

                    {order.deliveryStatus === 'in_transit' && (
                        <>
                            <button
                                className="messenger-deliver-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition"
                                onClick={() => onDelivered(order)}
                                type="button"
                            >
                                <CheckCircle2 size={17} />
                                Registrar pago
                            </button>
                            <button
                                className="messenger-reject-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                                onClick={() => onCancelNoPayment(order)}
                                type="button"
                            >
                                <DollarSign size={17} />
                                Cancelar por falta de pago
                            </button>
                            <button
                                className="messenger-reject-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                                onClick={() => onNotDelivered(order)}
                                type="button"
                            >
                                <AlertTriangle size={17} />
                                No entregado
                            </button>
                        </>
                    )}
                </div>
                <button
                    className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                    disabled={!sellerData}
                    onClick={openSellerMap}
                    type="button"
                >
                    <Send size={17} />
                    Ubi. Vendedor
                </button>
            </div>
        </article>
    );
}

// MODIFICADO: Se agregó la fecha de entrega
function DeliveredOrderRow({ order }: { order: MessengerOrder }) {
    const deliveryDate = order.paymentCollectedAt || order.updatedAt || order.createdAt;
    return (
        <article className="messenger-delivered-row flex items-center justify-between gap-4 rounded-[26px] border p-6 shadow-[0_10px_24px_rgba(18,32,56,0.06)]">
            <div className="flex items-center gap-4">
                <span className="messenger-icon inline-flex h-10 w-10 items-center justify-center rounded-full">
                    <CheckCircle2 size={20} />
                </span>
                <div>
                    <CopyableOrderId order={order} codeClassName="font-black" />
                    <p className="messenger-copy text-sm">{order.customerName}</p>
                    <p className="messenger-muted mt-1 text-xs">
                        Entregado: {formatDate(deliveryDate)}
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
                <span className="messenger-delivered-badge rounded-full px-3 py-1 text-xs font-bold">
                    Entregado
                </span>
                <strong>{formatBolivianos(order.cashToCollect)}</strong>
            </div>
        </article>
    );
}

function OrderDetailModal({
    order,
    onClose,
    onDelivered,
    onCancelNoPayment,
    onNotDelivered,
}: {
    order: MessengerOrder;
    onClose: () => void;
    onDelivered: (order: MessengerOrder) => void;
    onCancelNoPayment: (order: MessengerOrder) => void;
    onNotDelivered: (order: MessengerOrder) => void;
}) {
    const subtotal = order.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
    const deliveryCost = Math.max(order.cashToCollect - subtotal, 0);

    return (
        <div
            className="fixed inset-0 z-[998] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-border-light bg-card-bg-light text-text-light shadow-2xl">
                <header className="flex items-start justify-between gap-4 border-b border-border-light px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-black tracking-normal">
                            Detalle de cobro del pedido
                        </h2>
                        <p className="text-sm font-semibold opacity-70">
                            Verifica el pedido antes de marcarlo como entregado.
                        </p>
                    </div>
                    <button
                        aria-label="Cerrar detalle"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
                        onClick={onClose}
                        type="button"
                    >
                        <X size={16} />
                    </button>
                </header>

                <div className="grid gap-5 p-6 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-5">
                        <article className="rounded-[24px] border border-border-light bg-secondary-bg-light/40 p-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <CopyableOrderId order={order} codeClassName="text-lg font-black" />
                                <span className="messenger-status-badge rounded-full px-3 py-1 text-xs font-bold">
                                    {formatDeliveryStatus(order.deliveryStatus)}
                                </span>
                                <span className="messenger-charge-badge rounded-full px-3 py-1 text-xs font-bold">
                                    {order.paymentStatusLabel.toUpperCase()}
                                </span>
                            </div>
                            <p className="messenger-muted mt-5 text-xs font-bold uppercase">
                                Cliente
                            </p>
                            <p className="text-xl font-black">{order.customerName}</p>
                        </article>

                        <article className="rounded-[24px] border border-border-light bg-secondary-bg-light/40 p-5">
                            <h3 className="mb-4 text-lg font-black">Productos</h3>
                            {order.items.length > 0 ? (
                                <div className="space-y-3">
                                    {order.items.map((item) => (
                                        <p
                                            className="messenger-copy flex items-center gap-2 text-sm"
                                            key={item.id}
                                        >
                                            <Package size={16} />
                                            <span>
                                                {item.quantity}x {item.name} -{' '}
                                                {formatBolivianos(item.price)}
                                            </span>
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <p className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm font-semibold">
                                    Este pedido no tiene items visibles en el documento.
                                </p>
                            )}
                        </article>

                        <article className="grid gap-4 rounded-[24px] border border-border-light bg-secondary-bg-light/40 p-5 sm:grid-cols-3">
                            <div>
                                <p className="messenger-muted text-xs font-bold uppercase">
                                    Metodo de pago
                                </p>
                                <p className="font-black">Contra entrega</p>
                            </div>
                            <div>
                                <p className="messenger-muted text-xs font-bold uppercase">
                                    Metodo de envio
                                </p>
                                <p className="font-black">Delivery</p>
                            </div>
                            <div>
                                <p className="messenger-muted text-xs font-bold uppercase">
                                    Condiciones especiales
                                </p>
                                <p className="font-black">{order.reference || 'Ninguna'}</p>
                            </div>
                        </article>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                className="messenger-map-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 px-6 text-sm font-bold transition"
                                onClick={() => openDeliveryMap(order)}
                                type="button"
                            >
                                <Send size={17} />
                                Abrir en Maps
                            </button>
                        </div>
                    </div>

                    <aside className="messenger-cash-box h-fit rounded-[24px] border-2 p-5">
                        <p className="text-xs font-bold uppercase">Te llevas a cobrar</p>
                        <p className="mt-2 text-3xl font-black">
                            {formatBolivianos(order.cashToCollect)}
                        </p>
                        <p className="messenger-copy mt-1 text-xs">
                            {order.items.length} items en este pedido
                        </p>
                        <div className="my-5 border-t border-border-light" />
                        <div className="space-y-3 text-sm font-bold">
                            <p className="flex justify-between gap-3">
                                <span>Subtotal</span>
                                <span>{formatBolivianos(subtotal)}</span>
                            </p>
                            <p className="flex justify-between gap-3">
                                <span>Costo de entrega</span>
                                <span>{formatBolivianos(deliveryCost)}</span>
                            </p>
                            <p className="flex justify-between gap-3">
                                <span>Descuento</span>
                                <span>{formatBolivianos(0)}</span>
                            </p>
                            <p className="flex justify-between gap-3 pt-4 text-primary">
                                <span>Total final</span>
                                <span>{formatBolivianos(order.cashToCollect)}</span>
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            {order.deliveryStatus === 'in_transit' && (
                                <button
                                    className="messenger-deliver-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition active:scale-95"
                                    onClick={() => {
                                        onDelivered(order);
                                        onClose();
                                    }}
                                    type="button"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>Registrar pago</span>
                                </button>
                            )}

                            {canCancelByNoPayment(order) && (
                                <button
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-500 bg-red-50 px-6 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
                                    onClick={() => {
                                        onClose();
                                        onCancelNoPayment(order);
                                    }}
                                    type="button"
                                >
                                    <DollarSign size={18} />
                                    <span>Cancelar por falta de pago</span>
                                </button>
                            )}

                            {(order.deliveryStatus === 'accepted' ||
                                order.deliveryStatus === 'in_transit') && (
                                    <button
                                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-500 bg-red-50 px-6 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
                                        onClick={() => {
                                            onClose();
                                            onNotDelivered(order);
                                        }}
                                        type="button"
                                    >
                                        <AlertTriangle size={18} />
                                        <span>No entregado</span>
                                    </button>
                                )}
                        </div>

                    </aside>
                </div>
            </section>
        </div>
    );
}

interface MessengerDashboardProps {
    embedded?: boolean;
    clientSection?: 'assigned' | 'accepted' | 'delivered' | 'not_delivered';
}

export default function MessengerDashboard({
    embedded = false,
    clientSection = 'assigned',
}: MessengerDashboardProps) {
    const [orders, setOrders] = useState<MessengerOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [detailOrder, setDetailOrder] = useState<MessengerOrder | null>(null);
    const [undeliveredOrder, setUndeliveredOrder] =
        useState<MessengerOrder | null>(null);
    const [savingUndelivered, setSavingUndelivered] = useState(false);
    const [cancelNoPaymentOrder, setCancelNoPaymentOrder] =
        useState<MessengerOrder | null>(null);
    const [savingCancelNoPayment, setSavingCancelNoPayment] = useState(false);
    const [confirmPaymentOrder, setConfirmPaymentOrder] = useState<MessengerOrder | null>(null);
    const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<MessengerOrder | null>(null);
    const [currentCourierId, setCurrentCourierId] = useState<string | null>(null);
    const [newOrderCount, setNewOrderCount] = useState(0);
    const [acceptedSortOrder, setAcceptedSortOrder] =
        useState<AcceptedOrderSort>('newest-first');
    const notifiedOrderIdsRef = useRef<Set<string>>(new Set());
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        let unsubscribeOrders: (() => void) | undefined;

        const startOrdersSubscription = (
            courierId: string,
            allowDevFallback = false
        ) => {
            setLoading(true);
            setMessage('');

            unsubscribeOrders?.();

            unsubscribeOrders = subscribeToMessengerOrders(
                courierId,
                (data) => {
                    if (
                        data.length === 0 &&
                        allowDevFallback &&
                        import.meta.env.PUBLIC_APP_ENV !== 'production' &&
                        courierId !== DEV_COURIER_ID
                    ) {
                        startOrdersSubscription(DEV_COURIER_ID, false);
                        return;
                    }

                    setOrders(data);
                    setLoading(false);
                },
                (error) => {
                    console.error(error);
                    setOrders([]);
                    setLoading(false);
                    setMessage('No se pudieron cargar las entregas del emulador.');
                }
            );
        };


        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            const devCourierId =
                import.meta.env.PUBLIC_APP_ENV !== 'production' ? DEV_COURIER_ID : null;
            const courierId = user?.uid || devCourierId;
            const allowDevFallback = !user;

            setCurrentCourierId(courierId);

            if (!courierId) {
                unsubscribeOrders?.();
                setOrders([]);
                setLoading(false);
                setMessage('Inicia sesion para ver tus entregas asignadas.');
                return;
            }

            startOrdersSubscription(courierId, allowDevFallback);
        });

        return () => {
            unsubscribeOrders?.();
            unsubscribeAuth();
        };
    }, []);

    const assignedOrders = useMemo(
        () =>
            sortAcceptedOrdersByAge(
                orders.filter((order) => order.deliveryStatus === 'assigned'),
                'newest-first'
            ),
        [orders]
    );

    const assignedOrderIdsKey = useMemo(
        () =>
            assignedOrders
                .map((order) => order.deliveryId || order.id)
                .sort()
                .join('|'),
        [assignedOrders]
    );

    useEffect(() => {
        if (loading || clientSection !== 'assigned') return;

        const currentOrderIds = assignedOrderIdsKey
            ? assignedOrderIdsKey.split('|')
            : [];

        // Primera carga: mostrar toast si hay pedidos, sin filtrar por sesión previa
        if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;

            if (currentOrderIds.length === 0) return;

            // Marcar todos como notificados para futuras comparaciones
            const storageKey = 'sansistore:messenger:notified-order-ids';
            const updatedIds = Array.from(new Set(currentOrderIds));
            try {
                sessionStorage.setItem(storageKey, JSON.stringify(updatedIds));
            } catch { /* ignorar */ }
            notifiedOrderIdsRef.current = new Set(updatedIds);

            setNewOrderCount(currentOrderIds.length);
            return;
        }

        // Cargas posteriores: solo nuevos pedidos que no se habían notificado
        if (currentOrderIds.length === 0) {
            setNewOrderCount(0);
            return;
        }

        const storageKey = 'sansistore:messenger:notified-order-ids';
        let storedIds: string[] = [];
        try {
            storedIds = JSON.parse(sessionStorage.getItem(storageKey) || '[]') as string[];
        } catch {
            storedIds = [];
        }

        const alreadyNotifiedIds = new Set([
            ...storedIds,
            ...Array.from(notifiedOrderIdsRef.current),
        ]);

        const newIds = currentOrderIds.filter((id) => !alreadyNotifiedIds.has(id));
        if (newIds.length === 0) return;

        const updatedIds = Array.from(new Set([...storedIds, ...currentOrderIds]));
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(updatedIds));
        } catch { /* ignorar */ }
        notifiedOrderIdsRef.current = new Set(updatedIds);
        setNewOrderCount(newIds.length);
    }, [assignedOrderIdsKey, clientSection, loading]);

    const acceptedOrders = useMemo(
        () =>
            orders.filter(
                (order) =>
                    order.deliveryStatus === 'accepted' ||
                    order.deliveryStatus === 'in_transit'
            ),
        [orders]
    );
    const sortedAcceptedOrders = useMemo(
        () => sortAcceptedOrdersByAge(acceptedOrders, acceptedSortOrder),
        [acceptedOrders, acceptedSortOrder]
    );

    // ✅ MODIFICADO: Se agregó ordenamiento por fecha descendente
    const deliveredOrders = useMemo(
        () => orders
            .filter(isMessengerOrderCollected)
            .sort((a, b) => {
                const dateA = a.paymentCollectedAt;
                const dateB = b.paymentCollectedAt;
                if (!dateA || !dateB) return 0;
                return dateB.getTime() - dateA.getTime();
            }),
        [orders]
    );
    const todayCollectedOrders = useMemo(
        () => getCollectedOrdersForDay(orders),
        [orders]
    );
    const todayCollectedTotal = useMemo(
        () => getCollectedTotalForDay(orders),
        [orders]
    );
    const collectedTotal = useMemo(() => getCollectedTotal(orders), [orders]);

    const notDeliveredOrders = useMemo(
        () =>
            sortAcceptedOrdersByAge(
                orders.filter((order) => order.deliveryStatus === 'not_delivered'),
                'newest-first'
            ),
        [orders]
    );

    const updateOrderStatus = async (
        orderId: string,
        status: MessengerOrder['deliveryStatus']
    ) => {
        const targetOrder = orders.find((order) => order.id === orderId);
        if (!targetOrder) return;

        setOrders((currentOrders) =>
            currentOrders.map((order) =>
                order.id === orderId
                    ? {
                        ...order,
                        deliveryStatus: status,
                    }
                    : order
            )
        );

        try {
            await setMessengerOrderStatus(targetOrder, status);
            setMessage(getStatusUpdateMessage(status));
        } catch (error) {
            console.error(error);
            setMessage('No se pudo actualizar el estado en Firestore.');
            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.id === orderId ? targetOrder : order
                )
            );
        }
    };

    const markAsDelivered = (order: MessengerOrder) => {
        setConfirmPaymentOrder(order);
    };

    const confirmPayment = async (order: MessengerOrder, secret: string) => {
        if (!currentCourierId) {
            throw new Error('No se pudo identificar al mensajero.');
        }

        if (order.paymentStatusLabel === 'Cobrado') {
            throw new Error('Este pedido ya tiene el pago registrado.');
        }

        // Validar secret contra order.secret (campo del tipo Order)
        if (secret !== order.secret) {
            throw new Error('Código incorrecto.');
        }

        const previousOrder = order;
        setOrders((currentOrders) =>
            currentOrders.map((currentOrder) =>
                currentOrder.id === order.id
                    ? {
                        ...currentOrder,
                        deliveryStatus: 'delivered',
                        paymentStatus: 'COBRADO',
                        paymentStatusLabel: 'Cobrado',
                        collectedBy: currentCourierId,
                        paymentCollectedAt: new Date(),
                    }
                    : currentOrder
            )
        );

        try {
            await registerMessengerCashPayment(order, currentCourierId);

            setConfirmPaymentOrder(null);

            setPaymentSuccessOrder(order);

        } catch (error) {
            console.error(error);
            setOrders((currentOrders) =>
                currentOrders.map((currentOrder) =>
                    currentOrder.id === previousOrder.id ? previousOrder : currentOrder
                )
            );
            throw error; // el modal captura y muestra el error
        }
    };


    const acceptOrder = (orderId: string) => {
        void updateOrderStatus(orderId, 'accepted');
    };

    const markAsInTransit = (orderId: string) => {
        void updateOrderStatus(orderId, 'in_transit');
    };

    const rejectOrder = (orderId: string) => {
        void updateOrderStatus(orderId, 'pending_reassignment');
    };

    const registerUndeliveredOrder = async (reason: string, notes: string) => {
        if (!undeliveredOrder) return;
        if (!currentCourierId) {
            setMessage(
                'No se pudo identificar al mensajero para registrar el problema.'
            );
            return;
        }

        const targetOrder = undeliveredOrder;
        setSavingUndelivered(true);
        setOrders((currentOrders) =>
            currentOrders.map((order) =>
                order.id === targetOrder.id
                    ? { ...order, deliveryStatus: 'not_delivered' }
                    : order
            )
        );

        try {
            await markMessengerOrderAsNotDelivered({
                order: targetOrder,
                reason,
                notes,
                courierId: currentCourierId,
            });
            setMessage('Problema registrado y pedido marcado como no entregado.');
            setUndeliveredOrder(null);
        } catch (error) {
            console.error(error);
            setMessage('No se pudo registrar el incidente en Firestore.');
            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.id === targetOrder.id ? targetOrder : order
                )
            );
        } finally {
            setSavingUndelivered(false);
        }
    };

    const registerCancelNoPayment = async (notes: string) => {
        if (!cancelNoPaymentOrder) return;

        const targetOrder = cancelNoPaymentOrder;
        setSavingCancelNoPayment(true);

        setOrders((currentOrders) =>
            currentOrders.map((order) =>
                order.id === targetOrder.id
                    ? {
                        ...order,
                        deliveryStatus: 'cancelled',
                        paymentStatus: 'CANCELADO',
                        paymentStatusLabel: 'Cancelado por falta de pago',
                    }
                    : order
            )
        );

        try {
            await markMessengerOrderAsCancelledByNoPayment({
                order: targetOrder,
                notes,
                courierId: currentCourierId,
            });

            setMessage('Pedido cancelado por falta de pago.');
            setCancelNoPaymentOrder(null);
        } catch (error) {
            console.error(error);
            setMessage('No se pudo cancelar el pedido por falta de pago.');

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.id === targetOrder.id ? targetOrder : order
                )
            );
        } finally {
            setSavingCancelNoPayment(false);
        }
    };

    const activeOrders =
        clientSection === 'assigned'
            ? assignedOrders
            : clientSection === 'not_delivered'
                ? notDeliveredOrders
                : sortedAcceptedOrders;
    const activeTitle =
        clientSection === 'assigned'
            ? 'Gestión Entregas'
            : clientSection === 'accepted'
                ? 'Pedidos aceptados'
                : clientSection === 'not_delivered'
                    ? 'No entregados'
                    : 'Entregados';
    const activeDescription =
        clientSection === 'assigned'
            ? 'Acepta o rechaza los pedidos asignados antes de iniciar la entrega.'
            : clientSection === 'accepted'
                ? 'Organiza tus entregas, revisa direcciones y cambia el estado de cada pedido.'
                : clientSection === 'not_delivered'
                    ? 'Revisa los pedidos con incidente registrado durante la jornada.'
                    : 'Revisa las entregas completadas y el monto cobrado durante la jornada.';

    return (
        <main
            className={`messenger-dashboard ${embedded ? 'messenger-dashboard--embedded' : 'min-h-screen'}`}
        >
            {newOrderCount > 0 && clientSection === 'assigned' && (
                <NewOrderToast
                    count={newOrderCount}
                    onDismiss={() => setNewOrderCount(0)}
                />
            )}
            {!embedded && (
                <header className="messenger-header border-b">
                    <div className="messenger-header-inner flex items-center justify-between">
                        <a className="text-xl font-black tracking-normal" href="/">
                            sansi <span className="messenger-logo-accent">store</span>
                        </a>

                        <div className="flex gap-2">
                            <a
                                className="messenger-buyer-link inline-flex h-10 items-center justify-center rounded-full border px-6 text-sm font-bold"
                                href="/"
                            >
                                Comprador
                            </a>
                            <a
                                className="messenger-courier-link inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-bold"
                                href="/courier"
                            >
                                Mensajero
                            </a>
                        </div>
                    </div>
                </header>
            )}

            <div className="messenger-container">
                <section className="mb-10">
                    <p className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
                        Operacion de entregas
                    </p>
                    <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                        {activeTitle}
                    </h1>
                    <p className="messenger-copy mt-2 max-w-2xl text-sm font-semibold">
                        {activeDescription}
                    </p>
                </section>

                {message && (
                    <MessageToast message={message} onDismiss={() => setMessage('')} />
                )}

                {loading && (
                    <div className="messenger-order-card mt-6 rounded-[26px] border p-8 text-sm font-semibold">
                        Cargando entregas...
                    </div>
                )}

                {!loading && clientSection !== 'delivered' ? (
                    <>
                        <section className="messenger-summary-grid grid gap-5">
                            <SummaryCard
                                icon={<Clock3 size={20} />}
                                label={
                                    clientSection === 'assigned' ? 'Asignados' : 'Pendientes'
                                }
                                value={activeOrders.length}
                            />
                            <SummaryCard
                                featured
                                icon={<DollarSign size={20} />}
                                label="Total a Cobrar"
                                value={formatBolivianos(
                                    activeOrders.reduce(
                                        (total, order) => total + order.cashToCollect,
                                        0
                                    )
                                )}
                            />
                        </section>

                        <section className="mt-11">
                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-2xl font-black tracking-[-0.04em]">
                                    {clientSection === 'assigned'
                                        ? 'Pedidos asignados'
                                        : clientSection === 'not_delivered'
                                            ? 'Pedidos no entregados'
                                            : 'Pedidos pendientes'}
                                </h2>

                                {clientSection === 'accepted' && activeOrders.length > 0 && (
                                    <label className="flex w-full flex-col gap-2 text-sm font-bold text-text-light sm:w-auto sm:flex-row sm:items-center">
                                        <span className="messenger-muted">Ordenar por</span>
                                        <select
                                            value={acceptedSortOrder}
                                            onChange={(event) =>
                                                setAcceptedSortOrder(
                                                    event.target.value as AcceptedOrderSort
                                                )
                                            }
                                            className="rounded-2xl border-2 border-border-light bg-card-bg-light px-4 py-3 text-sm font-bold text-text-light outline-none transition focus:border-primary"
                                        >
                                            <option value="oldest-first">
                                                Más antiguos primero
                                            </option>
                                            <option value="newest-first">
                                                Más recientes primero
                                            </option>
                                        </select>
                                    </label>
                                )}
                            </div>

                            <div className="space-y-6">
                                {activeOrders.length > 0 ? (
                                    activeOrders.map((order) => (
                                        <PendingOrderCard
                                            key={order.id}
                                            order={order}
                                            onAccept={acceptOrder}
                                            onCancelNoPayment={setCancelNoPaymentOrder}
                                            onDelivered={markAsDelivered}
                                            onDetail={setDetailOrder}
                                            onInTransit={markAsInTransit}
                                            onNotDelivered={setUndeliveredOrder}
                                            onReject={rejectOrder}
                                        />
                                    ))
                                ) : (
                                    <div className="messenger-order-card rounded-[28px] border p-8 text-sm font-semibold">
                                        {clientSection === 'assigned'
                                            ? 'No hay pedidos asignados.'
                                            : clientSection === 'not_delivered'
                                                ? 'No hay pedidos no entregados.'
                                                : 'No hay pedidos pendientes.'}
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                ) : !loading ? (
                    <>
                        <section className="messenger-summary-grid grid gap-5">
                            <SummaryCard
                                icon={<CheckCircle2 size={20} />}
                                label="Cobrados en la jornada"
                                value={todayCollectedOrders.length}
                            />
                            <SummaryCard
                                icon={<CheckCircle2 size={20} />}
                                label="Cobrado en la jornada"
                                value={formatBolivianos(todayCollectedTotal)}
                            />
                            <SummaryCard
                                featured
                                icon={<DollarSign size={20} />}
                                label="Total cobrado"
                                value={formatBolivianos(collectedTotal)}
                            />

                        </section>

                        <section className="mt-11">
                            <h2 className="mb-6 text-2xl font-black tracking-[-0.04em]">
                                Historial
                            </h2>

                            <div className="space-y-4">
                                {deliveredOrders.length > 0 ? (
                                    deliveredOrders.map((order) => (
                                        <DeliveredOrderRow key={order.id} order={order} />
                                    ))
                                ) : (
                                    <div className="messenger-order-card rounded-[28px] border p-8 text-sm font-semibold">
                                        No hay entregas completadas.
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                ) : null}
            </div>

            {detailOrder && (
                <OrderDetailModal
                    order={detailOrder}
                    onClose={() => setDetailOrder(null)}
                    onCancelNoPayment={setCancelNoPaymentOrder}
                    onDelivered={markAsDelivered}
                    onNotDelivered={setUndeliveredOrder}
                />
            )}

            {undeliveredOrder && (
                <UndeliveredModal
                    isSaving={savingUndelivered}
                    order={undeliveredOrder}
                    onClose={() => setUndeliveredOrder(null)}
                    onConfirm={registerUndeliveredOrder}
                />
            )}
            {cancelNoPaymentOrder && (
                <CancelNoPaymentModal
                    isSaving={savingCancelNoPayment}
                    order={cancelNoPaymentOrder}
                    onClose={() => setCancelNoPaymentOrder(null)}
                    onConfirm={registerCancelNoPayment}
                />
            )}
            {confirmPaymentOrder && (
                <ConfirmPaymentModal
                    order={confirmPaymentOrder}
                    onClose={() => setConfirmPaymentOrder(null)}
                    onConfirm={confirmPayment}
                />
            )}
            {paymentSuccessOrder && (
                <PaymentSuccessModal
                    onClose={() => setPaymentSuccessOrder(null)}
                />
            )}
        </main>
    );
}
