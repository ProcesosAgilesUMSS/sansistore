import { Pencil } from 'lucide-react';
import type { User } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
}

export default function UserTable({ users, onEdit }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--theme-text)]/40 text-sm">
        No se encontraron usuarios.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--theme-border)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#88b04b]/10">
              <th className="px-5 py-3.5 font-semibold text-[13px] text-[var(--theme-text)]">
                Nombre
              </th>
              <th className="px-5 py-3.5 font-semibold text-[13px] text-[var(--theme-text)]">
                Correo
              </th>
              <th className="px-5 py-3.5 font-semibold text-[13px] text-[var(--theme-text)]">
                Rol
              </th>
              <th className="px-5 py-3.5 font-semibold text-[13px] text-[var(--theme-text)]">
                Estado
              </th>
              <th className="px-5 py-3.5 font-semibold text-[13px] text-[var(--theme-text)] text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => {
              const role = user.roles[0];
              const roleColor = ROLE_COLORS[role] || {
                bg: 'rgba(150,150,150,0.15)',
                text: '#666',
              };
              return (
                <tr
                  key={user.uid}
                  className={`
                    border-t border-[var(--theme-border)]
                    transition-colors duration-150
                    hover:bg-[#88b04b]/[0.03]
                    ${idx % 2 === 0 ? 'bg-[var(--theme-card-bg)]' : 'bg-[var(--theme-bg)]'}
                  `}
                >
                  <td className="px-5 py-4 text-[13px] font-medium text-[var(--theme-text)]">
                    {user.displayName}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[var(--theme-text)]/60">
                    {user.email}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-[12px] font-medium"
                      style={{
                        backgroundColor: roleColor.bg,
                        color: roleColor.text,
                      }}
                    >
                      {ROLE_LABELS[role] || role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`
                        inline-block px-3 py-1 rounded-full text-[12px] font-medium
                        ${
                          user.isActive
                            ? 'bg-[rgba(136,176,75,0.15)] text-[#5a7a2e]'
                            : 'bg-[rgba(150,150,150,0.15)] text-[#888]'
                        }
                      `}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg text-[var(--theme-text)]/30 hover:text-[#88b04b] hover:bg-[#88b04b]/10 transition-colors duration-150"
                      title="Editar usuario"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {users.map((user) => {
          const role = user.roles[0];
          const roleColor = ROLE_COLORS[role] || {
            bg: 'rgba(150,150,150,0.15)',
            text: '#666',
          };
          return (
            <div
              key={user.uid}
              className="bg-[var(--theme-card-bg)] border border-[var(--theme-border)] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--theme-text)] truncate">
                    {user.displayName}
                  </p>
                  <p className="text-[12px] text-[var(--theme-text)]/50 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={() => onEdit(user)}
                  className="p-2 rounded-lg text-[var(--theme-text)]/30 hover:text-[#88b04b] hover:bg-[#88b04b]/10 transition-colors duration-150 flex-shrink-0 ml-2"
                  title="Editar usuario"
                >
                  <Pencil size={15} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: roleColor.bg,
                    color: roleColor.text,
                  }}
                >
                  {ROLE_LABELS[role] || role}
                </span>
                <span
                  className={`
                    inline-block px-2.5 py-1 rounded-full text-[11px] font-medium
                    ${
                      user.isActive
                        ? 'bg-[rgba(136,176,75,0.15)] text-[#5a7a2e]'
                        : 'bg-[rgba(150,150,150,0.15)] text-[#888]'
                    }
                  `}
                >
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
