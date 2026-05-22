import type { ReactNode } from 'react';
import { useRouteGuard } from '../hooks/useRouteGuard';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  roleName?: string;
  title?: string;
  message?: string;
  unauthorizedMessage?: string;
}

export default function RouteGuard({
  children,
  allowedRoles,
  roleName,
  title,
  message,
  unauthorizedMessage,
}: RouteGuardProps) {
  const { accessState, isAllowed } = useRouteGuard(allowedRoles);

  if (isAllowed) {
    return <>{children}</>;
  }

  const displayTitle =
    title ??
    (accessState === 'checking'
      ? 'Verificando acceso'
      : accessState === 'unauthenticated'
        ? 'Inicia sesion'
        : 'Acceso denegado');

  const displayMessage =
    message ??
    (accessState === 'checking'
      ? 'Estamos revisando tus permisos.'
      : accessState === 'unauthenticated'
        ? 'Debes iniciar sesion para acceder a esta pagina.'
        : unauthorizedMessage ?? 'No tienes permiso para acceder a esta pagina.');

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6 text-center shadow-sm">
        {roleName && (
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            {roleName}
          </p>
        )}
        <h1 className="mt-3 text-2xl font-black text-(--theme-text)">{displayTitle}</h1>
        <p className="mt-2 text-sm font-semibold text-(--theme-text) opacity-70">
          {displayMessage}
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
