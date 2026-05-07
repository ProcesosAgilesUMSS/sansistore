import { useEffect, useState } from "react";
import type { User, UserRole, UpdateUserPayload } from '../types';

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

  // Precargar datos del usuario seleccionado
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
    if (!name || !email) {
      setError("Todos los campos obligatorios deben completarse.");
      return;
    }
    if (roles.length === 0) {
      setError("El usuario debe tener al menos un rol seleccionado.");
      return;
    }

  const result = await onSave(user.uid, {
    displayName: name.trim(),
    // Solo manda email si cambió
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
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-semibold mb-1">Editar usuario</h2>
          <p className="text-sm text-gray-400 mb-5">
            {user.displayName} · UID: {user.uid}
          </p>

          {/* Nombre + Teléfono */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500">NOMBRE COMPLETO *</label>
              <input
                className="w-full mt-1 p-3 rounded-xl bg-[#f4f2ef] border border-transparent focus:outline-none focus:border-[#88b04b]"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">TELÉFONO</label>
              <input
                className="w-full mt-1 p-3 rounded-xl bg-[#f4f2ef] border border-transparent focus:outline-none focus:border-[#88b04b]"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="text-xs text-gray-500">EMAIL *</label>
            <input
              className="w-full mt-1 p-3 rounded-xl bg-[#f4f2ef] border border-transparent focus:outline-none focus:border-[#88b04b]"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Si cambia el email, se validará que no esté en uso por otro usuario.
            </p>
          </div>

          {/* Roles */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>ROLES ASIGNADOS *</span>
              <span className="text-[#88b04b]">(mínimo 1 requerido)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const active = roles.includes(role.value);
                return (
                  <div
                    key={role.value}
                    onClick={() => toggleRole(role.value)}
                    className={`
                      flex items-center gap-2 px-3 py-3 rounded-lg border cursor-pointer transition-all
                      ${active
                        ? "bg-[#88b04b]/15 border-[#88b04b]"
                        : "bg-gray-100 border-gray-200"
                      }
                    `}
                  >
                    <div className={`
                      w-4 h-4 rounded border flex items-center justify-center text-xs
                      ${active ? "bg-[#88b04b] text-white" : "bg-white border-gray-300"}
                    `}>
                      {active && "✓"}
                    </div>
                    <span className="text-sm">{role.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              El array roles se actualizará en Firestore y en los custom claims.
            </p>
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-5">
            <div>
              <p className="text-sm font-medium">Estado de la cuenta</p>
              <p className="text-xs text-gray-400">
                Desactivar impide el acceso al sistema
              </p>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                isActive ? "bg-[#88b04b]" : "bg-gray-300"
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                isActive ? "translate-x-6" : ""
              }`} />
            </button>
          </div>

          {/* Botones */}
          <div className="flex justify-between gap-4">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-gray-200 text-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-lg bg-[#88b04b] text-white font-medium"
            >
              Guardar cambios
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-4 bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

        </div>
      </div>
    </>
  );
}