export const SkeletonRow = () => {
    return (
        <tr className="animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 rounded bg-[var(--theme-secondary-bg)] w-3/4" />
                </td>
            ))}
        </tr>
    );
}