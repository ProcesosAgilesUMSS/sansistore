import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
	AlertCircle,
	Check,
	CheckCircle,
	ChevronRight,
	CreditCard,
	Mail,
	MapPin,
	Package,
	Pencil,
	Phone,
	Star,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { getDeliveryStatsByCourier } from "./courierServices.ts";

interface ProfileData {
	displayName: string;
	ci: string;
	email: string;
	phone: string;
	secondaryMail: string;
	photoURL: string;
	roles: string[];
	deliveryRating?: number;
}

interface DeliveryStatsData {
	totalDelivered: number;
	totalNotDelivered: number;
	total: number;
	deliveryRate: number;
	isLoading: boolean;
}

const ROLE_LABELS: Record<string, string> = {
	comprador: "Comprador",
	mensajero: "Mensajero",
	admin: "Administrador",
	vendedor: "Vendedor",
	almacen: "Almacén",
};

const formatRole = (role: string) =>
	ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);

export default function ProfileView() {
	const [loading, setLoading] = useState(true);
	const [authenticated, setAuthenticated] = useState(false);
	const [uid, setUid] = useState<string | null>(null);
	const [profile, setProfile] = useState<ProfileData>({
		displayName: "",
		ci: "No registrado",
		email: "",
		phone: "No registrado",
		secondaryMail: "No registrado",
		photoURL: "",
		roles: [],
	});
	const [deliveryStats, setDeliveryStats] = useState<DeliveryStatsData>({
		totalDelivered: 0,
		totalNotDelivered: 0,
		total: 0,
		deliveryRate: 0,
		isLoading: true,
	});

	const [toast, setToast] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const [isEditingPhone, setIsEditingPhone] = useState(false);
	const [isEditingMail, setIsEditingMail] = useState(false);
	const [isEditingCi, setIsEditingCi] = useState(false);

	const [tempPhone, setTempPhone] = useState("");
	const [tempMail, setTempMail] = useState("");
	const [tempCi, setTempCi] = useState("");

	const [errors, setErrors] = useState<{
		phone?: string;
		secondaryMail?: string;
		ci?: string;
	}>({});
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (!user) {
				setAuthenticated(false);
				setLoading(false);
				return;
			}

			setUid(user.uid);

			// La autenticación depende de que exista `user`, NO de que Firestore
			// responda. Marcamos autenticado y sembramos lo básico desde auth de
			// inmediato; si la lectura de Firestore falla, igual mostramos el perfil.
			setAuthenticated(true);
			setProfile((prev) => ({
				...prev,
				displayName: user.displayName || "Sin nombre",
				email: user.email || "No disponible",
				photoURL: user.photoURL || "",
			}));

			try {
				const userDoc = await getDoc(doc(db, "users", user.uid));
				let phone = "No registrado";
				let secondaryMail = "No registrado";
				let ci = "No registrado";
				let userRoles: string[] = [];
				let deliveryRating: number | undefined;

				if (userDoc.exists()) {
					const data = userDoc.data();
					phone = data.phone || "No registrado";
					secondaryMail = data.secondaryMail || "No registrado";
					ci = data.ci ? String(data.ci) : "No registrado";
					userRoles = Array.isArray(data.roles) ? data.roles : [];
					deliveryRating = data.deliveryRating ?? undefined;
				}

				setProfile({
					displayName: user.displayName || "Sin nombre",
					ci,
					email: user.email || "No disponible",
					phone,
					secondaryMail,
					photoURL: user.photoURL || "",
					roles: userRoles,
					deliveryRating,
				});

				const isMensajero =
					userRoles.includes("mensajero") || userRoles.includes("admin");

				if (isMensajero) {
					try {
						const stats = await getDeliveryStatsByCourier(user.uid);
						setDeliveryStats({
							totalDelivered: stats.totalDelivered,
							totalNotDelivered: stats.totalNotDelivered,
							total: stats.total,
							deliveryRate: stats.deliveryRate,
							isLoading: false,
						});
					} catch (error) {
						console.error("Error cargando estadísticas de delivery:", error);
						setDeliveryStats((prev) => ({ ...prev, isLoading: false }));
					}
				} else {
					setDeliveryStats((prev) => ({ ...prev, isLoading: false }));
				}
			} catch (error) {
				console.error("Error cargando perfil:", error);
				setDeliveryStats((prev) => ({ ...prev, isLoading: false }));
			} finally {
				setLoading(false);
			}
		});

		return unsubscribe;
	}, []);

	const showToast = (type: "success" | "error", message: string) => {
		setToast({ type, message });
		setTimeout(() => setToast(null), 4000);
	};

	const validatePhone = (value: string): boolean => {
		setErrors((prev) => ({ ...prev, phone: undefined }));
		const phoneRegex = /^[67]\d{7}$/;
		if (!value || value.trim() === "" || value === "No registrado") {
			setErrors((prev) => ({
				...prev,
				phone: "El teléfono celular es obligatorio.",
			}));
			return false;
		}
		if (!phoneRegex.test(value)) {
			setErrors((prev) => ({
				...prev,
				phone: "Debe tener 8 dígitos e iniciar con 6 o 7.",
			}));
			return false;
		}
		return true;
	};

	const validateMail = (value: string): boolean => {
		setErrors((prev) => ({ ...prev, secondaryMail: undefined }));
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!value || value.trim() === "" || value === "No registrado") return true;
		if (value.length > 100) {
			setErrors((prev) => ({
				...prev,
				secondaryMail: "El correo no puede exceder los 100 caracteres.",
			}));
			return false;
		}
		if (!emailRegex.test(value)) {
			setErrors((prev) => ({
				...prev,
				secondaryMail: "Formato de correo electrónico inválido.",
			}));
			return false;
		}
		return true;
	};

	const validateCi = (value: string): boolean => {
		setErrors((prev) => ({ ...prev, ci: undefined }));
		if (!value || value.trim() === "" || value === "No registrado") {
			setErrors((prev) => ({
				...prev,
				ci: "El carnet de identidad es obligatorio.",
			}));
			return false;
		}
		if (!/^\d+$/.test(value)) {
			setErrors((prev) => ({
				...prev,
				ci: "El CI solo debe contener números.",
			}));
			return false;
		}
		if (value.length < 5 || value.length > 10) {
			setErrors((prev) => ({
				...prev,
				ci: "El CI debe tener entre 5 y 10 dígitos.",
			}));
			return false;
		}
		return true;
	};

	const handleStartEditPhone = () => {
		setTempPhone(profile.phone === "No registrado" ? "" : profile.phone);
		setErrors((prev) => ({ ...prev, phone: undefined }));
		setIsEditingPhone(true);
	};

	const handleStartEditMail = () => {
		setTempMail(
			profile.secondaryMail === "No registrado" ? "" : profile.secondaryMail,
		);
		setErrors((prev) => ({ ...prev, secondaryMail: undefined }));
		setIsEditingMail(true);
	};

	const handleStartEditCi = () => {
		setTempCi(profile.ci === "No registrado" ? "" : profile.ci);
		setErrors((prev) => ({ ...prev, ci: undefined }));
		setIsEditingCi(true);
	};

	const handleSavePhone = async () => {
		if (!validatePhone(tempPhone) || !uid) return;
		try {
			await setDoc(
				doc(db, "users", uid),
				{ phone: tempPhone },
				{ merge: true },
			);
			setProfile((prev) => ({ ...prev, phone: tempPhone }));
			setIsEditingPhone(false);
			showToast("success", "Teléfono celular actualizado correctamente");
		} catch (error) {
			console.error(error);
			showToast("error", "Ocurrió un error al guardar el teléfono");
		}
	};

	const handleSaveMail = async () => {
		if (!validateMail(tempMail) || !uid) return;
		const finalMail = tempMail.trim() === "" ? "No registrado" : tempMail;
		try {
			await setDoc(
				doc(db, "users", uid),
				{ secondaryMail: finalMail },
				{ merge: true },
			);
			setProfile((prev) => ({ ...prev, secondaryMail: finalMail }));
			setIsEditingMail(false);
			showToast("success", "Correo de respaldo actualizado correctamente");
		} catch (error) {
			console.error(error);
			showToast("error", "Ocurrió un error al guardar el correo");
		}
	};

	const handleSaveCi = async () => {
		if (!validateCi(tempCi) || !uid) return;
		try {
			await setDoc(doc(db, "users", uid), { ci: tempCi }, { merge: true });
			setProfile((prev) => ({ ...prev, ci: tempCi }));
			setIsEditingCi(false);
			showToast("success", "Carnet de identidad actualizado correctamente");
		} catch (error) {
			console.error(error);
			showToast("error", "Ocurrió un error al guardar el CI");
		}
	};

	if (loading) {
		return <ProfileSkeleton />;
	}

	if (!authenticated) {
		return (
			<div className="flex flex-col items-center gap-6 py-10 text-center">
				<p className="font-semibold text-(--theme-error)">No autenticado</p>
				<a
					href="/iniciar-sesion"
					className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-105"
				>
					Iniciar sesión
				</a>
			</div>
		);
	}

	// --- LÓGICA DE ROLES ---
	const showMisDirecciones = true; // Todo usuario autenticado puede tener direcciones
	const showMisPedidos =
		profile.roles.length === 0 ||
		profile.roles.some((r) => ["comprador", "admin"].includes(r));
	const showCalificacionMensajero =
		profile.roles.includes("mensajero") || profile.roles.includes("admin");
	const isMensajero =
		profile.roles.includes("mensajero") || profile.roles.includes("admin");

	return (
		<>
			{toast && (
				<div
					className={`fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2.5 text-white shadow-lg animate-fade-in ${
						toast.type === "success" ? "bg-primary" : "bg-(--theme-error)"
					}`}
				>
					{toast.type === "success" ? (
						<CheckCircle size={15} />
					) : (
						<AlertCircle size={15} />
					)}
					<span className="text-sm font-bold">{toast.message}</span>
				</div>
			)}

			<div className="grid gap-5 lg:grid-cols-3 lg:items-start">
				{/* Tarjeta de identidad */}
				<section className="overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) shadow-sm lg:sticky lg:top-28">
					<div className="h-20 bg-gradient-to-r from-primary to-primary/60" />
					<div className="flex flex-col items-center px-6 pb-6 text-center">
						{profile.photoURL ? (
							<img
								src={profile.photoURL}
								alt={profile.displayName}
								className="-mt-12 size-24 rounded-full border-4 border-(--theme-card-bg) object-cover shadow-md"
							/>
						) : (
							<div className="-mt-12 flex size-24 items-center justify-center rounded-full border-4 border-(--theme-card-bg) bg-primary text-2xl font-black text-white shadow-md">
								{profile.displayName.charAt(0).toUpperCase()}
							</div>
						)}

						<h2 className="mt-3 text-lg font-black tracking-tight text-(--theme-text)">
							{profile.displayName}
						</h2>
						<p className="mt-0.5 text-sm font-medium text-(--theme-text) opacity-60">
							{profile.email}
						</p>

						{profile.roles.length > 0 && (
							<div className="mt-3 flex flex-wrap justify-center gap-1.5">
								{profile.roles.map((role) => (
									<span
										key={role}
										className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
									>
										{formatRole(role)}
									</span>
								))}
							</div>
						)}

						{showCalificacionMensajero &&
							profile.deliveryRating !== undefined && (
								<div className="mt-3 flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
									<Star size={13} fill="currentColor" />
									<span>
										Calificación: {profile.deliveryRating.toFixed(1)} / 5.0
									</span>
								</div>
							)}
					</div>
				</section>

				{/* Columna de detalles */}
				<div className="flex flex-col gap-5 lg:col-span-2">
				{/* Información personal */}
				<section className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-sm">
					<h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-(--theme-text) opacity-50">
						Información personal
					</h3>
					<div className="flex flex-col divide-y divide-(--theme-border)">
						<EditableField
							icon={<CreditCard size={17} />}
							label="Carnet de identidad"
							inputId="profile-ci-input"
							value={profile.ci}
							isEditing={isEditingCi}
							tempValue={tempCi}
							onTempChange={setTempCi}
							onStart={handleStartEditCi}
							onSave={handleSaveCi}
							onCancel={() => setIsEditingCi(false)}
							error={errors.ci}
							placeholder="Ej. 12345678"
							inputMode="numeric"
							autoComplete="off"
							maxLength={10}
							pattern="[0-9]{5,10}"
							sanitizeValue={(value) => value.replace(/\D/g, "").slice(0, 10)}
						/>
						<EditableField
							icon={<Phone size={17} />}
							label="Teléfono celular"
							inputId="profile-phone-input"
							value={profile.phone}
							isEditing={isEditingPhone}
							tempValue={tempPhone}
							onTempChange={setTempPhone}
							onStart={handleStartEditPhone}
							onSave={handleSavePhone}
							onCancel={() => setIsEditingPhone(false)}
							error={errors.phone}
							placeholder="Ej. 71234567"
							inputMode="numeric"
							autoComplete="tel"
							maxLength={8}
							pattern="[67][0-9]{7}"
							sanitizeValue={(value) => value.replace(/\D/g, "").slice(0, 8)}
						/>
						<EditableField
							icon={<Mail size={17} />}
							label="Correo de respaldo"
							inputId="profile-secondary-mail-input"
							type="email"
							value={profile.secondaryMail}
							isEditing={isEditingMail}
							tempValue={tempMail}
							onTempChange={setTempMail}
							onStart={handleStartEditMail}
							onSave={handleSaveMail}
							onCancel={() => setIsEditingMail(false)}
							error={errors.secondaryMail}
							placeholder="ejemplo@correo.com"
							autoComplete="email"
							maxLength={100}
							spellCheck={false}
							autoCapitalize="none"
							sanitizeValue={(value) => value.replace(/\s+/g, "")}
						/>
					</div>
				</section>

				{/* Estadísticas de Delivery */}
				{isMensajero && (
					<section className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-sm">
						<h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-(--theme-text) opacity-50">
							Estadísticas de delivery
						</h3>
						{deliveryStats.isLoading ? (
							<div className="grid animate-pulse grid-cols-2 gap-3 md:grid-cols-4">
								{[0, 1, 2, 3].map((i) => (
									<div
										key={i}
										className="h-[68px] rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg)"
									/>
								))}
							</div>
						) : (
							<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
								<StatCard
									label="Total"
									value={deliveryStats.total}
									tone="neutral"
								/>
								<StatCard
									label="Entregados"
									value={deliveryStats.totalDelivered}
									tone="success"
								/>
								<StatCard
									label="No entregados"
									value={deliveryStats.totalNotDelivered}
									tone="error"
								/>
								<StatCard
									label="Tasa de éxito"
									value={`${deliveryStats.deliveryRate}%`}
									tone="info"
								/>
							</div>
						)}
					</section>
				)}

				{/* Gestión de Cuenta */}
				{(showMisPedidos || showMisDirecciones) && (
					<section className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-sm">
						<h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-(--theme-text) opacity-50">
							Gestión de cuenta
						</h3>
						<div className="grid gap-3 sm:grid-cols-2">
							{showMisDirecciones && (
								<AccountLink
									href="/ubicaciones"
									icon={<MapPin size={18} />}
									title="Mis direcciones"
									subtitle="Gestionar mis lugares de entrega"
								/>
							)}
							{showMisPedidos && (
								<AccountLink
									href="/mis-pedidos"
									icon={<Package size={18} />}
									title="Mis pedidos y devoluciones"
									subtitle="Ver mis compras"
								/>
							)}
						</div>
					</section>
				)}
				</div>
			</div>
		</>
	);
}

function ProfileSkeleton() {
	return (
		<div className="grid animate-pulse gap-5 lg:grid-cols-3 lg:items-start">
			{/* Tarjeta de identidad */}
			<section className="overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) shadow-sm">
				<div className="h-20 bg-(--theme-secondary-bg)" />
				<div className="flex flex-col items-center px-6 pb-6">
					<div className="-mt-12 size-24 rounded-full border-4 border-(--theme-card-bg) bg-(--theme-secondary-bg)" />
					<div className="mt-3 h-5 w-40 rounded bg-(--theme-secondary-bg)" />
					<div className="mt-2 h-3 w-52 rounded bg-(--theme-secondary-bg)" />
					<div className="mt-3 flex gap-1.5">
						<div className="h-5 w-20 rounded-full bg-(--theme-secondary-bg)" />
						<div className="h-5 w-16 rounded-full bg-(--theme-secondary-bg)" />
					</div>
				</div>
			</section>

			{/* Columna de detalles */}
			<div className="flex flex-col gap-5 lg:col-span-2">
			{/* Información personal */}
			<section className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-sm">
				<div className="mb-4 h-3 w-32 rounded bg-(--theme-secondary-bg)" />
				<div className="flex flex-col divide-y divide-(--theme-border)">
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
						>
							<div className="size-9 shrink-0 rounded-full bg-(--theme-secondary-bg)" />
							<div className="flex-1 space-y-1.5">
								<div className="h-2.5 w-24 rounded bg-(--theme-secondary-bg)" />
								<div className="h-3.5 w-36 rounded bg-(--theme-secondary-bg)" />
							</div>
							<div className="size-7 shrink-0 rounded-lg bg-(--theme-secondary-bg)" />
						</div>
					))}
				</div>
			</section>

			{/* Gestión de cuenta */}
			<section className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-sm">
				<div className="mb-4 h-3 w-32 rounded bg-(--theme-secondary-bg)" />
				<div className="grid gap-3 sm:grid-cols-2">
					{[0, 1].map((i) => (
						<div
							key={i}
							className="flex items-center gap-3 rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg) p-3"
						>
							<div className="size-10 shrink-0 rounded-full bg-(--theme-card-bg)" />
							<div className="flex-1 space-y-1.5">
								<div className="h-3.5 w-40 rounded bg-(--theme-card-bg)" />
								<div className="h-2.5 w-28 rounded bg-(--theme-card-bg)" />
							</div>
						</div>
					))}
				</div>
			</section>
			</div>
		</div>
	);
}

interface EditableFieldProps {
	icon: React.ReactNode;
	label: string;
	inputId: string;
	value: string;
	isEditing: boolean;
	tempValue: string;
	onTempChange: (value: string) => void;
	onStart: () => void;
	onSave: () => void;
	onCancel: () => void;
	error?: string;
	placeholder?: string;
	type?: string;
	inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
	autoComplete?: string;
	maxLength?: number;
	pattern?: string;
	spellCheck?: boolean;
	autoCapitalize?: string;
	sanitizeValue?: (value: string) => string;
}

function EditableField({
	icon,
	label,
	inputId,
	value,
	isEditing,
	tempValue,
	onTempChange,
	onStart,
	onSave,
	onCancel,
	error,
	placeholder,
	type = "text",
	inputMode,
	autoComplete,
	maxLength,
	pattern,
	spellCheck,
	autoCapitalize,
	sanitizeValue,
}: EditableFieldProps) {
	const isEmpty = value === "No registrado";

	return (
		<div className={`rounded-xl px-2 py-3.5 transition-all first:pt-0 last:pb-0 ${
			isEditing ? 'bg-primary/5 ring-1 ring-primary/10' : ''
		}`}>
			<div className="flex items-center gap-3">
				<div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-primary transition-all ${
					isEditing ? 'bg-primary/14 ring-4 ring-primary/8' : 'bg-primary/10'
				}`}>
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-xs font-bold uppercase tracking-wider text-(--theme-text) opacity-50">
						{label}
					</p>
					{isEditing ? (
						<>
							<div className="mt-1 flex items-center gap-2">
								<input
									id={inputId}
									type={type}
									value={tempValue}
									onChange={(e) =>
										onTempChange(
											sanitizeValue ? sanitizeValue(e.target.value) : e.target.value,
										)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") onSave();
										if (e.key === "Escape") onCancel();
									}}
									placeholder={placeholder}
									inputMode={inputMode}
									autoComplete={autoComplete}
									maxLength={maxLength}
									pattern={pattern}
									spellCheck={spellCheck}
									autoCapitalize={autoCapitalize}
									className={`min-w-0 flex-1 rounded-lg border bg-(--theme-secondary-bg) px-3 py-1.5 text-sm font-semibold text-(--theme-text) shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
										error
											? "border-(--theme-error) focus:border-(--theme-error)"
											: "border-(--theme-border) focus:border-primary"
									}`}
								/>
							<button
								type="button"
								onClick={onSave}
								aria-label={`Confirmar ${label}`}
								className="rounded-lg p-1.5 text-(--theme-text) opacity-60 transition-all hover:bg-primary/10 hover:text-primary hover:opacity-100"
							>
								<Check size={16} />
							</button>
							<button
								type="button"
								onClick={onCancel}
								aria-label={`Cancelar edición de ${label}`}
								className="rounded-lg p-1.5 text-(--theme-text) opacity-40 transition-all hover:bg-(--theme-error-bg) hover:text-(--theme-error) hover:opacity-100"
							>
								<X size={16} />
							</button>
						</div>
						</>
					) : (
						<p
							className={`truncate text-sm font-bold ${
								isEmpty
									? "text-(--theme-text) opacity-40"
									: "text-(--theme-text)"
							}`}
						>
							{value}
						</p>
					)}
				</div>
				{!isEditing && (
					<button
						type="button"
						onClick={onStart}
						aria-label={`Editar ${label}`}
						className="shrink-0 rounded-lg p-2 text-(--theme-text) opacity-40 transition-all hover:bg-primary/10 hover:text-primary hover:opacity-100"
					>
						<Pencil size={14} />
					</button>
				)}
			</div>
			{isEditing && error && (
				<p className="mt-1.5 pl-12 text-xs font-medium text-(--theme-error)">
					{error}
				</p>
			)}
		</div>
	);
}

const STAT_TONES = {
	neutral: "bg-(--theme-secondary-bg) border-(--theme-border) text-(--theme-text)",
	success:
		"bg-(--theme-success-bg) border-(--theme-success-border) text-(--theme-success)",
	error: "bg-(--theme-error-bg) border-(--theme-error-border) text-(--theme-error)",
	info: "bg-(--theme-info-bg) border-(--theme-info-border) text-(--theme-info)",
} as const;

function StatCard({
	label,
	value,
	tone,
}: {
	label: string;
	value: string | number;
	tone: keyof typeof STAT_TONES;
}) {
	return (
		<div className={`rounded-xl border p-3 text-center ${STAT_TONES[tone]}`}>
			<p className="text-xs font-bold uppercase tracking-wider opacity-70">
				{label}
			</p>
			<p className="mt-1 text-lg font-black">{value}</p>
		</div>
	);
}

function AccountLink({
	href,
	icon,
	title,
	subtitle,
}: {
	href: string;
	icon: React.ReactNode;
	title: string;
	subtitle: string;
}) {
	return (
		<a
			href={href}
			className="group flex items-center justify-between rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg) p-3 transition-all hover:border-primary hover:shadow-sm hover:-translate-y-0.5"
		>
			<div className="flex items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:bg-primary group-hover:text-white group-hover:shadow-md group-hover:shadow-primary/20">
					{icon}
				</div>
				<div className="flex flex-col">
					<h4 className="text-sm font-bold text-(--theme-text)">{title}</h4>
					<span className="text-xs font-medium text-(--theme-text) opacity-50">
						{subtitle}
					</span>
				</div>
			</div>
			<ChevronRight
				size={18}
				className="mr-1 shrink-0 text-primary opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100"
			/>
		</a>
	);
}
