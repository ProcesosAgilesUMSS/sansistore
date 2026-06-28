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
      <div className="flex items-center justify-center py-16 text-(--theme-text)/40 text-sm">
        No se encontraron usuarios.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-(--theme-border)">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-primary/10">
              <th className="px-5 py-3.5 font-semibold text-sm text-(--theme-text)">
                Nombre
              </th>
              <th className="px-5 py-3.5 font-semibold text-sm text-(--theme-text)">
                Correo
              </th>
              <th className="px-5 py-3.5 font-semibold text-sm text-(--theme-text)">
                Rol
              </th>
              <th className="px-5 py-3.5 font-semibold text-sm text-(--theme-text)">
                Estado
              </th>
              <th className="px-5 py-3.5 font-semibold text-sm text-(--theme-text) text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => {
              const role = user.roles[0];
              const roleColor = ROLE_COLORS[role] || {
                bg: 'var(--theme-secondary-bg)',
                text: 'var(--theme-text)',
              };

              return (
                <tr
                  key={user.uid}
                  className={`
                    border-t border-(--theme-border)
                    transition-colors duration-150
                    hover:bg-primary/[0.03]
                    ${idx % 2 === 0 ? 'bg-(--theme-card-bg)' : 'bg-(--theme-bg)'}
                  `}
                >
                  <td className="px-5 py-4 text-sm font-medium text-(--theme-text)">
                    {user.displayName}
                  </td>
                  <td className="px-5 py-4 text-sm text-(--theme-text)/60">
                    {user.email}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium"
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
                        inline-block px-3 py-1 rounded-full text-xs font-medium
                        ${
                          user.isActive
                            ? 'bg-primary/15 text-primary'
                            : 'bg-(--theme-secondary-bg) text-(--theme-text)/50'
                        }
                      `}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg text-(--theme-text)/30 hover:text-primary hover:bg-primary/10 transition-colors duration-150"
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

      <div className="md:hidden flex flex-col gap-3">
        {users.map((user) => {
          const role = user.roles[0];
          const roleColor = ROLE_COLORS[role] || {
            bg: 'var(--theme-secondary-bg)',
            text: 'var(--theme-text)',
          };

          return (
            <div
              key={user.uid}
              className="bg-(--theme-card-bg) border border-(--theme-border) rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-(--theme-text) truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-(--theme-text)/50 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={() => onEdit(user)}
                  className="p-2 rounded-lg text-(--theme-text)/30 hover:text-primary hover:bg-primary/10 transition-colors duration-150 flex-shrink-0 ml-2"
                  title="Editar usuario"
                >
                  <Pencil size={15} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: roleColor.bg,
                    color: roleColor.text,
                  }}
                >
                  {ROLE_LABELS[role] || role}
                </span>
                <span
                  className={`
                    inline-block px-2.5 py-1 rounded-full text-xs font-medium
                    ${
                      user.isActive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-(--theme-secondary-bg) text-(--theme-text)/50'
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