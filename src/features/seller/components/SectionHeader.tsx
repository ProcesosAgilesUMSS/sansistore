import type { ReactNode } from 'react';

interface Props {
  title: string;
  /** Texto opcional debajo del título. */
  subtitle?: string;
  /** Conteo opcional: se muestra como píldora a la derecha si no se pasa `action`. */
  count?: number;
  /** Contenido libre alineado a la derecha (botón, filtro...). Tiene prioridad sobre `count`. */
  action?: ReactNode;
}

export const SectionHeader = ({ title, subtitle, count, action }: Props) => {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-black leading-none tracking-[-0.03em] text-(--theme-text)">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-(--theme-text) opacity-60">{subtitle}</p>
        )}
      </div>

      {action ? (
        <div className="shrink-0">{action}</div>
      ) : (
        count != null && (
          <span className="shrink-0 self-start rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-4 py-1.5 text-xs font-bold text-(--theme-text) sm:self-auto">
            {count} {count === 1 ? 'pedido' : 'pedidos'}
          </span>
        )
      )}
    </div>
  );
};
