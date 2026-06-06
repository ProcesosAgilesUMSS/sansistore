import { useEffect, useState } from 'react';
import { sections } from '../../seller/constants/sections';
import { motion, AnimatePresence } from "motion/react"

/**
 * Este componente es el menú de navegación inferior para el vendedor.
 * Se divide en dos versiones: Escritorio (horizontal) y Móvil (botón con lista).
 */
export default function OrdersDock() {
  const [currentPath, setCurrentPath] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 940px)");
    const handleMQ = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);

    mediaQuery.addEventListener('change', handleMQ);
    handleMQ(mediaQuery);

    const sync = () => {
      const pathname = window.location.pathname.replace(/\/$/, '');
      setCurrentPath(pathname || '/');

      setOpenSubmenu(null);
      setIsMobileMenuOpen(false);
    };

    sync();
    document.addEventListener('astro:page-load', sync);

    return () => {
      mediaQuery.removeEventListener('change', handleMQ);
      document.removeEventListener('astro:page-load', sync);
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
    <div className="z-50 font-['Outfit'] font-medium fixed bottom-10 left-1/2 -translate-x-1/2 bg-(--theme-card-bg) border border-(--theme-border) shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-(--theme-text) flex gap-1 rounded-full p-1.5 text-sm">
      <div className="flex whitespace-nowrap">

        {/* Grupo Pedidos */}
        <div className="relative">
          <button
            onClick={() => setOpenSubmenu(openSubmenu === 'pedidos' ? null : 'pedidos')}
            className={`${isActive("/seller/orders") || isActive("/seller/created-orders") ? "bg-(--theme-text) text-(--theme-bg)" : "hover:bg-(--theme-secondary-bg)"} cursor-pointer px-4 py-2 rounded-full transition-colors`}
          >
            Pedidos
          </button>
          <AnimatePresence>
            {openSubmenu === 'pedidos' && (
              <motion.div
                transition={{ duration: 0.15, ease: "easeOut" }}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-(--theme-card-bg) p-2 flex flex-col border border-(--theme-border) rounded-3xl w-[16ch] shadow-2xl"
              >
                <a onClick={() => setOpenSubmenu(null)} href="/seller/created-orders" className="px-4 py-2.5 rounded-2xl hover:bg-(--theme-secondary-bg) transition-colors text-center">Creados</a>
                <a onClick={() => setOpenSubmenu(null)} href="/seller/orders" className="px-4 py-2.5 rounded-2xl hover:bg-(--theme-secondary-bg) transition-colors text-center">Mis Pedidos</a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grupo Registrar */}
        <div className="relative">
          <button
            onClick={() => setOpenSubmenu(openSubmenu === 'registrar' ? null : 'registrar')}
            className={`${isActive("/seller/purchase") || isActive("/seller/offers") ? "bg-(--theme-text) text-(--theme-bg)" : "hover:bg-(--theme-secondary-bg)"} cursor-pointer px-4 py-2 rounded-full transition-colors`}
          >
            Registrar
          </button>
          <AnimatePresence>
            {openSubmenu === 'registrar' && (
              <motion.div
                transition={{ duration: 0.15, ease: "easeOut" }}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-(--theme-card-bg) p-2 flex flex-col border border-(--theme-border) rounded-3xl w-[14ch] shadow-2xl"
              >
                <a onClick={() => setOpenSubmenu(null)} href="/seller/purchase" className="px-4 py-2.5 rounded-2xl hover:bg-(--theme-secondary-bg) transition-colors text-center">Compra</a>
                <a onClick={() => setOpenSubmenu(null)} href="/seller/offers" className="px-4 py-2.5 rounded-2xl hover:bg-(--theme-secondary-bg) transition-colors text-center">Oferta</a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Otras Secciones Directas */}
        {sections.map((s) => {
          if (['creados', 'compra', 'ofertas', 'mis pedidos', "empaquetados"].includes(s.id)) return null;
          return (
            <a key={s.id} href={s.route} className={`px-4 py-2 rounded-full transition-colors ${isActive(s.route) ? "bg-(--theme-text) text-(--theme-bg)" : "hover:bg-(--theme-secondary-bg)"}`}>
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

function OrdersDockMobile({ currentPath, isActive, isMobileMenuOpen, setIsMobileMenuOpen }: OrdersDockMobileProps) {
  const currentSection = sections.find(s => s.route === currentPath);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 text-(--theme-text) z-50 font-['Outfit'] font-medium text-sm w-[26ch]">
      <div className="relative w-full">
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute bottom-[105%] rounded-3xl p-2 mb-2 left-0 flex flex-col w-full bg-(--theme-card-bg) border border-(--theme-border) shadow-2xl overflow-hidden"
            >
              {sections.map(s => (
                <a
                  key={s.id}
                  href={s.route}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-2xl transition-colors ${isActive(s.route) ? "bg-(--theme-text) text-(--theme-bg)" : "hover:bg-(--theme-secondary-bg)"}`}
                >
                  {s.label}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`text-center cursor-pointer py-3.5 w-full rounded-full bg-(--theme-card-bg) border border-(--theme-border) shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all hover:bg-(--theme-secondary-bg) ${isMobileMenuOpen ? "bg-(--theme-text) text-(--theme-bg) hover:bg-(--theme-text)" : ""}`}
        >
          {currentSection ? currentSection.label : 'Menú'}
        </button>
      </div>
    </div>
  );
}
