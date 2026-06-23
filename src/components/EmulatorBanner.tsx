import { X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "sansistore-emulator-banner-dismissed";

/**
 * Aviso de que la app corre contra los emuladores de Firebase (solo en local).
 * Reemplaza el banner rojo que Firebase inyecta por su cuenta (desactivado con
 * `disableWarnings` en firebase.ts) por uno discreto y cerrable.
 */
export default function EmulatorBanner() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const isEmulator = import.meta.env.PUBLIC_APP_ENV !== "production";
		const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
		setVisible(isEmulator && !dismissed);
	}, []);

	if (!visible) return null;

	const dismiss = () => {
		sessionStorage.setItem(DISMISS_KEY, "1");
		setVisible(false);
	};

	return (
		<div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 border-t border-(--theme-warning-border) bg-(--theme-warning-bg) px-4 py-2 text-xs font-medium text-(--theme-warning)">
			<span className="text-center">
				Estás en modo <strong>emulador</strong> (datos locales de prueba). No
				uses credenciales reales.
			</span>
			<button
				type="button"
				onClick={dismiss}
				aria-label="Cerrar aviso"
				className="shrink-0 rounded-md p-1 transition-opacity hover:opacity-70"
			>
				<X size={14} />
			</button>
		</div>
	);
}
