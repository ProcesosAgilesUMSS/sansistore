import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  subscribeToStockAlert,
  unsubscribeFromStockAlert,
  isSubscribedToStockAlert,
} from '../../features/cart/services/stockAlerts';

interface Props {
  productId: string;
}

type Status = 'loading' | 'unauthenticated' | 'subscribed' | 'unsubscribed';

export default function StockAlertButton({ productId }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus('unauthenticated');
        setUserId(null);
        return;
      }
      setUserId(user.uid);
      try {
        const subscribed = await isSubscribedToStockAlert(productId, user.uid);
        setStatus(subscribed ? 'subscribed' : 'unsubscribed');
      } catch {
        setStatus('unsubscribed');
      }
    });
    return () => unsub();
  }, [productId]);

  async function handleToggle() {
    if (!userId || working) {
      return;
    }
    setWorking(true);
    try {
      if (status === 'subscribed') {
        await unsubscribeFromStockAlert(productId, userId);
        setStatus('unsubscribed');
      } else {
        await subscribeToStockAlert(productId, userId);
        setStatus('subscribed');
      }
    } catch (error) {
      console.error('Error toggling stock alert:', error);
    } finally {
      setWorking(false);
    }
  }

  if (status === 'loading') {
    return (
      <button
        disabled
        className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-border-light px-6 py-2.5 text-sm font-semibold text-text-light opacity-50"
      >
        <Loader size={16} className="animate-spin" />
        Cargando...
      </button>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <p className="mt-4 text-sm text-text-light opacity-60">
        <a href="/iniciar-sesion" className="text-primary underline hover:opacity-80">
          Inicia sesión
        </a>{' '}
        para recibir una alerta cuando este producto esté disponible.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={working}
      className={`mt-4 inline-flex w-fit items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
        status === 'subscribed'
          ? 'border-primary bg-primary text-white hover:opacity-90'
          : 'border-border-light text-text-light hover:border-primary hover:text-primary'
      }`}
    >
      {working ? (
        <Loader size={16} className="animate-spin" />
      ) : status === 'subscribed' ? (
        <BellOff size={16} />
      ) : (
        <Bell size={16} />
      )}
      {status === 'subscribed'
        ? 'Cancelar alerta'
        : 'Avisarme cuando esté disponible'}
    </button>
  );
}
