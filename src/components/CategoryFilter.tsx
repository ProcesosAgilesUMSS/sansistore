import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { ChevronDown, Search } from 'lucide-react';
import { db } from '../lib/firebase';

interface Category {
  id: string;
  name: string;
  active?: boolean;
}

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        setCategories(
          snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as Category)
            .filter((c) => c.active !== false)
        );
      } catch {
        setLoadError(true);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = categories.find((c) => c.id === selectedCategory);
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex w-full sm:w-auto items-center gap-3" ref={containerRef}>
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full inline-flex items-center justify-between gap-3 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] sm:justify-start ${
            open
              ? 'border-primary/45 bg-primary/8 text-primary shadow-md shadow-primary/10'
              : 'border-border-light bg-card-bg-light text-text-light shadow-sm hover:border-primary hover:text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            {selected ? selected.name : 'Todas las categorías'}
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${
              open ? 'rotate-180 text-primary' : 'text-primary/60'
            }`}
          />
        </button>

        {open && (
          <div className="filter-popover-reveal absolute left-0 right-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border-light bg-bg-light shadow-xl shadow-black/10 sm:left-0 sm:right-auto sm:w-64">
            <div className="border-b border-border-light bg-secondary-bg-light/30 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-border-light bg-bg-light px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/8">
                <Search size={14} className="text-primary opacity-60 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar categorías..."
                  className="w-full bg-transparent text-sm text-text-light placeholder:opacity-30 outline-none"
                />
              </div>
            </div>

            <ul className="custom-scrollbar max-h-72 overflow-y-auto p-1 py-2">
              {!loadError && (
                <li className="px-1">
                  <button
                    type="button"
                    onClick={() => {
                      onCategoryChange(null);
                      setOpen(false);
                    }}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                      selectedCategory === null
                        ? 'bg-primary/12 text-primary shadow-sm shadow-primary/10'
                        : 'text-text-light hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    Todas
                  </button>
                </li>
              )}
              {loadError && (
                <li className="px-4 py-3 text-xs text-red-500">
                  Error al cargar categorías.
                </li>
              )}
              {!loadError && filtered.length === 0 && (
                <li className="px-4 py-3 text-xs text-text-light opacity-50">
                  No se encontraron categorías.
                </li>
              )}
              {filtered.map((cat) => (
                <li key={cat.id} className="px-1">
                  <button
                    type="button"
                    onClick={() => {
                      onCategoryChange(cat.id);
                      setOpen(false);
                    }}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                      selectedCategory === cat.id
                        ? 'bg-primary/12 text-primary shadow-sm shadow-primary/10'
                        : 'text-text-light hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
