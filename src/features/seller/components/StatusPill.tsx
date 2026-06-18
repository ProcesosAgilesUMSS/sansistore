interface Props {
  status: string;
}

export const StatusPill = ({ status }: Props) => {
  const styles: Record<string, string> = {
    RESERVADO:
      'border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text)',
    LISTO:
      'border border-(--theme-border) bg-primary text-primary-action',
    ASIGNADO:
      'border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text)',
    'NO ENTREGADO':
      'border border-(--theme-warning-border) bg-(--theme-warning-bg) text-(--theme-warning)',
    CANCELADO:
      'border border-(--theme-error-border) bg-(--theme-error-bg) text-(--theme-error)',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-700 tracking-wide ${styles[status] ?? 'bg-(--theme-secondary-bg) text-(--theme-text) opacity-60'}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'RESERVADO'
            ? 'bg-primary'
            : status === 'LISTO'
              ? 'bg-(--theme-bg)'
              : status === 'NO ENTREGADO'
                ? 'bg-(--theme-warning)'
                : status === 'CANCELADO'
                  ? 'bg-(--theme-error)'
                  : 'bg-primary'
        }`}
      />
      {status}
    </span>
  );
}
