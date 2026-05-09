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
          className="w-full inline-flex items-center justify-between sm:justify-start gap-3 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-200 border-border-light text-text-light hover:border-primary hover:text-primary active:scale-[0.98] bg-card-bg-light shadow-sm">
          <div className="flex items-center gap-2">
            
            {selected ? selected.name : 'Todas las categorías'}
          </div>
          <ChevronDown size={16} className={`text-primary/60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 sm:left-0 sm:right-auto mt-2 z-50 w-full sm:w-64 rounded-2xl border shadow-xl overflow-hidden bg-bg-light border-border-light animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-border-light bg-secondary-bg-light/30">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-light border border-border-light focus-within:border-primary/50 transition-colors">
                <Search size={14} className="text-primary opacity-60 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar categorías..."
                  className="w-full bg-transparent text-sm text-text-light placeholder:opacity-30 outline-none" />
              </div>
            </div>

            <ul className="max-h-72 overflow-y-auto p-1 py-2 custom-scrollbar">
              {!loadError && (
                <li className="px-1">
                  <button
                    type="button"
                    onClick={() => { onCategoryChange(null); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 hover:bg-primary/5 hover:text-primary ${selectedCategory === null ? 'text-primary bg-primary/10' : 'text-text-light'}`}>
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
                    onClick={() => { onCategoryChange(cat.id); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 hover:bg-primary/5 hover:text-primary ${selectedCategory === cat.id ? 'text-primary bg-primary/10' : 'text-text-light'}`}>
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