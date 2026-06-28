import type { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Eye, EyeOff, ShoppingBag } from "lucide-react";
import { useState } from "react";
import Footer from "../components/Footer";
import GoogleLoginButton from "../components/GoogleLoginButton";
import Navbar from "../components/Navbar";
// ── HU #159: registrar LOGIN en bitácora ──
import { registrarAcceso } from "../features/admin/audit/services/accessLogService";
import { getDefaultRouteForRoles } from "../features/auth/utils/defaultRoute";
import { auth, db } from "../lib/firebase";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const performEmailLogin = async () => {
		if (loading) return;
		// Fallback al valor del DOM: en este setup (Astro islands) el autofill del
		// navegador puede rellenar los inputs sin disparar onChange, dejando el
		// estado de React vacío. Leemos el DOM si el estado está vacío.
		const emailValue =
			email ||
			(document.getElementById("email") as HTMLInputElement | null)?.value ||
			"";
		const passwordValue =
			password ||
			(document.getElementById("password") as HTMLInputElement | null)?.value ||
			"";

		if (!emailValue || !passwordValue) {
			setError("Ingresa tu correo y contraseña.");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const result = await signInWithEmailAndPassword(
				auth,
				emailValue,
				passwordValue,
			);

			// HU #159: registrar LOGIN. Si falla el log, no bloqueamos el login.
			let roles: unknown = [];

			try {
				const userSnap = await getDoc(doc(db, "users", result.user.uid));
				const userData = userSnap.exists() ? userSnap.data() : null;
				roles = userData?.roles ?? [];
				await registrarAcceso({
					uid: result.user.uid,
					displayName:
						userData?.displayName ?? result.user.displayName ?? "Usuario",
					email: result.user.email ?? emailValue,
					roles: Array.isArray(roles) ? roles : [],
					action: "LOGIN",
				});
			} catch {
				console.warn("[AccessLog] No se pudo registrar el acceso.");
			}

			setSuccess(true);
			window.location.assign(getDefaultRouteForRoles(roles));
		} catch (err: unknown) {
			const firebaseError = err as FirebaseError;
			setError(
				firebaseError.code === "auth/invalid-credential"
					? "Correo o contraseña incorrectos"
					: "Error al iniciar sesión. Intenta de nuevo.",
			);
			setLoading(false);
		}
	};

	const handleEmailLogin = (e: React.FormEvent) => {
		e.preventDefault();
		void performEmailLogin();
	};

	const handleGoogleSuccess = (redirectPath: string) => {
		setSuccess(true);
		window.location.href = redirectPath;
	};

	const handleGoogleError = (errorMsg: string) => {
		setError(errorMsg);
	};

	return (
		<div className="flex min-h-screen flex-col bg-(--theme-bg)">
			<Navbar />
			<main className="flex flex-1 items-center justify-center px-4 py-12">
				<div className="w-full max-w-sm">
					{/* Branding */}
					<div className="mb-10 flex flex-col items-center text-center">
						<span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
							<ShoppingBag size={28} strokeWidth={2.4} />
						</span>
						<h1 className="mt-5 text-2xl font-black tracking-tight text-(--theme-text)">
							Sansi<span className="text-primary">Store</span>
						</h1>
						<p className="mt-2 text-sm text-(--theme-text) opacity-60">
							Inicia sesión con tu cuenta institucional
						</p>
					</div>

					<form onSubmit={handleEmailLogin} noValidate className="space-y-5">
						<div>
							<label
								htmlFor="email"
								className="mb-1.5 block text-sm font-semibold text-(--theme-text)"
							>
								Correo electrónico
							</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="usuario@umss.edu"
								autoComplete="email"
								required
								className="w-full rounded-xl border border-(--theme-border) bg-(--theme-card-bg) px-4 py-2.5 text-sm text-(--theme-text) transition-colors placeholder:text-(--theme-text) placeholder:opacity-40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="mb-1.5 block text-sm font-semibold text-(--theme-text)"
							>
								Contraseña
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Tu contraseña"
									autoComplete="current-password"
									required
									className="w-full rounded-xl border border-(--theme-border) bg-(--theme-card-bg) px-4 py-2.5 pr-11 text-sm text-(--theme-text) transition-colors placeholder:text-(--theme-text) placeholder:opacity-40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-(--theme-text) opacity-50 transition-opacity hover:opacity-100"
									aria-label={
										showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
									}
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						{error && (
							<div className="rounded-xl border border-(--theme-error-border) bg-(--theme-error-bg) px-4 py-2.5 text-center text-sm text-(--theme-error)">
								{error}
							</div>
						)}

						{success && (
							<div className="rounded-xl border border-(--theme-success-border) bg-(--theme-success-bg) px-4 py-2.5 text-center text-sm text-(--theme-success)">
								¡Inicio de sesión exitoso! Redirigiendo...
							</div>
						)}

						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? "Ingresando..." : "Iniciar sesión"}
						</button>
					</form>

					<div className="my-6 flex items-center gap-4">
						<div className="h-px flex-1 bg-(--theme-border)" />
						<span className="text-xs font-medium text-(--theme-text) opacity-50">
							o continúa con
						</span>
						<div className="h-px flex-1 bg-(--theme-border)" />
					</div>

					<GoogleLoginButton
						className="w-full"
						onSuccess={handleGoogleSuccess}
						onError={handleGoogleError}
					/>

					<p className="mt-8 text-center text-xs text-(--theme-text) opacity-50">
						Solo se permiten cuentas institucionales con dominio umss.edu
					</p>
				</div>
			</main>
			<Footer />
		</div>
	);
}
