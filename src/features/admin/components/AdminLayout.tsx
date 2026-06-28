import {
	Activity,
	BarChart2,
	Bike,
	ChevronRight,
	ClipboardList,
	FileText,
	Menu,
	Scale,
	Settings,
	ShoppingBag,
	Tag,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import SalesReport from "../analytics/components/SalesReport.tsx";
import AccessLogPanel from "../audit/components/AccessLogPanel.tsx";
import CategoryList from "../categories/components/CategoryList.tsx";
import DemandPanel from "../demand/components/DemandPanel.tsx";
import MessengerPerformancePage from "../messengers/performance/MessengerPerformancePage.tsx";
import SellerActivityPanel from "../monitoring/components/SellerActivityPanel.tsx";
import OrderReceptionPanel from "../orders/components/OrderReceptionPanel.tsx";
import OrderHistory from "../pedidos/components/OrderHistory.tsx";
import PaymentAuditPanel from "../pedidos/payment-audit/components/PaymentAuditPanel.tsx";
import PaymentReconciliationPanel from "../reconciliation/components/PaymentReconciliationPanel.tsx";
import CancelledOrdersReport from "../reports/components/CancelledOrdersReport.tsx";
import ConfigPanel from "../settings/components/ConfigPanel.tsx";
import UserManagement from "../users/components/UserManagement.tsx";
import DailySales from "../ventas/components/DailySales.tsx";
import TopSellingProducts from "../ventas/top-products/components/TopSellingProducts.tsx";
import CourierSessionsValidation from "../messengers/sessions/components/CourierSessionsValidation.tsx";

type Section =
	| "pedidos"
	| "historial"
	| "auditoria-cobros"
	| "conciliacion-pagos"
	| "usuarios"
	| "categorias"
	| "ventas-diarias"
	| "mas-vendidos"
	| "mensajeros-desempeno"
	| "mensajeros-cierres"
	| "parametros"
	| "reportes"
	| "reportes-cancelados"
	| "bitacora"
	| "monitoreo"
	| "demanda-horarios"
	| null;

interface NavItem {
	label: string;
	icon: React.ReactNode;
	section: Section;
	badge?: number;
	disabled?: boolean;
}

interface NavSection {
	title: string;
	items: NavItem[];
}

interface AdminLayoutProps {
	initialSection?: Exclude<Section, null>;
}

type OpenGroup = "pedidos" | "ventas" | "mensajeros" | "reportes" | null;

function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
	return (
		<div
			className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
		>
			<div className="overflow-hidden">
				<div className="mt-1 space-y-1 pl-7">{children}</div>
			</div>
		</div>
	);
}

function getInitialOpenGroup(section: Exclude<Section, null>): OpenGroup {
	if (["pedidos", "historial", "auditoria-cobros", "conciliacion-pagos"].includes(section)) {
		return "pedidos";
	}
	if (["ventas-diarias", "mas-vendidos"].includes(section)) {
		return "ventas";
	}
	if (["mensajeros-desempeno", "mensajeros-cierres"].includes(section)) {
		return "mensajeros";
	}
	if (["reportes", "reportes-cancelados", "demanda-horarios"].includes(section)) {
		return "reportes";
	}
	return null;
}

export default function AdminLayout({ initialSection = "pedidos" }: AdminLayoutProps) {
	const [activeSection, setActiveSection] = useState<Section>(initialSection);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [openGroup, setOpenGroup] = useState<OpenGroup>(() => getInitialOpenGroup(initialSection));

	const navSections: NavSection[] = [
		{
			title: "Principal",
			items: [
				{ label: "Pedidos", icon: <ShoppingBag size={15} />, section: "pedidos" },
			],
		},
		{
			title: "Configuración",
			items: [
				{ label: "Usuarios", icon: <Users size={15} />, section: "usuarios" },
				{ label: "Categorías", icon: <Tag size={15} />, section: "categorias" },
				{ label: "Parámetros", icon: <Settings size={15} />, section: "parametros" },
				{ label: "Bitácora", icon: <ClipboardList size={15} />, section: "bitacora" },
				{ label: "Monitoreo", icon: <Activity size={15} />, section: "monitoreo" },
			],
		},
		{
			title: "Analítica",
			items: [
				{ label: "Ventas", icon: <BarChart2 size={15} />, section: "ventas-diarias" },
				{ label: "Mensajeros", icon: <Bike size={15} />, section: null },
				{ label: "Reportes", icon: <FileText size={15} />, section: "reportes" },
			],
		},
	];

	const sidebarItemActive = "bg-primary/15 text-primary";
	const sidebarItemInactive = "text-(--theme-text)/55 hover:text-(--theme-text) hover:bg-(--theme-text)/5";
	const sidebarSubItemClass = (active: boolean) =>
		`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${active ? sidebarItemActive : sidebarItemInactive}`;
	const toggleGroup = (group: Exclude<OpenGroup, null>) => {
		setOpenGroup((current) => current === group ? null : group);
	};

	return (
		<div className="flex h-full min-h-0 flex-1 self-stretch overflow-hidden bg-(--theme-bg)">
			{sidebarOpen && (
				<button
					type="button"
					aria-label="Cerrar menu lateral"
					className="fixed inset-0 z-30 bg-black/40 md:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<aside
				className={`
          fixed inset-y-0 left-0 z-40 h-screen w-[256px]
          bg-(--theme-card-bg) border-r border-(--theme-border)
          transition-transform duration-300
          md:sticky md:top-14 md:z-0 md:h-[calc(100vh-3.5rem)] md:translate-x-0
          md:bg-transparent md:border-(--theme-text)/8
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
			>
				<nav className="h-full overflow-y-auto px-4 py-5">
					{navSections.map((section) => (
						<div key={section.title} className="mb-5">
							<p className="text-xs uppercase tracking-widest text-(--theme-text)/35 px-3 mb-2">
								{section.title}
							</p>
							{section.items.map((item) => {
								if (item.label === "Pedidos") {
									const isGroupActive = ["pedidos", "historial", "auditoria-cobros", "conciliacion-pagos"].includes(activeSection ?? "");
									const isOpen = openGroup === "pedidos";
									return (
										<div key={item.label} className="mb-1">
											<button
												type="button"
												onClick={() => toggleGroup("pedidos")}
												className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${isGroupActive ? sidebarItemActive : sidebarItemInactive}`}
											>
												<span>{item.icon}</span>
												<span className="flex-1 text-left">Pedidos</span>
												<ChevronRight size={12} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
											</button>
											<Collapse open={isOpen}>
												<button type="button" onClick={() => { setActiveSection("pedidos"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "pedidos")}>
													Recepción
												</button>
												<button type="button" onClick={() => { setActiveSection("historial"); setSidebarOpen(false); }}
													className={`${sidebarSubItemClass(activeSection === "historial")} flex items-center gap-1.5`}>
													<ClipboardList size={11} /> Historial
												</button>
												<button type="button" onClick={() => { setActiveSection("auditoria-cobros"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "auditoria-cobros")}>
													Auditoría de cobros
												</button>
												<button type="button" onClick={() => { setActiveSection("conciliacion-pagos"); setSidebarOpen(false); }}
													className={`${sidebarSubItemClass(activeSection === "conciliacion-pagos")} flex items-center gap-1.5`}>
													<Scale size={11} /> Conciliacion
												</button>
											</Collapse>
										</div>
									);
								}

								if (item.label === "Ventas") {
									const isGroupActive = ["ventas-diarias", "mas-vendidos"].includes(activeSection ?? "");
									const isOpen = openGroup === "ventas";
									return (
										<div key={item.label} className="mb-1">
											<button type="button" onClick={() => toggleGroup("ventas")}
												className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${isGroupActive ? sidebarItemActive : sidebarItemInactive}`}>
												<span>{item.icon}</span>
												<span className="flex-1 text-left">Ventas</span>
												<ChevronRight size={12} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
											</button>
											<Collapse open={isOpen}>
												<button type="button" onClick={() => { setActiveSection("ventas-diarias"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "ventas-diarias")}>
													Ventas diarias
												</button>
												<button type="button" onClick={() => { setActiveSection("mas-vendidos"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "mas-vendidos")}>
													Más vendidos
												</button>
											</Collapse>
										</div>
									);
								}

								if (item.label === "Reportes") {
									const isGroupActive = ["reportes", "reportes-cancelados", "demanda-horarios"].includes(activeSection ?? "");
									const isOpen = openGroup === "reportes";
									return (
										<div key={item.label} className="mb-1">
											<button type="button" onClick={() => toggleGroup("reportes")}
												className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${isGroupActive ? sidebarItemActive : sidebarItemInactive}`}>
												<span>{item.icon}</span>
												<span className="flex-1 text-left">Reportes</span>
												<ChevronRight size={12} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
											</button>
											<Collapse open={isOpen}>
												<button type="button" onClick={() => { setActiveSection("reportes"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "reportes")}>
													Ventas por fecha
												</button>
												<button type="button" onClick={() => { setActiveSection("reportes-cancelados"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "reportes-cancelados")}>
													Pedidos cancelados
												</button>
												<button type="button" onClick={() => { setActiveSection("demanda-horarios"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "demanda-horarios")}>
													Demanda por horarios
												</button>
											</Collapse>
										</div>
									);
								}

								if (item.label === "Mensajeros") {
									const isGroupActive = ["mensajeros-desempeno", "mensajeros-cierres"].includes(activeSection ?? "");
									const isOpen = openGroup === "mensajeros";
									return (
										<div key={item.label} className="mb-1">
											<button type="button" onClick={() => toggleGroup("mensajeros")}
												className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${isGroupActive ? sidebarItemActive : sidebarItemInactive}`}>
												<span>{item.icon}</span>
												<span className="flex-1 text-left">Mensajeros</span>
												<ChevronRight size={12} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
											</button>
											<Collapse open={isOpen}>
												<button type="button" onClick={() => { setActiveSection("mensajeros-desempeno"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "mensajeros-desempeno")}>
													Desempeño
												</button>
												<button type="button" onClick={() => { setActiveSection("mensajeros-cierres"); setSidebarOpen(false); }}
													className={sidebarSubItemClass(activeSection === "mensajeros-cierres")}>
													Validar cierres
												</button>
											</Collapse>
										</div>
									);
								}

								const isActive = activeSection === item.section;
								return (
									<button
										type="button"
										key={item.label}
										onClick={() => {
											if (!item.disabled && item.section) {
												setActiveSection(item.section);
												setOpenGroup(null);
												setSidebarOpen(false);
											}
										}}
										className={`
                      w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5
                      transition-colors duration-150 text-left
                      ${isActive
												? sidebarItemActive
												: item.disabled
													? "text-(--theme-text)/20 cursor-not-allowed"
													: `${sidebarItemInactive} cursor-pointer`
											}
                    `}
									>
										<span className="flex-shrink-0">{item.icon}</span>
										<span className="flex-1">{item.label}</span>
										{item.badge && (
											<span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-full font-medium">
												{item.badge}
											</span>
										)}
										{isActive && <ChevronRight size={12} className="opacity-50" />}
									</button>
								);
							})}
						</div>
					))}
				</nav>

			</aside>

			<div className="flex min-w-0 flex-1 flex-col bg-(--theme-bg)">
				<main className="admin-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
					<button
						type="button"
						className="mb-4 flex items-center gap-2 rounded-lg border border-(--theme-border) px-3 py-2 text-sm text-(--theme-text)/70 md:hidden"
						onClick={() => setSidebarOpen(!sidebarOpen)}
					>
						{sidebarOpen ? <X size={18} /> : <Menu size={18} />}
						Menú
					</button>
					<div className="mx-auto w-full max-w-7xl">
						{activeSection === "pedidos" && (
							<OrderReceptionPanel />
						)}
						{activeSection === "usuarios" && <UserManagement />}
						{activeSection === "categorias" && <CategoryList />}
						{activeSection === "ventas-diarias" && <DailySales />}
						{activeSection === "mas-vendidos" && <TopSellingProducts />}
						{activeSection === "mensajeros-desempeno" && <MessengerPerformancePage />}
						{activeSection === "mensajeros-cierres" && <CourierSessionsValidation />}
						{activeSection === "parametros" && <ConfigPanel />}
						{activeSection === "reportes" && <SalesReport />}
						{activeSection === "bitacora" && <AccessLogPanel />}
						{activeSection === "monitoreo" && <SellerActivityPanel />}
						{activeSection === "reportes-cancelados" && <CancelledOrdersReport />}
						{activeSection === "historial" && <OrderHistory />}
						{activeSection === "demanda-horarios" && <DemandPanel />}
						{activeSection === "auditoria-cobros" && <PaymentAuditPanel />}
						{activeSection === "conciliacion-pagos" && <PaymentReconciliationPanel />}
					</div>
				</main>
			</div>
		</div>
	);
}
