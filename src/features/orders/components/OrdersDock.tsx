import { useEffect, useState, useRef } from 'react';
import { sections } from '../../seller/constants/sections';

export default function OrdersDock() {
  const [currentPath, setCurrentPath] = useState('');
  const [openMenu, setOpenMenu] = useState<'registrar' | 'pedidos' | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPath = () => {
      const pathname = window.location.pathname.replace(/\/$/, '');
      setCurrentPath(pathname || '/');
    };

    syncPath();
    document.addEventListener('astro:page-load', syncPath);
    document.addEventListener('astro:after-swap', syncPath);

    const handleClickOutside = (event: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('astro:page-load', syncPath);
      document.removeEventListener('astro:after-swap', syncPath);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isCurrentRoute = (route: string) =>
    currentPath === route || currentPath.startsWith(`${route}/`);

  const isRegisterActive = isCurrentRoute('/seller/purchase') || isCurrentRoute('/seller/offers');
  const isOrdersActive = isCurrentRoute('/seller/created-orders') || isCurrentRoute('/seller/orders');

  const toggleMenu = (menu: 'registrar' | 'pedidos') => {
    setOpenMenu(prev => prev === menu ? null : menu);
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 font-['Inter',sans-serif] text-sm" ref={dockRef}>
      <nav className="flex items-center gap-6 whitespace-nowrap bg-[#3E3E3E] py-2 rounded-lg px-6 shadow-xl border border-white/10">


        {/* Menu Pedidos */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('pedidos')}
            className={`text-white tracking-tight cursor-pointer hover:text-white/80 transition-colors ${isOrdersActive ? "underline decoration-2 underline-offset-3" : ""}`}
          >
            Pedidos
          </button>
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#3E3E3E] rounded-lg py-2 px-0.5 flex flex-col gap-1 shadow-2xl border border-white/10 min-w-[180px] transition-all duration-200 origin-bottom ${openMenu === 'pedidos' ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}
          >
            <a
              href="/seller/created-orders"
              className={`text-white px-4 py-2 hover:bg-white/10 rounded-md transition-colors ${isCurrentRoute('/seller/created-orders') ? 'bg-white/5 ' : ''}`}
              onClick={() => setOpenMenu(null)}
            >
              Pedidos Creados
            </a>
            <a
              href="/seller/orders"
              className={`text-white px-4 py-2 hover:bg-white/10 rounded-md transition-colors ${isCurrentRoute('/seller/orders') ? 'bg-white/5' : ''}`}
              onClick={() => setOpenMenu(null)}
            >
              Mis pedidos
            </a>
          </div>
        </div>

        {/* Menu Registrar */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('registrar')}
            className={`text-white tracking-tight cursor-pointer hover:text-white/80 transition-colors ${isRegisterActive ? "underline decoration-2 underline-offset-3 " : ""}`}
          >
            Registrar
          </button>
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#3E3E3E] rounded-lg py-2 px-1 flex flex-col gap-1 shadow-2xl border border-white/10 min-w-[160px] transition-all duration-200 origin-bottom ${openMenu === 'registrar' ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}
          >
            <a
              href="/seller/purchase"
              className={`text-white px-4 py-2 hover:bg-white/10 rounded-md transition-colors ${isCurrentRoute('/seller/purchase') ? 'bg-white/5' : ''}`}
              onClick={() => setOpenMenu(null)}
            >
              Registrar compra
            </a>
            <a
              href="/seller/offers"
              className={`text-white px-4 py-2 hover:bg-white/10 rounded-md transition-colors ${isCurrentRoute('/seller/offers') ? 'bg-white/5' : ''}`}
              onClick={() => setOpenMenu(null)}
            >
              Registrar oferta
            </a>
          </div>
        </div>

        {sections.map((section) => {
          // Filtrar las que ya estan en submenus
          if (['creados', 'empaqutados', 'compra', 'ofertas'].includes(section.id)) return null;

          const isActive = isCurrentRoute(section.route);
          return (
            <a
              key={section.id}
              href={section.route}
              aria-current={isActive ? 'page' : undefined}
              className={`text-white tracking-tight hover:text-white/80 transition-colors ${isActive ? "underline decoration-2 underline-offset-3" : ""}`}
            >
              {section.label}
            </a>
          );
        })}
      </nav>
    </div >
  );
}
