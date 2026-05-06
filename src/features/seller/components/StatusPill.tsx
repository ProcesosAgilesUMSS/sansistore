interface Props {
    status: string;
}

export const StatusPill = ({ status }: Props) => {
    const styles: Record<string, string> = {
        RESERVADO:
            'border border-[var(--theme-border)] bg-[var(--theme-secondary-bg)] text-[var(--theme-text)]',
        LISTO:
            'border border-[var(--theme-border)] bg-[var(--color-primary)] text-white',
        ASIGNADO:
            'border border-[var(--theme-border)] bg-[var(--theme-secondary-bg)] text-[var(--theme-text)]',
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-700 tracking-wide ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${status === 'RESERVADO'
                    ? 'bg-[var(--color-primary)]'
                    : status === 'LISTO'
                        ? 'bg-white'
                        : 'bg-[var(--color-primary)]'
                    }`}
            />
            {status}
        </span>
    );
}