import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import DeliveryActionsPanel from './DeliveryActionsPanel';

type AccessState = 'checking' | 'allowed' | 'unauthenticated' | 'denied';

export default function CourierRouteGuard() {
  const [accessState, setAccessState] = useState<AccessState>('checking');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccessState('unauthenticated');
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const roles = userSnap.data()?.roles;
        setAccessState(
          Array.isArray(roles) && roles.includes('mensajero')
            ? 'allowed'
            : 'denied'
        );
      } catch {
        setAccessState('denied');
      }
    });

    return unsubscribe;
  }, []);

  if (accessState === 'allowed') {
    return <DeliveryActionsPanel />;
  }

  const title =
    accessState === 'checking'
      ? 'Verificando acceso'
      : accessState === 'unauthenticated'
        ? 'Inicia sesion'
        : 'Acceso denegado';
  const message =
    accessState === 'checking'
      ? 'Estamos revisando tus permisos de mensajero.'
      : accessState === 'unauthenticated'
        ? 'Debes iniciar sesion para acceder al panel de entregas.'
        : 'Tu usuario no tiene rol de mensajero.';

  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border-light bg-card-bg-light p-6 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
          Courier
        </p>
        <h1 className="mt-3 text-2xl font-black text-text-light">{title}</h1>
        <p className="mt-2 text-sm font-semibold text-text-light/70">
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
