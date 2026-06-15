import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { sections } from "../../seller/constants/sections";

/**
 * Este componente es el menú de navegación inferior para el vendedor.
 * Se divide en dos versiones: Escritorio (horizontal) y Móvil (botón con lista).
 */
export default function OrdersDock() {
	const [currentPath, setCurrentPath] = useState("");
	const [isMobile, setIsMobile] = useState(false);
	const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 1120px)");
		const handleMQ = (e: MediaQueryListEvent | MediaQueryList) =>
			setIsMobile(e.matches);

		mediaQuery.addEventListener("change", handleMQ);
		handleMQ(mediaQuery);

		const sync = () => {
			const pathname = window.location.pathname.replace(/\/$/, "");
			setCurrentPath(pathname || "/");

			setOpenSubmenu(null);
			setIsMobileMenuOpen(false);
		};

		sync();
		document.addEventListener("astro:page-load", sync);

		return () => {
			mediaQuery.removeEventListener("change", handleMQ);
			document.removeEventListener("astro:page-load", sync);
		};
	}, []);

	const isActive = (route: string) =>
		currentPath === route || currentPath.startsWith(`${route}/`);

	if (isMobile) {
		return (
			<OrdersDockMobile
				currentPath={currentPath}
				isActive={isActive}
				isMobileMenuOpen={isMobileMenuOpen}
				setIsMobileMenuOpen={setIsMobileMenuOpen}
			/>
		);
	}

	// Renderizado para Escritorio
	return (
		<div className="z-50 font-display font-medium fixed bottom-10 left-1/2 -translate-x-1/2 bg-(--theme-card-bg)/80 backdrop-blur-md border border-(--theme-border) shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-(--theme-text) flex gap-1 rounded-full p-1.5 text-sm">
			<div className="flex whitespace-nowrap">
				{/* Grupo Pedidos */}
				<div className="relative">
					<button
						type="button"
						onClick={() =>
							setOpenSubmenu(openSubmenu === "pedidos" ? null : "pedidos")
						}
						className={`${isActive("/seller/orders") || isActive("/seller/created-orders") ? "bg-(--theme-secondary-bg) text-primary font-semibold underline decoration-2 underline-offset-4" : "hover:bg-(--theme-secondary-bg)"} cursor-pointer px-4 py-2 rounded-full transition-colors`}
					>
						Pedidos
					</button>
					<AnimatePresence>
						{openSubmenu === "pedidos" && (
							<motion.div
								transition={{ duration: 0.15, ease: "easeOut" }}
								initial={{ opacity: 0, y: 12, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 12, scale: 0.95 }}
								className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-(--theme-card-bg)/85 backdrop-blur-md p-2 flex flex-col border border-(--theme-border) rounded-2xl w-[16ch] shadow-2xl"
							>
								<a
									onClick={() => setOpenSubmenu(null)}
									href="/seller/created-orders"
									aria-current={
										isActive("/seller/created-orders") ? "page" : undefined
									}
									className={`px-4 py-2.5 rounded-xl transition-colors text-center hover:bg-(--theme-secondary-bg) ${
										isActive("/seller/created-orders")
											? "text-primary font-semibold underline decoration-2 underline-offset-4"
											: ""
									}`}
								>
									Creados
								</a>
								<a
									onClick={() => setOpenSubmenu(null)}
									href="/seller/orders"
									aria-current={isActive("/seller/orders") ? "page" : undefined}
									className={`px-4 py-2.5 rounded-xl transition-colors text-center hover:bg-(--theme-secondary-bg) ${
										isActive("/seller/orders")
											? "text-primary font-semibold underline decoration-2 underline-offset-4"
											: ""
									}`}
								>
									Mis Pedidos
								</a>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Grupo Registrar */}
				<div className="relative">
					<button
						type="button"
						onClick={() =>
							setOpenSubmenu(openSubmenu === "registrar" ? null : "registrar")
						}
						className={`${isActive("/seller/purchase") || isActive("/seller/offers") ? "bg-(--theme-secondary-bg) text-primary font-semibold underline decoration-2 underline-offset-4" : "hover:bg-(--theme-secondary-bg)"} cursor-pointer px-4 py-2 rounded-full transition-colors`}
					>
						Registrar
					</button>
					<AnimatePresence>
						{openSubmenu === "registrar" && (
							<motion.div
								transition={{ duration: 0.15, ease: "easeOut" }}
								initial={{ opacity: 0, y: 12, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 12, scale: 0.95 }}
								className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-(--theme-card-bg)/85 backdrop-blur-md p-2 flex flex-col border border-(--theme-border) rounded-2xl w-[14ch] shadow-2xl"
							>
								<a
									onClick={() => setOpenSubmenu(null)}
									href="/seller/purchase"
									aria-current={
										isActive("/seller/purchase") ? "page" : undefined
									}
									className={`px-4 py-2.5 rounded-xl transition-colors text-center hover:bg-(--theme-secondary-bg) ${
										isActive("/seller/purchase")
											? "text-primary font-semibold underline decoration-2 underline-offset-4"
											: ""
									}`}
								>
									Compra
								</a>
								<a
									onClick={() => setOpenSubmenu(null)}
									href="/seller/offers"
									aria-current={isActive("/seller/offers") ? "page" : undefined}
									className={`px-4 py-2.5 rounded-xl transition-colors text-center hover:bg-(--theme-secondary-bg) ${
										isActive("/seller/offers")
											? "text-primary font-semibold underline decoration-2 underline-offset-4"
											: ""
									}`}
								>
									Oferta
								</a>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Otras Secciones Directas */}
				{sections.map((s) => {
					if (
						[
							"creados",
							"compra",
							"ofertas",
							"mis pedidos",
							"empaquetados",
						].includes(s.id)
					)
						return null;
					return (
						<a
							key={s.id}
							href={s.route}
							aria-current={isActive(s.route) ? "page" : undefined}
							className={`px-4 py-2 rounded-full transition-colors ${
								isActive(s.route)
									? "text-primary font-semibold underline decoration-2 underline-offset-4 bg-(--theme-secondary-bg)"
									: "hover:bg-(--theme-secondary-bg)"
							}`}
						>
							{s.label}
						</a>
					);
				})}
			</div>
		</div>
	);
}

interface OrdersDockMobileProps {
	currentPath: string;
	isActive: (route: string) => boolean;
	isMobileMenuOpen: boolean;
	setIsMobileMenuOpen: (open: boolean) => void;
}

function OrdersDockMobile({
	currentPath,
	isActive,
	isMobileMenuOpen,
	setIsMobileMenuOpen,
}: OrdersDockMobileProps) {
	const currentSection = sections.find((s) => s.route === currentPath);

	return (
		<div className="fixed bottom-10 left-1/2 -translate-x-1/2 text-(--theme-text) z-50 font-display font-medium text-sm w-[26ch]">
			<div className="relative w-full">
				<AnimatePresence>
					{isMobileMenuOpen && (
						<motion.div
							initial={{ opacity: 0, y: 8, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 8, scale: 0.95 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
							className="absolute bottom-[105%] rounded-2xl p-2 mb-2 left-0 flex flex-col w-full bg-(--theme-card-bg)/85 backdrop-blur-md border border-(--theme-border) shadow-2xl overflow-hidden"
						>
							{sections.map((s) => {
								const active = isActive(s.route);
								return (
									<a
										key={s.id}
										href={s.route}
										onClick={() => setIsMobileMenuOpen(false)}
										aria-current={active ? "page" : undefined}
										className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
											active
												? "text-primary font-semibold underline decoration-2 underline-offset-4 bg-(--theme-secondary-bg)"
												: "hover:bg-(--theme-secondary-bg)"
										}`}
									>
										{s.label}
									</a>
								);
							})}
						</motion.div>
					)}
				</AnimatePresence>
				<button
					type="button"
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					className={`text-center cursor-pointer py-3.5 w-full rounded-full bg-(--theme-card-bg)/80 backdrop-blur-md border border-(--theme-border) shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all hover:bg-(--theme-secondary-bg) ${isMobileMenuOpen ? "bg-(--theme-text) text-(--theme-bg) hover:bg-(--theme-text)" : ""}`}
				>
					{currentSection ? currentSection.label : "Menú"}
				</button>
			</div>
		</div>
	);
}
