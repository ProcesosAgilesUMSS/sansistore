import { Trash2, Star } from 'lucide-react';
import type { Location } from '../types';
import { TYPE_ICONS } from '../constants/locationIcons';

interface LocationCardProps {
    location: Location;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
}

export default function LocationCard({
    location,
    isSelected,
    onSelect,
    onDelete,
    onSetDefault
}: LocationCardProps) {
    const { id, label, type, lat, lng, isDefault } = location;

    if (!id) return null;

    return (
        <div
            onClick={() => onSelect(id)}
            className={`
                flex items-center gap-3 rounded-[1.25rem] border px-4 py-3 
                transition-all duration-300 cursor-pointer
                ${isSelected
                    ? 'border-[#88B04B] bg-[#88B04B]/10 shadow-[0_0_0_2px_rgba(136,176,75,0.15)]'
                    : isDefault
                        ? 'border-[#88B04B]/50 bg-[#88B04B]/5 dark:bg-[#88B04B]/10'
                        : 'border-[--theme-border] bg-[--theme-card-bg] hover:border-[#88B04B]/40'
                }
            `}
        >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#88B04B]/10 text-[#88B04B] transition-colors duration-300">
                {TYPE_ICONS[type]}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-outfit text-sm font-extrabold leading-none text-[--theme-text] transition-colors duration-300">
                        {type}
                    </span>
                    {isDefault && (
                        <span className="rounded-full bg-[#88B04B] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                            Predeterminada
                        </span>
                    )}
                </div>

                <p className="mt-1 font-inter text-[10px] font-bold uppercase tracking-widest text-[#88B04B]">
                    {label}
                </p>

                <p className="mt-0.5 font-mono text-[11px] tabular-nums text-[--theme-text]/60 transition-colors duration-300">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onSetDefault(id);
                }}
                aria-label={`Establecer ${label} como predeterminada`}
                className={`
                    flex h-8 w-8 items-center justify-center rounded-full border transition-all
                    ${isDefault
                        ? 'border-[#88B04B] text-[#88B04B] opacity-100'
                        : 'border-[#88B04B]/20 text-[#88B04B] opacity-40 hover:opacity-100 hover:border-[#88B04B]'
                    }
                `}
            >
                <Star size={14} fill={isDefault ? '#88B04B' : 'none'} />
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                }}
                aria-label={`Eliminar ${label}`}
                className="
                    flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
                    border border-red-200/50 text-red-500 opacity-60 transition-all
                    hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:opacity-100
                "
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
