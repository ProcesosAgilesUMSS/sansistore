export type UserRole =
	| "admin"
	| "vendedor"
	| "mensajero"
	| "operador_inv"
	| "comprador";

export const ROLE_LABELS: Record<UserRole, string> = {
	admin: "Administrador",
	vendedor: "Vendedor",
	mensajero: "Mensajero",
	operador_inv: "Operador inv.",
	comprador: "Comprador",
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
	admin: { bg: "var(--theme-success-bg)", text: "var(--theme-success)" },
	vendedor: { bg: "var(--theme-info-bg)", text: "var(--theme-info)" },
	mensajero: { bg: "var(--theme-info-bg)", text: "var(--theme-info)" },
	operador_inv: { bg: "var(--theme-warning-bg)", text: "var(--theme-warning)" },
	comprador: { bg: "var(--theme-secondary-bg)", text: "var(--theme-text)" },
};

export interface User {
	uid: string;
	email: string;
	displayName: string;
	phoneNumber?: string;
	ci?: string;
	internalPhone?: string;
	roles: UserRole[];
	isActive: boolean;
	createdBy?: string;
	createdAt?: Date;
	institutionalId?: string;
}

export interface CreateUserPayload {
	displayName: string;
	email: string;
	phoneNumber: string;
	ci: string;
	internalPhone?: string;
	roles: UserRole[];
}

export interface UpdateUserPayload {
	displayName?: string;
	email?: string;
	phoneNumber?: string;
	roles?: UserRole[];
	isActive?: boolean;
}
