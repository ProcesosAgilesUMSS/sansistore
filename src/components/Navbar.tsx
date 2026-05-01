import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, LogOut } from 'lucide-react';
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

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
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

  const linkStyle = {
    fontSize: '13px',
    color: '#1E1E1E',
    opacity: 0.55,
    fontWeight: 600,
    letterSpacing: '0.02em',
    transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
  };

  const hoverGreen = (e: any) => {
    e.currentTarget.style.color = '#88B04B';
    e.currentTarget.style.opacity = '1';
  };

  const hoverReset = (e: any) => {
    e.currentTarget.style.color = '#1E1E1E';
    e.currentTarget.style.opacity = '0.55';
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(255, 251, 244, 0.85)',
        borderBottom: '1px solid rgba(136,176,75,0.15)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* LOGO */}
          <a
            href="/"
            className="font-black tracking-tight"
            style={{ fontSize: '16px', color: '#1E1E1E' }}
          >
            sansi<span style={{ color: '#88B04B' }}>store</span>
          </a>

          {/* LINKS */}
          <div className="hidden md:flex items-center gap-8">
            {['Novedades', 'Ofertas', 'Colecciones'].map((item) => (
              <a
                key={item}
                href="#"
                style={linkStyle}
                onMouseEnter={hoverGreen}
                onMouseLeave={hoverReset}
              >
                {item}
              </a>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">

            {/* SEARCH */}
            <button
              className="transition-all"
              style={{ color: '#1E1E1E', opacity: 0.55 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#88B04B';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#1E1E1E';
                e.currentTarget.style.opacity = '0.55';
              }}
            >
              <Search size={18} />
            </button>

            {/* CART */}
            <button
              className="relative transition-all"
              style={{ color: '#1E1E1E', opacity: 0.55 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#88B04B';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#1E1E1E';
                e.currentTarget.style.opacity = '0.55';
              }}
            >
              <ShoppingBag size={18} />
              <span
                className="absolute -top-1 -right-1 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: '#1E1E1E',
                  color: '#FFFBF4',
                }}
              >
                0
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

                  <span
                    className="hidden sm:inline"
                    style={{
                      fontSize: '13px',
                      color: '#1E1E1E',
                      opacity: 0.7,
                    }}
                  >
                    {user.displayName}
                  </span>

                  <button
                    onClick={handleLogout}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#88B04B')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#1E1E1E')}
                    style={{ opacity: 0.5, transition: 'all 0.3s cubic-bezier(0.2,0,0,1)' }}
                  >
                    <LogOut size={16} />
                  </button>

                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-4 py-1.5 rounded-full border transition-all active:scale-95"
                  style={{
                    borderColor: 'rgba(136,176,75,0.25)',
                    color: '#1E1E1E',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.2,0,0,1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#88B04B';
                    e.currentTarget.style.color = '#88B04B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(136,176,75,0.25)';
                    e.currentTarget.style.color = '#1E1E1E';
                  }}
                >
                  Iniciar sesión
                </button>
              ))}

            {/* MOBILE */}
            <button
              className="md:hidden"
              style={{ color: '#1E1E1E', opacity: 0.6 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#88B04B')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1E1E1E')}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

          </div>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div
            className="md:hidden py-3 flex flex-col gap-3"
            style={{
              borderTop: '1px solid rgba(136,176,75,0.15)',
            }}
          >
            {['Novedades', 'Ofertas', 'Colecciones'].map((item) => (
              <a
                key={item}
                href="#"
                style={linkStyle}
                onMouseEnter={hoverGreen}
                onMouseLeave={hoverReset}
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