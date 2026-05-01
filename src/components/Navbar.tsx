import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'sansistore-theme';

const applyTheme = (theme: ThemeMode) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors and keep the visual theme change.
  }
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(currentTheme);
  }, []);

  const handleLogin = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const ignored = [
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
      ];

      if (!(e instanceof FirebaseError) || !ignored.includes(e.code)) {
        console.error(e);
      }
    }
  };

  const handleLogout = () => signOut(auth).catch(console.error);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  // Use Tailwind classes for colors and hover states (colors defined in tailwind.config.cjs)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-bg-light/85 border-b border-border-light font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* LOGO */}
          <a href="/" className="font-black tracking-tight text-[16px] text-text-light">
            sansi<span className="text-primary">store</span>
          </a>

          {/* LINKS */}
          <div className="hidden md:flex items-center gap-8">
            {['Novedades', 'Ofertas', 'Colecciones'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[13px] text-text-light opacity-[0.60] font-semibold tracking-[0.02em] transition-all hover:text-primary hover:opacity-100"
              >
                {item}
              </a>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">

            {/* SEARCH */}
            <button className="transition-all text-text-light opacity-[0.60] hover:text-primary hover:opacity-100">
              <Search size={18} />
            </button>

            {/* CART */}
            <button className="relative transition-all text-text-light opacity-[0.60] hover:text-primary hover:opacity-100">
              <ShoppingBag size={18} />
              <span
                className={`absolute -top-1 -right-1 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold border border-primary ${
                  theme === 'dark'
                    ? 'bg-primary text-bg-dark'
                    : 'bg-primary text-bg-dark'
                }`}
              >
                0
              </span>
            </button>

            {/* THEME */}
            <button
              type="button"
              aria-label="Cambiar tema"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 text-primary transition-all hover:border-primary hover:opacity-100"
            >
              <span className="relative flex h-[18px] w-[18px] items-center justify-center">
                {theme === 'dark' ? (
                  <Moon className="h-[18px] w-[18px]" />
                ) : (
                  <Sun className="h-[18px] w-[18px]" />
                )}
              </span>
            </button>

            {/* AUTH */}
            {authReady &&
              (user ? (
                <div className="flex items-center gap-2">

                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  )}

                  <span className="hidden sm:inline text-[13px] text-text-light opacity-70">
                    {user.displayName}
                  </span>

                  <button onClick={handleLogout} className="opacity-50 transition-all hover:text-primary">
                    <LogOut size={16} />
                  </button>

                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all active:scale-95 text-[13px] font-semibold text-text-light border-border-light hover:border-primary hover:text-primary"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0"
                  >
                    <path
                      fill="#EA4335"
                      d="M12 9.5v5h7.06C18.4 17.57 15.7 19.5 12 19.5a7.5 7.5 0 1 1 0-15c1.85 0 3.52.68 4.82 1.8l3.53-3.53A12 12 0 1 0 24 12c0-.82-.07-1.61-.2-2.36H12Z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.8 9.64H12v4.72h6.67A7.02 7.02 0 0 1 12 19.5c-3.7 0-6.87-2.23-8.22-5.41L.16 16.22A11.97 11.97 0 0 0 12 24c6.63 0 12-5.37 12-12 0-.83-.08-1.63-.2-2.36Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.78 14.09A7.49 7.49 0 0 1 3.5 12c0-.73.11-1.43.28-2.09L.16 6.78A12 12 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"
                    />
                    <path
                      fill="#34A853"
                      d="m3.78 14.09 2.54-1.96A7.49 7.49 0 0 1 4.5 12c0-.74.11-1.44.28-2.09L1.24 8.66A11.94 11.94 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"
                    />
                  </svg>
                  Iniciar sesión
                </button>
              ))}

            {/* MOBILE */}
            <button className="md:hidden text-text-light opacity-60 hover:text-primary" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

          </div>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="md:hidden py-3 flex flex-col gap-3 border-t border-border-light">
            {['Novedades', 'Ofertas', 'Colecciones'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[13px] text-text-light opacity-[0.55] font-semibold tracking-[0.02em] transition-all hover:text-primary hover:opacity-100"
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
