import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
    signInWithPopup,
    signOut,
    setPersistence,
    browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
//HU #159: registrar LOGIN con Google en bitácora
import { registrarAcceso } from '../features/admin/audit/services/accessLogService';

const INSTITUTIONAL_DOMAIN = 'umss.edu';

export interface GoogleLoginButtonProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    variant?: 'full' | 'icon';
    className?: string;
}

export default function GoogleLoginButton({
    onSuccess,
    onError,
    variant = 'full',
    className = '',
}: GoogleLoginButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            await setPersistence(auth, browserLocalPersistence);
            const result = await signInWithPopup(auth, googleProvider);

            if (
                result.user.email &&
                !result.user.email.includes(INSTITUTIONAL_DOMAIN)
            ) {
                await signOut(auth);
                const errorMsg =
                    'Solo se permiten cuentas institucionales para acceder a SansiStore.';
                setError(errorMsg);
                onError?.(errorMsg);
                return;
            }

            const userRef = doc(db, 'users', result.user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                const institutionalId = result.user.email!.split('@')[0];
                await setDoc(userRef, {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName || 'Usuario UMSS',
                    roles: ['comprador'],
                    institutionalId: institutionalId,
                    isActive: true,
                    createdBy: 'system',
                    createdAt: serverTimestamp(),
                });
            }

            //HU #159: registrar LOGIN con Google
            // Si falla el log, no bloqueamos el login
            try {
                const finalSnap = await getDoc(userRef);
                const userData = finalSnap.exists() ? finalSnap.data() : null;
                await registrarAcceso({
                    uid: result.user.uid,
                    displayName: userData?.displayName ?? result.user.displayName ?? 'Usuario UMSS',
                    email: result.user.email ?? '',
                    roles: userData?.roles ?? ['comprador'],
                    action: 'LOGIN',
                });
            } catch {
                console.warn('[AccessLog] No se pudo registrar el acceso Google.');
            }

            onSuccess?.();
        } catch (e: unknown) {
            const ignored = [
                'auth/popup-closed-by-user',
                'auth/cancelled-popup-request',
            ];

            if (!(e instanceof FirebaseError) || !ignored.includes(e.code)) {
                console.error(e);
                const errorMsg = 'Error al iniciar sesión. Intenta de nuevo.';
                setError(errorMsg);
                onError?.(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'icon') {
        return (
            <>
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={`inline-flex items-center justify-center h-8 w-8 rounded-full border border-border-light/40 transition-all hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                    aria-label="Iniciar sesión con Google"
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
                        <path fill="#EA4335" d="M12 9.5v5h7.06C18.4 17.57 15.7 19.5 12 19.5a7.5 7.5 0 1 1 0-15c1.85 0 3.52.68 4.82 1.8l3.53-3.53A12 12 0 1 0 24 12c0-.82-.07-1.61-.2-2.36H12Z"/>
                        <path fill="#4285F4" d="M23.8 9.64H12v4.72h6.67A7.02 7.02 0 0 1 12 19.5c-3.7 0-6.87-2.23-8.22-5.41L.16 16.22A11.97 11.97 0 0 0 12 24c6.63 0 12-5.37 12-12 0-.83-.08-1.63-.2-2.36Z"/>
                        <path fill="#FBBC05" d="M3.78 14.09A7.49 7.49 0 0 1 3.5 12c0-.73.11-1.43.28-2.09L.16 6.78A12 12 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"/>
                        <path fill="#34A853" d="m3.78 14.09 2.54-1.96A7.49 7.49 0 0 1 4.5 12c0-.74.11-1.44.28-2.09L1.24 8.66A11.94 11.94 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"/>
                    </svg>
                </button>
                {error && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</div>
                )}
            </>
        );
    }

    return (
        <>
            <button
                onClick={handleLogin}
                disabled={loading}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all active:scale-95 text-[13px] font-semibold text-text-light border-border-light hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
                    <path fill="#EA4335" d="M12 9.5v5h7.06C18.4 17.57 15.7 19.5 12 19.5a7.5 7.5 0 1 1 0-15c1.85 0 3.52.68 4.82 1.8l3.53-3.53A12 12 0 1 0 24 12c0-.82-.07-1.61-.2-2.36H12Z"/>
                    <path fill="#4285F4" d="M23.8 9.64H12v4.72h6.67A7.02 7.02 0 0 1 12 19.5c-3.7 0-6.87-2.23-8.22-5.41L.16 16.22A11.97 11.97 0 0 0 12 24c6.63 0 12-5.37 12-12 0-.83-.08-1.63-.2-2.36Z"/>
                    <path fill="#FBBC05" d="M3.78 14.09A7.49 7.49 0 0 1 3.5 12c0-.73.11-1.43.28-2.09L.16 6.78A12 12 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"/>
                    <path fill="#34A853" d="m3.78 14.09 2.54-1.96A7.49 7.49 0 0 1 4.5 12c0-.74.11-1.44.28-2.09L1.24 8.66A11.94 11.94 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"/>
                </svg>
                {loading ? 'Cargando...' : 'Iniciar sesión'}
            </button>
            {error && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</div>
            )}
        </>
    );
}