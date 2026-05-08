
export const formatDate = (date: Date | null): string => {
    if (!date) return '—';
    return date.toLocaleString('es-BO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}