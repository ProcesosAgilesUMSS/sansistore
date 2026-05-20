import type { ReactNode } from 'react';
import { useUserAuthSeller } from '../hooks/userAuthSeller';

interface SellerRouteGuardProps {
  children: ReactNode;
}

export default function SellerRouteGuard({ children }: SellerRouteGuardProps) {
  const { accessState, isAllowed } = useUserAuthSeller();

  if (isAllowed) {
    return <>{children}</>;
  }

  const title =
    accessState === 'checking'
      ? 'Verificando acceso'
      : accessState === 'unauthenticated'
        ? 'Inicia sesion'
        : 'Acceso denegado';

  const message =
    accessState === 'checking'
      ? 'Estamos revisando tus permisos de vendedor.'
      : accessState === 'unauthenticated'
        ? 'Debes iniciar sesion para acceder al panel de vendedor.'
        : 'Tu usuario no tiene rol de vendedor.';

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
          Vendedor
        </p>
        <h1 className="mt-3 text-2xl font-black text-(--theme-text)">{title}</h1>
        <p className="mt-2 text-sm font-semibold text-(--theme-text) opacity-70">
          {message}
        </p>
        {accessState !== 'checking' && (
          <a
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-primary px-5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
          >
            Volver al inicio
          </a>
        )}
      </div>
    </section>
  );
}
