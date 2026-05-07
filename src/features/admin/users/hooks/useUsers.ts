//src/features/admin/users/hooks/useUsers.ts
import { useState, useMemo } from 'react';
import type { User, UserRole, CreateUserPayload } from '../types';
import { MOCK_USERS } from '../services/userService';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === 'all' || user.roles.includes(roleFilter);

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const dismissToast = () => {
    setToast(null);
  };

  const registerUser = async (payload: CreateUserPayload): Promise<boolean> => {
    // Validate email is not already registered
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase()
    );
    if (emailExists) {
      // Throw error so the modal catches it and shows inline banner
      throw new Error('Este correo electrónico ya está registrado.');
    }

    // TODO: Replace with Firebase Auth + Firestore creation
    // Simulate network delay for loading state demo
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const newUser: User = {
      uid: crypto.randomUUID(),
      email: payload.email,
      displayName: payload.displayName,
      phoneNumber: payload.phoneNumber,
      roles: payload.roles,
      isActive: true,
      createdAt: new Date(),
    };

    setUsers((prev) => [...prev, newUser]);
    showToast(`Usuario "${payload.displayName}" registrado exitosamente.`, 'success');
    return true;
  };

  return {
    users: filteredUsers,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    isModalOpen,
    setIsModalOpen,
    registerUser,
    toast,
    dismissToast,
  };
}