//src/features/admin/users/components/RegisterUserModal.tsx
import { useState } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { UserRole, CreateUserPayload } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../types';

const SELECTABLE_ROLES: UserRole[] = ['mensajero', 'vendedor', 'operador_inv', 'admin', 'comprador'];

interface RegisterUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (payload: CreateUserPayload) => Promise<boolean> | boolean;
}

/**
 * Capitalizes the first letter of each word.
 * Example: "juan mamani" → "Juan Mamani"
 */
function capitalizeWords(text: string): string {
  return text.replace(/\b[a-záéíóúñü]/gi, (char) => char.toUpperCase());
}

export default function RegisterUserModal({
  isOpen,
  onClose,
  onRegister,
}: RegisterUserModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [ci, setCi] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [internalPhone, setInternalPhone] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!isOpen) return null;

  // --- Input handlers with restrictions ---

  const handleNameChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    const capitalized = capitalizeWords(sanitized);
    setDisplayName(capitalized);
    if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: '' }));
    if (serverError) setServerError('');
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    const limited = digitsOnly.slice(0, 8);
    setPhoneNumber(limited);
    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
    if (serverError) setServerError('');
  };

  const handleCiChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setCi(digitsOnly.slice(0, 12));
    if (errors.ci) setErrors((prev) => ({ ...prev, ci: '' }));
    if (serverError) setServerError('');
  };

  const handleInternalPhoneChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setInternalPhone(digitsOnly.slice(0, 10));
    if (errors.internalPhone) setErrors((prev) => ({ ...prev, internalPhone: '' }));
    if (serverError) setServerError('');
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
    if (serverError) setServerError('');
  };

  const handleRoleToggle = (role: UserRole) => {
    if (isLoading) return;
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else if (prev.length < 2) {
        return [...prev, role];
      }
      return prev;
    });
    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }));
    if (serverError) setServerError('');
  };

  // --- Validation ---

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Name validation
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      newErrors.displayName = 'El nombre es obligatorio.';
    } else if (trimmedName.length < 3) {
      newErrors.displayName = 'El nombre es demasiado corto (mín. 3 caracteres).';
    } else if (/\s{3,}/.test(displayName)) {
      newErrors.displayName = 'Error: El formato de nombre no permite espacios excesivos.';
    }

    const trimmedCi = ci.trim();
    if (!trimmedCi) {
      newErrors.ci = 'La cédula de identidad es obligatoria.';
    } else if (!/^\d+$/.test(trimmedCi)) {
      newErrors.ci = 'La cédula de identidad debe contener solo números.';
    }

    // 2. Email validation - allow institutional UMSS domains
    const trimmedEmail = email.trim().toLowerCase();
    const allowedDomains = [
      'umss.edu',
      'umss.edu.bo',
      'est.umss.edu',
      'est.umss.edu.bo',
      'mi.umss.edu',
      'ms.umss.edu',
      'fcyt.umss.edu.bo',
      'dicyt.umss.edu.bo',
      'posgrado.umss.edu.bo',
    ];
    if (!trimmedEmail) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Por favor, ingrese un formato de correo electrónico válido.';
    } else {
      const domain = trimmedEmail.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        newErrors.email = 'Solo se permiten cuentas institucionales UMSS.';
      }
    }

    // 3. Phone validation
    if (!phoneNumber) {
      newErrors.phoneNumber = 'El teléfono es obligatorio.';
    } else if (phoneNumber.length !== 8) {
      newErrors.phoneNumber = 'El teléfono debe tener exactamente 8 números.';
    } else if (!/^[67]/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Número no válido. Debe iniciar con 6 o 7.';
    }

    if (internalPhone && !/^\d+$/.test(internalPhone)) {
      newErrors.internalPhone = 'El teléfono interno debe contener solo números.';
    }

    // 4. Role validation
    if (selectedRoles.length === 0) {
      newErrors.role = 'Debe asignar al menos un rol al usuario.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setServerError('');

    if (!validate()) return;

    const cleanName = displayName.trim().replace(/\s{2,}/g, ' ');

    setIsLoading(true);

    try {
      const result = await onRegister({
        displayName: cleanName,
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        ci: ci.trim(),
        ...(internalPhone.trim() && { internalPhone: internalPhone.trim() }),
        roles: selectedRoles,
      });

      if (result) {
        resetForm();
        onClose();
      }
    } catch (error: any) {
      setServerError(
        error?.message || 'Ocurrió un error al registrar el usuario. Intente nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDisplayName('');
    setCi('');
    setEmail('');
    setPhoneNumber('');
    setInternalPhone('');
    setSelectedRoles([]);
    setErrors({});
    setServerError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    if (isLoading) return;
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
            disabled={isLoading}
            className="p-1.5 rounded-lg text-(--theme-text)/40 hover:text-(--theme-text) hover:bg-(--theme-text)/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X size={18} />
          </button>
        </div>

        {/* Server error banner (inline, inside modal) */}
        {serverError && (
          <div className="mx-6 mt-2 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[#991b1b]">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <p className="text-[12px] font-medium leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <div className="px-6 py-4 flex flex-col gap-5">
          {/* Nombre */}
          <div>
            <label className="block text-[13px] font-medium text-(--theme-text) mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Mamani"
              value={displayName}
              disabled={isLoading}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`
                w-full px-4 py-2.5 rounded-xl text-[13px]
                bg-(--theme-bg) border
                text-(--theme-text)
                placeholder:text-(--theme-text)/30
                outline-none transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.displayName
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-(--theme-border) focus:border-primary'
                }
              `}
            />
            {errors.displayName && (
              <p className="mt-1 text-[11px] text-red-500">{errors.displayName}</p>
            )}
          </div>

          {/* Cédula de identidad */}
          <div>
            <label className="block text-[13px] font-medium text-(--theme-text) mb-1.5">
              Cédula de identidad <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: 13718205"
              value={ci}
              disabled={isLoading}
              onChange={(e) => handleCiChange(e.target.value)}
              inputMode="numeric"
              className={`
                w-full px-4 py-2.5 rounded-xl text-[13px]
                bg-(--theme-bg) border
                text-(--theme-text)
                placeholder:text-(--theme-text)/30
                outline-none transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.ci
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-(--theme-border) focus:border-primary'
                }
              `}
            />
            {errors.ci && (
              <p className="mt-1 text-[11px] text-red-500">{errors.ci}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium text-(--theme-text) mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="usuario@umss.edu"
              value={email}
              disabled={isLoading}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`
                w-full px-4 py-2.5 rounded-xl text-[13px]
                bg-(--theme-bg) border
                text-(--theme-text)
                placeholder:text-(--theme-text)/30
                outline-none transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.email
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-(--theme-border) focus:border-primary'
                }
              `}
            />
            <p className="mt-1 text-[11px] text-(--theme-text)/40">
              Dominios permitidos: @umss.edu, @umss.edu.bo, @est.umss.edu, @est.umss.edu.bo, @mi.umss.edu, @ms.umss.edu, @fcyt.umss.edu.bo, @dicyt.umss.edu.bo, @posgrado.umss.edu.bo
            </p>
            {errors.email && (
              <p className="mt-0.5 text-[11px] text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-[13px] font-medium text-(--theme-text) mb-1.5">
              Teléfono
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 rounded-xl text-[13px] bg-(--theme-bg) border border-(--theme-border) text-(--theme-text)/50 select-none">
                +591
              </span>
              <input
                type="tel"
                placeholder="Ej: 71234567"
                value={phoneNumber}
                disabled={isLoading}
                onChange={(e) => handlePhoneChange(e.target.value)}
                inputMode="numeric"
                maxLength={8}
                className={`
                  flex-1 px-4 py-2.5 rounded-xl text-[13px]
                  bg-(--theme-bg) border
                  text-(--theme-text)
                  placeholder:text-(--theme-text)/30
                  outline-none transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.phoneNumber
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-(--theme-border) focus:border-primary'
                  }
                `}
              />
            </div>
            <p className="mt-1 text-[11px] text-(--theme-text)/40">
              8 dígitos. Debe iniciar con 6 o 7.
            </p>
            {errors.phoneNumber && (
              <p className="mt-0.5 text-[11px] text-red-500">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Teléfono interno */}
          <div>
            <label className="block text-[13px] font-medium text-(--theme-text) mb-1.5">
              Teléfono interno
            </label>
            <input
              type="tel"
              placeholder="Ej: 4253210"
              value={internalPhone}
              disabled={isLoading}
              onChange={(e) => handleInternalPhoneChange(e.target.value)}
              inputMode="numeric"
              className={`
                w-full px-4 py-2.5 rounded-xl text-[13px]
                bg-(--theme-bg) border
                text-(--theme-text)
                placeholder:text-(--theme-text)/30
                outline-none transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.internalPhone
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-(--theme-border) focus:border-primary'
                }
              `}
            />
            {errors.internalPhone && (
              <p className="mt-1 text-[11px] text-red-500">{errors.internalPhone}</p>
            )}
          </div>

          {/* Rol selector - checkbox grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-(--theme-text) uppercase tracking-wide">
                Roles asignados <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-(--theme-text)/40">
                (mínimo 1 requerido)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SELECTABLE_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                const isDisabled = isLoading || (!isSelected && selectedRoles.length >= 2);
                const colors = ROLE_COLORS[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => !isDisabled && handleRoleToggle(role)}
                    disabled={isDisabled}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium
                      border transition-all duration-150 text-left
                      ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    style={{
                      backgroundColor: isSelected ? colors.bg : 'transparent',
                      borderColor: isSelected ? colors.text : 'var(--theme-border)',
                    }}
                  >
                    <div
                      className="w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border transition-colors duration-150"
                      style={{
                        backgroundColor: isSelected ? colors.text : 'transparent',
                        borderColor: isSelected ? colors.text : 'var(--theme-border)',
                      }}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span
                      style={{ color: isSelected ? colors.text : 'var(--theme-text)' }}
                    >
                      {ROLE_LABELS[role]}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="mt-1.5 text-[11px] text-red-500">{errors.role}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="
              px-5 py-2.5 rounded-full text-[13px] font-medium
              border border-(--theme-border)
              text-(--theme-text)/70
              hover:bg-(--theme-text)/5
              transition-colors duration-150
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="
              flex items-center justify-center gap-2
              px-5 py-2.5 rounded-full text-[13px] font-medium
              bg-primary text-white
              hover:bg-[#7aa043]
              active:bg-[#6d9039]
              transition-colors duration-150
              shadow-sm
              disabled:opacity-60 disabled:cursor-not-allowed
              min-w-40
            "
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar usuario'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


