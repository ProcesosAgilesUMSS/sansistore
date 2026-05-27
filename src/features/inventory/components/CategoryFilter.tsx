import { ChevronDown, LayoutGrid } from 'lucide-react';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
}

export const CategoryFilter = ({
  value,
  onChange,
  categories,
}: CategoryFilterProps) => {
  return (
    <div className="relative inline-flex items-center">
      <LayoutGrid className="absolute left-3 w-3.5 h-3.5 text-(--theme-text) opacity-40 pointer-events-none" />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          appearance-none pl-8 pr-8 py-2
          text-xs font-semibold
          bg-(--theme-secondary-bg) text-(--theme-text)
          border border-(--theme-border) rounded-xl
          cursor-pointer transition-all duration-150
          hover:border-primary/50 focus:outline-none focus:border-primary/70
          focus:ring-2 focus:ring-primary/20
        "
      >
        <option value="all">Todas las categorías</option>

        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-(--theme-text) opacity-40 pointer-events-none" />
    </div>
  );
};
