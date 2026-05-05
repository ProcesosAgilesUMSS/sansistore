import type { User } from '../types';

/**
 * Mock data for development.
 * Will be replaced with real Firestore calls later.
 */
export const MOCK_USERS: User[] = [
  {
    uid: '1',
    email: 'juan.mamani@umss.edu.bo',
    displayName: 'Juan Mamani',
    phoneNumber: '+591 71234567',
    roles: ['admin'],
    isActive: true,
    createdAt: new Date('2026-04-01'),
  },
  {
    uid: '2',
    email: 'maria.lopez@umss.edu.bo',
    displayName: 'María López',
    phoneNumber: '+591 71234568',
    roles: ['vendedor'],
    isActive: true,
    createdAt: new Date('2026-04-05'),
  },
  {
    uid: '3',
    email: 'pedro.sanchez@umss.edu.bo',
    displayName: 'Pedro Sánchez',
    phoneNumber: '+591 71234569',
    roles: ['mensajero'],
    isActive: false,
    createdAt: new Date('2026-04-10'),
  },
  {
    uid: '4',
    email: 'ana.torres@umss.edu.bo',
    displayName: 'Ana Torres',
    phoneNumber: '+591 71234570',
    roles: ['operador'],
    isActive: true,
    createdAt: new Date('2026-04-15'),
  },
];