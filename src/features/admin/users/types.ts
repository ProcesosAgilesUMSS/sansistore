export type UserRole = 'admin' | 'vendedor' | 'mensajero' | 'operador_inv' | 'comprador';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  mensajero: 'Mensajero',
  operador_inv: 'Operador inv.',
  comprador: 'Comprador',
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  admin: { bg: 'rgba(136,176,75,0.15)', text: '#5a7a2e' },
  vendedor: { bg: 'rgba(99,132,255,0.15)', text: '#4a5fc7' },
  mensajero: { bg: 'rgba(168,130,255,0.15)', text: '#7b5bbf' },
  operador_inv: { bg: 'rgba(240,180,100,0.15)', text: '#b5802e' },
  comprador: { bg: 'rgba(100,200,200,0.15)', text: '#3a8a8a' },
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
