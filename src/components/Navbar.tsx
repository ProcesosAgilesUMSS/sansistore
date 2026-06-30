import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ShoppingBag,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  MapPin,
  Settings,
  Package,
  User as UserIcon,
} from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import ErrorCard from './ErrorCard';
import { useStore } from '@nanostores/react';
import {
  cartTotalUnits,
  cartAnimating,
  initCartStore,
} from '../features/cart/store/cartStore';
import { clearLocalCart } from '../features/cart/utils/localCart';
import { clearLocalFavorites } from '../features/favorites';
import { registrarAcceso } from '../features/admin/audit/services/accessLogService';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'sansistore-theme';
const INSTITUTIONAL_DOMAIN = 'umss.edu';

const applyTheme = (theme: ThemeMode) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors and keep the visual theme change.
  }
};

function CartButton() {
  const totalUnits = useStore(cartTotalUnits);
  const isAnimating = useStore(cartAnimating);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initCartStore();
    setMounted(true);
  }, []);

  return (
    <a
      href="/carrito"
      aria-label={`Carrito, ${mounted ? totalUnits : 0} unidades`}
      className="relative inline-flex items-center justify-center transition-all text-text-light opacity-[0.60] hover:text-primary hover:opacity-100"
    >
      <ShoppingCart
        size={18}
        className={`transition-all duration-300 ease-out ${isAnimating ? 'text-primary opacity-100 scale-105' : ''
          }`}
      />
      {mounted && totalUnits > 0 && (
        <span
          key={totalUnits}
          className={`absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full flex items-center justify-center text-[10px] leading-none font-bold bg-primary text-white ring-2 ring-(--theme-bg) transition-transform duration-300 ease-out ${isAnimating ? 'scale-110' : 'scale-100'
            }`}
        >
          {totalUnits > 99 ? '99+' : totalUnits}
        </span>
      )}
    </a>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [themeReady, setThemeReady] = useState(false);
  const [themeAnimating, setThemeAnimating] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    const syncPath = () => setCurrentPath(window.location.pathname);
    syncPath();
    document.addEventListener('astro:page-load', syncPath);
    document.addEventListener('astro:after-swap', syncPath);
    return () => {
      document.removeEventListener('astro:page-load', syncPath);
      document.removeEventListener('astro:after-swap', syncPath);
    };
  }, []);

  const isActive = (href: string, match?: string) => {
    // 'match' permite marcar activa una sección con varias rutas hermanas
    // (ej. Ordenes apunta a /seller/created-orders pero abarca todo /seller/*).
    const base = match ?? href;
    return base === '/'
      ? currentPath === '/'
      : currentPath === base || currentPath.startsWith(base + '/');
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userSnap = await getDoc(doc(db, 'users', u.uid));
          setRoles(userSnap.exists() ? (userSnap.data().roles ?? []) : []);
        } catch {
          setRoles([]);
        }
      } else {
        setRoles([]);
      }
      setAuthReady(true);

      if (!u) {
        setUserRoles([]);
        return;
      }

      getDoc(doc(db, 'users', u.uid))
        .then((userSnap) => {
          const roles = userSnap.data()?.roles;
          setUserRoles(Array.isArray(roles) ? roles : []);
        })
        .catch(() => setUserRoles([]));
    });
    return unsub;
  }, []);

  const canAccessCourier = userRoles.includes('mensajero');

  useEffect(() => {
    if (!themeAnimating) return;
    const timeoutId = window.setTimeout(() => setThemeAnimating(false), 560);
    return () => window.clearTimeout(timeoutId);
  }, [themeAnimating]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(
      THEME_STORAGE_KEY
    ) as ThemeMode | null;
    const currentTheme =
      savedTheme ||
      (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    if (currentTheme !== theme) {
      setTheme(currentTheme);
    }
    setThemeReady(true);
  }, [theme]);

  //HU #159: registrar LOGOUT antes de cerrar sesión
  //Solo se agregó el registro del acceso
  const handleLogout = () => {
    setProfileMenuOpen(false);
    setMenuOpen(false);
    const currentUser = auth.currentUser;
    if (currentUser) {
      getDoc(doc(db, 'users', currentUser.uid))
        .then((snap) => {
          const userData = snap.exists() ? snap.data() : null;
          return registrarAcceso({
            uid: currentUser.uid,
            displayName: userData?.displayName ?? currentUser.displayName ?? 'Usuario',
            email: currentUser.email ?? '',
            roles: userData?.roles ?? [],
            action: 'LOGOUT',
          });
        })
        .catch(() => console.warn('[AccessLog] No se pudo registrar el logout.'))
        .finally(() => {
          setRoles([]);
          clearLocalCart();
          clearLocalFavorites();
          signOut(auth)
            .then(() => { window.location.href = '/iniciar-sesion'; })
            .catch(console.error);
        });
    } else {
      setRoles([]);
      clearLocalCart();
      clearLocalFavorites();
      signOut(auth)
        .then(() => { window.location.href = '/iniciar-sesion'; })
        .catch(console.error);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeAnimating(true);
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const showCompradorFeatures = !user || roles.length === 0 || roles.includes('comprador');
  const showVendedorFeatures = user && roles.length > 0 && roles.some(r => ['vendedor', 'admin'].includes(r));
  const showOperadorInvFeatures = user && roles.length > 0 && roles.some(r => ['operador_inv', 'admin'].includes(r));
  const showMensajeroFeatures = user && roles.length > 0 && roles.some(r => ['mensajero', 'admin'].includes(r));
  const showAdminFeatures = user && roles.length > 0 && roles.some(r => ['admin'].includes(r));

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-bg-light/85 border-b border-border-light font-sans">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between gap-4 h-14">
            {/* LOGO */}
            <a
              href="/"
              aria-label="SansiStore — inicio"
              className="group flex items-center gap-2 shrink-0"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30 transition-transform group-hover:scale-105 group-active:scale-95">
                <ShoppingBag size={17} strokeWidth={2.4} />
              </span>
              <span className="font-display font-black tracking-tight text-lg leading-none text-text-light">
                Sansi<span className="text-primary">Store</span>
              </span>
            </a>

            {/* LINKS */}
            <div className="hidden md:flex items-center gap-8 whitespace-nowrap">
              {[
                { label: 'Productos', href: '/productos', reqComprador: true },
                { label: 'Ordenes', href: '/seller/created-orders', match: '/seller', reqVendedor: true },
                { label: 'Inventario', href: '/inventory', reqOperadorInv: true },
                { label: 'Entregas', href: '/courier', reqMensajero: true },
                { label: 'Admin', href: '/admin', reqAdmin: true },
              ]
                .filter(item => {
                  if (item.reqComprador && !showCompradorFeatures) return false;
                  if (item.reqVendedor && !showVendedorFeatures) return false;
                  if (item.reqOperadorInv && !showOperadorInvFeatures) return false;
                  if (item.reqMensajero && !showMensajeroFeatures) return false;
                  if (item.reqAdmin && !showAdminFeatures) return false;
                  return true;
                })
                .map((item) => {
                  const active = isActive(item.href, item.match);
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative text-sm font-semibold tracking-[0.02em] transition-all hover:text-primary ${
                        active
                          ? 'text-primary opacity-100 after:absolute after:-bottom-4.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                          : 'text-text-light opacity-[0.60] hover:opacity-100'
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3 shrink-0">
              {/* CART */}
              {showCompradorFeatures && <CartButton />}

              {/* THEME */}
              <button
                type="button"
                aria-label="Cambiar tema"
                onClick={toggleTheme}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 text-primary transition-all duration-300 hover:border-primary hover:opacity-100 ${
                  themeAnimating ? 'theme-toggle-pulse' : ''
                }`}
              >
                <span
                  className={`relative flex h-[18px] w-[18px] items-center justify-center ${
                    themeAnimating ? 'theme-toggle-nudge' : ''
                  }`}
                >
                  <Sun
                    className={`absolute h-[18px] w-[18px] transition-all duration-[420ms] ease-out ${
                      themeReady && theme === 'dark'
                        ? 'scale-[0.65] -rotate-45 opacity-0'
                        : 'scale-100 rotate-0 opacity-100'
                    }`}
                  />
                  <Moon
                    className={`absolute h-[18px] w-[18px] transition-all duration-[420ms] ease-out ${
                      themeReady && theme === 'dark'
                        ? 'scale-100 rotate-0 opacity-100'
                        : 'scale-[0.65] rotate-45 opacity-0'
                    }`}
                  />
                </span>
              </button>

              {/* AUTH */}
              {authReady &&
                (user ? (
                  /* CORRECCIÓN DE ZONA MUERTA: Cambiado hidden sm:block por hidden md:block */
                  <div className="relative hidden md:block">
                    <button
                      type="button"
                      aria-expanded={profileMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => setProfileMenuOpen((open) => !open)}
                      className="flex items-center gap-2 rounded-full px-2 py-1 transition-all hover:bg-border-light/40"
                    >
                      {user.photoURL && (
                        <img
                          src={user.photoURL}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      )}
                      <span className="hidden sm:inline max-w-35 truncate text-sm text-text-light opacity-70">
                        {user.displayName}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-text-light opacity-50 transition-transform ${profileMenuOpen ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    {profileMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-11 w-48 overflow-hidden rounded-lg border border-border-light bg-bg-light shadow-lg"
                      >
                        <a
                          role="menuitem"
                          href="/mi-perfil"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-text-light opacity-70 transition-colors hover:bg-border-light/40 hover:text-primary hover:opacity-100"
                        >
                          <UserIcon size={14} />
                          Mi Perfil
                        </a>

                        {canAccessCourier && (
                          <a
                            role="menuitem"
                            href="/courier"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-text-light opacity-70 transition-colors hover:bg-border-light/40 hover:text-primary hover:opacity-100"
                          >
                            Mensajero
                          </a>
                        )}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-text-light opacity-70 transition-colors hover:bg-border-light/40 hover:text-primary hover:opacity-100"
                        >
                          <LogOut size={14} />
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href="/iniciar-sesion"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                  >
                    <UserIcon size={15} />
                    Iniciar sesión
                  </a>
                ))}

              {/* MOBILE */}
              <button
                className="md:hidden text-text-light opacity-60 hover:text-primary"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* MOBILE MENU */}
          {menuOpen && (
            <div className="md:hidden py-3 flex flex-col gap-3 border-t border-border-light">
              {[
                { label: 'Productos', href: '/productos', reqComprador: true },
                { label: 'Ordenes', href: '/seller/created-orders', match: '/seller', reqVendedor: true },
                { label: 'Inventario', href: '/inventory', reqOperadorInv: true },
                { label: 'Entregas', href: '/courier', reqMensajero: true },
                { label: 'Admin', href: '/admin', reqAdmin: true },
              ]
                .filter(item => {
                  if (item.reqComprador && !showCompradorFeatures) return false;
                  if (item.reqVendedor && !showVendedorFeatures) return false;
                  if (item.reqOperadorInv && !showOperadorInvFeatures) return false;
                  if (item.reqMensajero && !showMensajeroFeatures) return false;
                  if (item.reqAdmin && !showAdminFeatures) return false;
                  return true;
                })
                .map((item) => {
                  const active = isActive(item.href, item.match);
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`text-sm font-semibold tracking-[0.02em] transition-all hover:text-primary ${
                        active
                          ? 'text-primary opacity-100'
                          : 'text-text-light opacity-[0.55] hover:opacity-100'
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}

              {/* CORRECCIÓN: Quitamos showCompradorFeatures de aquí */}
              {user && (
                <>
                  <a
                    href="/mi-perfil"
                    className="text-sm font-semibold text-primary opacity-90 transition-all hover:opacity-100"
                  >
                    Mi Perfil
                  </a>

                  {canAccessCourier && (
                    <a
                      href="/courier"
                      className="text-sm font-semibold text-primary opacity-90 transition-all hover:opacity-100"
                    >
                      Mensajero
                    </a>
                  )}

                  <hr className="border-border-light my-0.5" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-left text-sm font-semibold text-text-light opacity-[0.55] transition-all hover:text-primary hover:opacity-100"
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {authError && (
        <ErrorCard
          isOpen={authError !== null}
          onClose={() => setAuthError(null)}
          message={`Para ingresar a Sansistore debes utilizar tu cuenta institucional que contenga ${INSTITUTIONAL_DOMAIN}.`}
          title="Acceso Denegado"
        />
      )}
    </>
  );
}
