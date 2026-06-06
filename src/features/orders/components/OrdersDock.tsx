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
    <div className="z-50 font-[Inter] fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#3E3E3E] text-white flex gap-6 rounded text-sm">
      <div className="flex  whitespace-nowrap py-1 px-0.5">

        {/* Grupo Pedidos */}
        <div className="relative">
          <button
            onClick={() => setOpenSubmenu(openSubmenu === 'pedidos' ? null : 'pedidos')}
            className={`${isActive("/seller/orders") || isActive("/seller/created-orders") ? "bg-white/20" : ""}  cursor-pointer px-3 py-1`}
          >
            Pedidos
          </button>
          <AnimatePresence>
            {openSubmenu === 'pedidos' && (
              <motion.div
                transition={{ duration: 0.1, ease: "easeInOut" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-[#3E3E3E] p-2 flex flex-col border border-gray-600 rounded-lg w-[12ch]"
              >
                <a onClick={() => setOpenSubmenu(null)} href="/seller/created-orders">Creados</a>
                <a onClick={() => setOpenSubmenu(null)} href="/seller/orders">Mis Pedidos</a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grupo Registrar */}
        <div className="relative">
          <button
            onClick={() => setOpenSubmenu(openSubmenu === 'registrar' ? null : 'registrar')}
            className={`${isActive("/seller/purchase") || isActive("/seller/offers") ? "bg-white/20" : ""}  cursor-pointer px-3 py-1 rounded`}
          >
            Registrar
          </button>
          <AnimatePresence>
            {openSubmenu === 'registrar' && (
              <motion.div
                transition={{ duration: 0.1, ease: "easeIn" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-[#3E3E3E] p-2 flex flex-col border border-gray-600 rounded-lg w-[10ch]"
              >
                <a onClick={() => setOpenSubmenu(null)} href="/seller/purchase">Compra</a>
                <a onClick={() => setOpenSubmenu(null)} href="/seller/offers">Oferta</a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Otras Secciones Directas */}
        {sections.map((s) => {
          if (['creados', 'compra', 'ofertas', 'mis pedidos'].includes(s.id)) return null;
          return (
            <a key={s.id} href={s.route} className={`rounded px-3 py-1 ${isActive(s.route) ? "bg-white/15" : ""}`}>
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
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#3E3E3E] text-white rounded z-50 font-[inter] text-sm w-[22ch]">
      <div className="relative w-full">
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.1 }}
              className="absolute bottom-[105%] rounded p-1  left-0 flex flex-col w-full bg-[#3E3E3E] border border-gray-600 overflow-hidden"
            >
              {sections.map(s => (
                <a
                  key={s.id}
                  href={s.route}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center ${isActive(s.route) ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  {s.label}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`text-center cursor-pointer py-2  w-full rounded ${isMobileMenuOpen ? "rounded-t-none" : ""}`}
        >
          {currentSection ? currentSection.label : 'Menú'}
        </button>
      </div>
    </div>
  );
}
