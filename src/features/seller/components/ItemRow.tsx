import type { OrderItem } from '../types';
import { formatCurrency } from '../../utils/currency';

interface Props {
    item: OrderItem;
}

export const ItemRow = ({ item }: Props) => {

    return (
        <tr className="text-sm border-t border-[var(--theme-border)]">
            <td className="py-2 pl-4 pr-2 text-[var(--theme-text)] opacity-80">
                {item.productName}
            </td>
            <td className="py-2 px-2 text-center text-[var(--theme-text)] opacity-60">
                {item.quantity}
            </td>
            <td className="py-2 px-2 text-right text-[var(--theme-text)] opacity-60">
                {formatCurrency(item.unitPrice)}
            </td>
            <td className="py-2 pl-2 pr-4 text-right font-500 text-[var(--theme-text)]">
                {formatCurrency(item.subtotal)}
            </td>
        </tr>
    );
}