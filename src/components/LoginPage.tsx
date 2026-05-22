import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import GoogleLoginButton from '../components/GoogleLoginButton';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const LOCATION = '/me';

    const performEmailLogin = async () => {
        if (loading) return;
        const emailValue = (document.getElementById('email') as HTMLInputElement | null)?.value || email;
        const passwordValue = (document.getElementById('password') as HTMLInputElement | null)?.value || password;
        console.log('[Login] perform start', emailValue, passwordValue.length);
        setLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, emailValue, passwordValue);
            console.log('[Login] success');
            setSuccess(true);
            window.location.assign(LOCATION);
        } catch (err: unknown) {
            const firebaseError = err as FirebaseError;
            console.error('[Login] fail', firebaseError.code, firebaseError.message);
            setError(
                firebaseError.code === 'auth/invalid-credential'
                    ? 'Correo o contraseña incorrectos'
                    : 'Error al iniciar sesión. Intenta de nuevo.'
            );
            setLoading(false);
        }
    };

    const handleEmailLogin = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        void performEmailLogin();
    };

    const handleGoogleSuccess = () => {
        setSuccess(true);
        window.location.href = LOCATION;
    };

    const handleGoogleError = (errorMsg: string) => {
        setError(errorMsg);
    };

    return (
        <>
            <Navbar />
            <main className="min-h-[calc(100vh-8rem)] bg-bg-light pt-20 pb-12 px-4 flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-text-light">
                            sansi<span className="text-primary">store</span>
                        </h1>
                        <p className="mt-2 text-sm text-text-light opacity-60">
                            Inicia sesión para continuar
                        </p>
                    </div>

                    <div className="rounded-[1.25rem] shadow-lg border border-border-light bg-(--theme-card-bg) p-6">
                        <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-semibold text-text-light mb-1"
                                >
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@umss.edu"
                                    required
                                    className="w-full px-3 py-2 rounded-[0.75rem] border border-border-light bg-(--theme-secondary-bg) text-(--theme-text) text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-semibold text-text-light mb-1"
                                >
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Tu contraseña"
                                        required
                                        autoComplete="off"
                                        className="w-full px-3 py-2 pr-10 rounded-[0.75rem] border border-border-light bg-(--theme-secondary-bg) text-(--theme-text) text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="group absolute right-3 top-1/2 -translate-y-1/2 text-text-light opacity-50 hover:opacity-100 transition-opacity"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-bg-light bg-text-light rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => { void performEmailLogin(); }}
                                className="w-full py-2 px-4 rounded-full uppercase font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-bg-light hover:bg-primary/90"
                            >
                                {loading ? 'Ingresando...' : 'Iniciar sesión'}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border-light"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-(--theme-card-bg) text-(--theme-text) opacity-60">
                                    o
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <GoogleLoginButton
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                            />
                        </div>

                        {error && (
                            <p className="mt-4 text-center text-sm" style={{ color: 'var(--theme-error)' }}>
                                {error}
                            </p>
                        )}

                        {success && (
                            <p className="mt-4 text-center text-sm" style={{ color: 'var(--theme-success)' }}>
                                ¡Inicio de sesión exitoso! Redirigiendo...
                            </p>
                        )}
                    </div>

                    <p className="mt-6 text-center text-xs text-text-light opacity-50">
                        Solo se permiten cuentas institucionales con dominio umss.edu
                    </p>
                </div>
            </main>
            <Footer />
        </>
    );
}
