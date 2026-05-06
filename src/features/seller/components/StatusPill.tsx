export const StatusPill = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        RESERVADO:
            'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40',
        LISTO:
            'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40',
        ASIGNADO:
            'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40',
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-700 tracking-wide ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${status === 'RESERVADO'
                    ? 'bg-amber-500'
                    : status === 'LISTO'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
            />
            {status}
        </span>
    );
}