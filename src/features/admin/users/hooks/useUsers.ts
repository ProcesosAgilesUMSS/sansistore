import { useEffect, useMemo, useState } from 'react';
import type { User, UserRole, CreateUserPayload, UpdateUserPayload } from '../types';
import { createUser, getUsers, updateUser } from '../services/userService';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      try {
        const loadedUsers = await getUsers();
        if (!ignore) setUsers(loadedUsers);
      } catch (error) {
        if (!ignore) {
          showToast(
            error instanceof Error ? error.message : 'No se pudo cargar usuarios.',
            'error',
          );
        }
      }
    }

    loadUsers();

    return () => {
      ignore = true;
    };
  }, []);

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
    try {
      const { user } = await createUser(payload);
      setUsers((prev) => [...prev, user]);
      showToast(`Usuario "${payload.displayName}" registrado exitosamente.`, 'success');
      return true;
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No se pudo registrar el usuario.',
        'error',
      );
      return false;
    }
  };

  const editUser = async (uid: string, payload: UpdateUserPayload): Promise<boolean> => {
    try {
      const updatedUser = await updateUser(uid, payload);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? updatedUser : u))
      );
      showToast('Usuario actualizado exitosamente.', 'success');
      return true;
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No se pudo actualizar el usuario.',
        'error',
      );
      return false;
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    setIsEditModalOpen(false);
  };

  return {
    users: filteredUsers,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    isModalOpen,
    setIsModalOpen,
    isEditModalOpen,
    selectedUser,
    openEditModal,
    closeEditModal,
    registerUser,
    editUser,
    toast,
    dismissToast,
  };
}