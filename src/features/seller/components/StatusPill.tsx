interface Props {
  status: string;
}

export const StatusPill = ({ status }: Props) => {
  const styles: Record<string, string> = {
    RESERVADO:
      'border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text)',
    LISTO:
      'border border-(--theme-border) bg-primary text-white',
    ASIGNADO:
      'border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text)',
    'NO ENTREGADO':
      'border border-amber-200 bg-amber-50 text-amber-800',
    CANCELADO:
      'border border-red-200 bg-red-50 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-700 tracking-wide ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'RESERVADO'
            ? 'bg-primary'
            : status === 'LISTO'
              ? 'bg-white'
              : status === 'NO ENTREGADO'
                ? 'bg-amber-500'
                : status === 'CANCELADO'
                  ? 'bg-red-500'
                  : 'bg-primary'
        }`}
      />
      {status}
    </span>
  );
}
