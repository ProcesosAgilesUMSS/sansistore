import type { LucideIcon } from 'lucide-react';

interface NavItemInternalProps extends NavItemProps {
  isActive: boolean;
}

export interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  sprint?: boolean;
  count?: number;
  countType?: 'alert' | 'warn';
  disabled?: boolean;
}

export function NavItem({
  icon,
  label,
  href,
  sprint,
  count,
  countType,
  disabled = false,
  isActive,
}: NavItemInternalProps) {
  const Icon = icon;

  const baseClass = `
    flex items-center gap-2.5 px-2.5 py-2 rounded-[0.625rem]
    text-sm font-medium text-(--theme-text)
    border border-transparent no-underline
    transition-all duration-180 ease-[cubic-bezier(0.4,0,0.2,1)]
    max-md:flex-col max-md:gap-[3px] max-md:px-2.5 max-md:py-1.5
    max-md:text-xs max-md:min-w-[60px] max-md:text-center max-md:flex-1
    ${disabled ? 'opacity-30 pointer-events-none cursor-not-allowed' : 'cursor-pointer'}
  `;

  const activeClass = `
    bg-primary/10 !border-primary/30
    !text-primary font-semibold !opacity-100
  `;

  const inactiveClass = `
    opacity-50
    hover:bg-(--theme-secondary-bg) hover:opacity-85 hover:translate-x-0.5
    max-md:hover:translate-x-0
  `;

  const content = (
    <>
      <Icon
        size={16}
        className="shrink-0 text-(--theme-text) opacity-60 group-hover:opacity-100 transition-opacity"
      />

      <span className="flex-1 max-md:flex-none leading-tight">{label}</span>

      {sprint && count == null && (
        <span
          className="
          w-1.5 h-1.5 rounded-full bg-primary ml-auto shrink-0
          shadow-primary/30 max-md:hidden
        "
        />
      )}

      {count != null && (
        <span
          className={`
          ml-auto text-xs font-bold px-1.5 py-px rounded-full shrink-0 max-md:hidden
          ${
            countType === 'alert'
              ? 'bg-(--theme-error-bg) text-(--theme-error)'
              : 'bg-(--theme-warning-bg) text-(--theme-warning)'
          }
        `}
        >
          {count}
        </span>
      )}
    </>
  );

  if (disabled) {
    return <div className={`${baseClass} ${inactiveClass}`}>{content}</div>;
  }

  return (
    <a
      href={href}
      className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      {content}
    </a>
  );
}
