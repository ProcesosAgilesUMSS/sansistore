import { useEffect, useState } from "react";
import type { User, UserRole, UpdateUserPayload } from '../types';
import { ROLE_LABELS } from '../types';

const ROLES: { value: UserRole; label: string }[] = [
  { value: "mensajero", label: "Mensajero" },
  { value: "vendedor", label: "Vendedor" },
  { value: "operador_inv", label: "Operador inv." },
  { value: "admin", label: "Administrador" },
  { value: "comprador", label: "Comprador" },
];

interface UserEditModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (uid: string, updated: UpdateUserPayload) => Promise<boolean>;
}

export default function UserEditModal({
  isOpen,
  user,
  onClose,
  onSave,
}: UserEditModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.displayName);
      setEmail(user.email);
      setPhone(user.phoneNumber ?? "");
      setRoles(user.roles);
      setIsActive(user.isActive);
      setError("");
      setSuccess("");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const toggleRole = (role: UserRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setError("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }
    if (name.trim().length < 3) {
      setError("El nombre es demasiado corto (mín. 3 caracteres).");
      return;
    }
    if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/.test(name)) {
      setError("El nombre solo puede contener letras.");
      return;
    }
    if (!email.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingrese un correo electrónico válido.");
      return;
    }
    const allowedDomains = [
      'est.umss.edu',
      'ms.umss.edu',
      'umss.edu.bo',
      'umss.edu',
    ];
    const domain = email.trim().split('@')[1];
    if (!domain || !allowedDomains.includes(domain)) {
      setError("Solo se permiten cuentas institucionales UMSS.");
      return;
    }
    if (phone && (phone.length !== 8 || !/^[67]/.test(phone))) {
      setError("El teléfono debe tener 8 dígitos e iniciar con 6 o 7.");
      return;
    }
    if (roles.length === 0) {
      setError("El usuario debe tener al menos un rol seleccionado.");
      return;
    }
    if (roles.length > 2) {
      setError("El usuario no puede tener más de 2 roles asignados.");
      return;
    }

    const result = await onSave(user.uid, {
      displayName: name.trim(),
      ...(email.trim() !== user.email && { email: email.trim() }),
      phoneNumber: phone.trim(),
      roles,
      isActive,
    });

    if (result) {
      setSuccess("Usuario actualizado correctamente.");
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1500);
    } else {
      setError("Este correo electrónico ya está en uso por otro usuario.");
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[var(--theme-card-bg)] border border-[var(--theme-border)] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[var(--theme-border)]">
            <h2 className="text-[17px] font-bold text-[var(--theme-text)]">
              Editar usuario
            </h2>
            <p className="text-[12px] text-[var(--theme-text)]/40 mt-0.5">
              {user.displayName} · UID: {user.uid}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-4">

            {/* Nombre + Teléfono */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
                  Nombre completo *
                </label>
                <input
                  className="w-full p-2.5 rounded-xl text-[13px] bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/30 outline-none focus:border-[#88b04b] transition-colors"
                  value={name}
                  placeholder="Ej: Juan Mamani"
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
                  Teléfono
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-2.5 rounded-xl text-[13px] bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text)]/40 select-none whitespace-nowrap">
                    +591
                  </span>
                  <input
                    className="flex-1 p-2.5 rounded-xl text-[13px] bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/30 outline-none focus:border-[#88b04b] transition-colors"
                    value={phone}
                    placeholder="71234567"
                    inputMode="numeric"
                    maxLength={8}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                  />
                </div>
                <p className="text-[10px] text-[var(--theme-text)]/30 mt-1">
                  8 dígitos, inicia con 6 o 7.
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
                Email *
              </label>
              <input
                className="w-full p-2.5 rounded-xl text-[13px] bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/30 outline-none focus:border-[#88b04b] transition-colors"
                value={email}
                placeholder="usuario@umss.edu"
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
              />
              <p className="text-[10px] text-[var(--theme-text)]/30 mt-1">
                Solo se permiten dominios institucionales: @est.umss.edu, @ms.umss.edu, @umss.edu.bo, @umss.edu
              </p>
            </div>

            {/* Roles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide">
                  Roles asignados *
                </label>
                <span className="text-[10px] text-[#88b04b]">(mín. 1, máx. 2)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => {
                  const active = roles.includes(role.value);
                  const disabled = !active && roles.length >= 2;
                  return (
                    <div
                      key={role.value}
                      onClick={() => !disabled && toggleRole(role.value)}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all
                        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                        ${active
                          ? 'bg-[rgba(136,176,75,0.12)] border-[#88b04b]/40'
                          : 'bg-[var(--theme-bg)] border-[var(--theme-border)] hover:border-[#88b04b]/30'
                        }
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center text-[10px] flex-shrink-0 transition-colors
                        ${active
                          ? 'bg-[#88b04b] border-[#88b04b] text-white'
                          : 'bg-transparent border-[var(--theme-border)]'
                        }
                      `}>
                        {active && "✓"}
                      </div>
                      <span className={`text-[13px] ${active ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text)]/60'}`}>
                        {ROLE_LABELS[role.value]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--theme-text)]/25 mt-1.5">
                El array roles se actualizará en Firestore.
              </p>
            </div>

            {/* Estado */}
            <div className="flex items-center justify-between bg-[var(--theme-bg)] border border-[var(--theme-border)] px-4 py-3 rounded-xl">
              <div>
                <p className="text-[13px] font-medium text-[var(--theme-text)]">
                  Estado de la cuenta
                </p>
                <p className="text-[11px] text-[var(--theme-text)]/40">
                  Desactivar impide el acceso al sistema
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-medium ${isActive ? 'text-[#88b04b]' : 'text-[var(--theme-text)]/40'}`}>
                  {isActive ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${isActive ? 'bg-[#88b04b]' : 'bg-[var(--theme-text)]/20'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[13px]">
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">!</span>
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(136,176,75,0.12)] border border-[rgba(136,176,75,0.25)] text-[#88b04b] text-[13px]">
                <span className="w-4 h-4 rounded-full bg-[#88b04b] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">✓</span>
                {success}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-[var(--theme-border)]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text)]/60 hover:text-[var(--theme-text)] hover:border-[var(--theme-text)]/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-[#88b04b] hover:bg-[#7aa043] active:bg-[#6d9039] text-white transition-colors shadow-sm"
            >
              Guardar cambios
            </button>
          </div>

        </div>
      </div>
    </>
  );
}