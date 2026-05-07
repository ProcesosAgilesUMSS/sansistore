//src/features/admin/users/components/UserManagement.tsx
import { Search, UserPlus, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import type { UserRole } from '../types';
import UserTable from './UserTable';
import RegisterUserModal from './RegisterUserModal';
import UserEditModal from './UserEditModal';
import Toast from './Toast';

const FILTER_ROLES: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los roles' },
  { value: 'admin', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'mensajero', label: 'Mensajero' },
  { value: 'operador_inv', label: 'Operador inv.' },
];

export default function UserManagement() {
  const {
    users,
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
  } = useUsers();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFilterLabel =
    FILTER_ROLES.find((r) => r.value === roleFilter)?.label || 'Todos los roles';

  return (
    <div className="flex flex-col gap-5">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--theme-text)/30"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px]
              bg-(--theme-card-bg) border border-(--theme-border)
              text-(--theme-text)
              placeholder:text-(--theme-text)/30
              outline-none
              focus:border-primary
              transition-colors duration-150
            "
          />
        </div>

        <div className="flex items-center gap-3">

          {/* Role filter dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px]
                bg-(--theme-card-bg) border border-(--theme-border)
                text-(--theme-text)/70
                hover:border-primary/40
                transition-colors duration-150
                whitespace-nowrap
              "
            >
              {currentFilterLabel}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div
                className="
                  absolute right-0 top-full mt-1.5 z-20
                  w-48
                  bg-(--theme-card-bg) border border-(--theme-border)
                  rounded-xl shadow-lg overflow-hidden
                "
              >
                {FILTER_ROLES.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setRoleFilter(option.value);
                      setDropdownOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-[13px]
                      transition-colors duration-100
                      ${
                        roleFilter === option.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-(--theme-text)/60 hover:bg-(--theme-text)/5'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Register button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium
              bg-primary text-white
              hover:bg-[#7aa043]
              active:bg-[#6d9039]
              transition-colors duration-150
              shadow-sm
              whitespace-nowrap
            "
          >
            <UserPlus size={15} />
            <span className="hidden sm:inline">Registrar Usuario</span>
            <span className="sm:hidden">Registrar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <UserTable users={users} onEdit={openEditModal} />

      {/* Register modal */}
      <RegisterUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegister={registerUser}
      />

      {/* Edit modal */}
      <UserEditModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        onClose={closeEditModal}
        onSave={editUser}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}

    </div>
  );
}