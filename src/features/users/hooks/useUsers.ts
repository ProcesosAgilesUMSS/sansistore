import { useState, useMemo } from 'react';
import type { User, UserRole, CreateUserPayload } from '../types';
import { MOCK_USERS } from '../services/userService';

export function useUsers() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 4000);
  };

  const registerUser = (payload: CreateUserPayload) => {
    // Validate email is not already registered
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase()
    );
    if (emailExists) {
      showError('Este correo electrónico ya está registrado.');
      return false;
    }

    // TODO: Replace with Firebase Auth + Firestore creation
    const newUser: User = {
      uid: crypto.randomUUID(),
      email: payload.email,
      displayName: payload.displayName,
      phoneNumber: payload.phoneNumber,
      roles: [payload.role],
      isActive: true,
      createdAt: new Date(),
    };

    setUsers((prev) => [...prev, newUser]);
    showSuccess(`Usuario "${payload.displayName}" registrado exitosamente.`);
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
    successMessage,
    errorMessage,
  };
}