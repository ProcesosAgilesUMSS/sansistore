export interface CourierOrderItem {
	productId: string;
	name: string;
	unitPrice: number;
	quantity: number;
	subtotal: number;
}

export interface CourierOrder {
	id: string;
	displayId: string;
	buyerName: string;
	deliveryZone: string;
	productsTotal: number;
	additionalCharges: number;
	total: number;
	status: string;
	paymentStatus: string;
	paymentStatusLabel: string;
	paymentMethod: string;
	deliveryMethod: string;
	specialInstructions: string;
	paymentId: string | null;
	createdAt: Date | null;
	deliveredAt: Date | null;
	items: CourierOrderItem[];
	paymentCollectedAt?: Date | null; // NUEVO: Cuándo se registró el pago
	collectedBy?: string; // NUEVO: ID del mensajero que cobró
}

export interface CourierDashboardStats {
	pendingCount: number;
	deliveredTodayCount: number;
	pendingCashTotal: number;
}

export interface MessengerOrderItem {
	id: string;
	name: string;
	quantity: number;
	price: number;
}

export interface MessengerOrder {
    id: string;
    displayId?: string;
    deliveryId: string;
    secret?: string;
    paymentId: string | null;
    customerName: string;
    buyerName: string;
    phone: string;
    address: string;
    city: string;
    locationLabel?: string;
    deliveryLat?: number | null;
    deliveryLng?: number | null;
    reference?: string;
    items: MessengerOrderItem[];
    cashToCollect: number;
    paymentMethod: 'cash_on_delivery';
    paymentStatus: string;
    paymentStatusLabel: string;
    paymentCollectedAt: Date | null;
    collectedBy: string | null;
    deliveryMethod: string;
    deliveryStatus:
    | 'assigned'
    | 'accepted'
    | 'in_transit'
    | 'delivered'
    | 'not_delivered'
    | 'pending_reassignment'
    | 'cancelled'
    | 'reprogrammed';
    assignedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    reprogrammedAt: Date | null;
    newDeliveryAt: Date | null;
    reprogramReason: string | null;
    rejectionReason?: string;
}

export interface MessengerShiftOrderSnapshot {
	id: string;
	deliveryId: string;
	customerName: string;
	buyerName: string;
	phone: string;
	address: string;
	city: string;
	deliveryStatus: MessengerOrder["deliveryStatus"];
	paymentStatus: string;
	paymentStatusLabel: string;
	cashToCollect: number;
	paymentCollectedAt: Date | null;
	assignedAt: Date | null;
	updatedAt: Date | null;
	items: MessengerOrderItem[];
}

export interface MessengerShiftSummary {
	completedCount: number;
	pendingCount: number;
	notDeliveredCount: number;
	cancelledCount: number;
	totalCollected: number;
}

export interface MessengerShiftClosure {
	id: string;
	courierId: string;
	dateKey: string;
	status: "closed";
	startedAt: Date | null;
	closedAt: Date | null;
	createdAt: Date | null;
	summary: MessengerShiftSummary;
	completedOrders: MessengerShiftOrderSnapshot[];
	pendingOrders: MessengerShiftOrderSnapshot[];
	incidentOrders: MessengerShiftOrderSnapshot[];
}
