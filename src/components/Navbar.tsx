import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ShoppingBag,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  MapPin,
  Settings,
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
      className="relative transition-all text-text-light opacity-[0.60] hover:text-primary hover:opacity-100"
    >
      <ShoppingBag
        size={18}
        className={`transition-all duration-300 ease-out ${
          isAnimating ? 'text-primary opacity-100 scale-105' : ''
        }`}
      />
      <span
        key={totalUnits}
        className={`absolute -top-1 -right-1 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold border border-primary bg-primary text-bg-dark transition-transform duration-300 ease-out ${
          isAnimating ? 'scale-110' : 'scale-100'
        }`}
      >
        {mounted ? (totalUnits > 99 ? '99+' : totalUnits) : 0}
      </span>
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

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

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setRoles([]);
    clearLocalCart();
    clearLocalFavorites();
    signOut(auth).catch(console.error);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-bg-light/85 border-b border-border-light font-sans">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* LOGO */}
            <a
              href="/"
              className="font-black tracking-tight text-[16px] text-text-light"
            >
              sansi<span className="text-primary">store</span>
            </a>

            {/* LINKS */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Productos', href: '/productos' },
                { label: 'Pedidos', href: '/orders/sent' },
                { label: 'Ordenes', href: '/seller/orders' },
                { label: 'Inventario', href: '/inventory' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[13px] text-text-light opacity-[0.60] font-semibold tracking-[0.02em] transition-all hover:text-primary hover:opacity-100"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {roles.includes('admin') && (
              <a
                href="/admin"
                className="text-[13px] text-primary font-semibold tracking-[0.02em] transition-all hover:opacity-70"
              >
                Admin
              </a>
            )}

            {/* ACTIONS */}
            <div className="flex items-center gap-3">
              {/* CART */}
              <CartButton />
              {authReady && user && (
                <a
                  href="/location"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-[12px] font-semibold text-primary transition-all hover:bg-primary hover:text-white hover:border-primary"
                >
                  <MapPin size={13} />
                  Mis direcciones
                </a>
              )}

              {/* THEME */}
              <button
                type="button"
                aria-label="Cambiar tema"
                onClick={toggleTheme}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 text-primary transition-all hover:border-primary hover:opacity-100"
              >
                <span className="relative flex h-[18px] w-[18px] items-center justify-center">
                  {themeReady && theme === 'dark' ? (
                    <Moon className="h-[18px] w-[18px]" />
                  ) : (
                    <Sun className="h-[18px] w-[18px]" />
                  )}
                </span>
              </button>

              {/* AUTH */}
              {authReady &&
                (user ? (
                  <div className="relative">
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

                      <span className="hidden sm:inline text-[13px] text-text-light opacity-70">
                        {user.displayName}
                      </span>

                      <ChevronDown
                        size={14}
                        className={`text-text-light opacity-50 transition-transform ${
                          profileMenuOpen ? 'rotate-180' : ''
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
                          href="/mis-pedidos"
                          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-text-light transition-colors hover:bg-border-light/40 hover:text-primary"
                        >
                          {/*
                          <Package size={14} />
                        */}
                          Mis pedidos
                        </a>

                        {canAccessCourier && (
                          <a
                            role="menuitem"
                            href="/courier"
                            className="block px-4 py-2.5 text-[13px] font-semibold text-text-light transition-colors hover:bg-border-light/40 hover:text-primary"
                          >
                            Mensajero
                          </a>
                        )}

                        <a
                          role="menuitem"
                          href="/edit-profile"
                          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-text-light dark:text-[#F5F3EF] opacity-70 transition-colors hover:bg-border-light/40 hover:text-primary hover:opacity-100"
                        >
                          <Settings size={14} />
                          Editar Datos Personales
                        </a>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-text-light opacity-70 transition-colors hover:bg-border-light/40 hover:text-primary hover:opacity-100"
                        >
                          <LogOut size={14} />
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      aria-expanded={loginMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => setLoginMenuOpen((open) => !open)}
                      className="flex items-center gap-2 rounded-full px-2 py-1 transition-all hover:bg-border-light/40"
                    >
                      <UserIcon
                        size={18}
                        className="text-text-light opacity-60"
                      />
                      <ChevronDown
                        size={14}
                        className={`text-text-light opacity-50 transition-transform ${loginMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {loginMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-11 w-48 overflow-hidden rounded-lg border border-border-light bg-bg-light shadow-lg"
                      >
                        <a
                          role="menuitem"
                          href="/login"
                          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-text-light transition-colors hover:bg-border-light/40 hover:text-primary"
                        >
                          Iniciar sesión
                        </a>
                      </div>
                    )}
                  </div>
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
                { label: 'Productos', href: '/productos' },
                { label: 'Inventario', href: '/inventory' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[13px] text-text-light opacity-[0.55] font-semibold tracking-[0.02em] transition-all hover:text-primary hover:opacity-100"
                >
                  {item.label}
                </a>
              ))}

              {user && (
                <>
                  <a
                    href="/location"
                    className="text-[13px] font-semibold text-primary opacity-90 transition-all hover:opacity-100"
                  >
                    Mis direcciones
                  </a>

                  <a
                    href="/mis-pedidos"
                    className="text-[13px] font-semibold text-primary opacity-90 transition-all hover:opacity-100"
                  >
                    Mis pedidos
                  </a>

                  {canAccessCourier && (
                    <a
                      href="/courier"
                      className="text-[13px] font-semibold text-primary opacity-90 transition-all hover:opacity-100"
                    >
                      Mensajero
                    </a>
                  )}
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
