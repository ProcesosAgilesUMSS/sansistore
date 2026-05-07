import { useState } from 'react';
import { X } from 'lucide-react';
import type { UserRole, CreateUserPayload } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../types';

const SELECTABLE_ROLES: UserRole[] = ['mensajero', 'vendedor', 'operador', 'admin'];

interface RegisterUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (payload: CreateUserPayload) => boolean;
}

export default function RegisterUserModal({
  isOpen,
  onClose,
  onRegister,
}: RegisterUserModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'El nombre es obligatorio.';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingrese un correo electrónico válido.';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'El teléfono es obligatorio.';
    }

    if (!selectedRole) {
      newErrors.role = 'Seleccione un rol para el usuario.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const success = onRegister({
      displayName: displayName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      role: selectedRole!,
    });

    if (success) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setDisplayName('');
    setEmail('');
    setPhoneNumber('');
    setSelectedRole(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="
          relative w-full max-w-md
          bg-(--theme-card-bg) border border-(--theme-border)
          rounded-2xl shadow-2xl
          max-h-[90vh] overflow-y-auto
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-[17px] font-bold text-(--theme-text)">
            Nuevo Usuario
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-(--theme-text)/40 hover:text-(--theme-text) hover:bg-(--theme-text)/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 flex flex-col gap-5">
          {/* Nombre */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--theme-text)] mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Mamani"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: '' }));
              }}
              className={`
                w-full px-4 py-2.5 rounded-xl text-[13px]
                bg-[var(--theme-bg)] border
                text-[var(--theme-text)]
                placeholder:text-[var(--theme-text)]/30
                outline-none transition-colors duration-150
                ${errors.displayName
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-[var(--theme-border)] focus:border-[#88b04b]'
                }
              `}
            />
            {errors.displayName && (
              <p className="mt-1 text-[11px] text-red-500">{errors.displayName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--theme-text)] mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="usuario@umss.edu.bo"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              className={`
                w-full px-4 py-2.5 rounded-xl text-[13px]
                bg-(--theme-bg) border
                text-(--theme-text)
                placeholder:text-(--theme-text)/30
                outline-none transition-colors duration-150
                ${errors.email
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-(--theme-border) focus:border-primary'
                }
              `}
            />
            <p className="mt-1 text-[11px] text-(--theme-text)/40">
              Debe ser único. Se enviará correo de confirmación y contraseña temporal.
            </p>
            {errors.email && (
              <p className="mt-0.5 text-[11px] text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--theme-text)] mb-1.5">
              Teléfono
            </label>
            <input
              type="tel"
              placeholder="Ej: +591 12345678"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              className={`
                w-full px-4 py-2.5 rounded-xl text-[13px]
                bg-[var(--theme-bg)] border
                text-[var(--theme-text)]
                placeholder:text-[var(--theme-text)]/30
                outline-none transition-colors duration-150
                ${errors.phoneNumber
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-[var(--theme-border)] focus:border-[#88b04b]'
                }
              `}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-[11px] text-red-500">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Rol selector */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--theme-text)] mb-2">
              Rol
            </label>
            <div className="flex flex-wrap gap-2">
              {SELECTABLE_ROLES.map((role) => {
                const isSelected = selectedRole === role;
                const colors = ROLE_COLORS[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      if (errors.role) setErrors((prev) => ({ ...prev, role: '' }));
                    }}
                    className={`
                      px-4 py-2 rounded-full text-[13px] font-medium
                      border transition-all duration-150
                      ${
                        isSelected
                          ? 'ring-2 ring-offset-1 shadow-sm'
                          : 'hover:shadow-sm'
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? colors.bg : 'transparent',
                      color: colors.text,
                      borderColor: isSelected ? colors.text : `${colors.text}40`,
                      ...(isSelected ? { ringColor: colors.text } : {}),
                    }}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-[var(--theme-text)]/40">
              El rol define permisos. Se asigna como custom claim en Firebase Auth y se guarda en el array roles.
            </p>
            {errors.role && (
              <p className="mt-0.5 text-[11px] text-red-500">{errors.role}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
          <button
            onClick={handleClose}
            className="
              px-5 py-2.5 rounded-full text-[13px] font-medium
              border border-[var(--theme-border)]
              text-[var(--theme-text)]/70
              hover:bg-[var(--theme-text)]/5
              transition-colors duration-150
            "
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="
              px-5 py-2.5 rounded-full text-[13px] font-medium
              bg-[#88b04b] text-white
              hover:bg-[#7aa043]
              active:bg-[#6d9039]
              transition-colors duration-150
              shadow-sm
            "
          >
            Registrar usuario
          </button>
        </div>
      </div>
    </div>
  );
}
