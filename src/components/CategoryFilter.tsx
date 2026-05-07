import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { ChevronDown, X, Search } from 'lucide-react';
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
    <div className="flex items-center gap-3" ref={containerRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 border-border-light text-text-light hover:border-primary hover:text-primary">
          {selected ? selected.name : 'Categoría'}
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 mt-2 z-30 w-56 rounded-2xl border shadow-lg overflow-hidden bg-card-bg-light border-border-light">
            <div className="p-2 border-b border-border-light">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary-bg-light">
                <Search size={13} className="text-text-light opacity-40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar categoría..."
                  className="w-full bg-transparent text-sm text-text-light placeholder:opacity-40 outline-none" />
              </div>
            </div>

            <ul className="max-h-56 overflow-y-auto">
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
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => { onCategoryChange(cat.id); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:text-primary ${selectedCategory === cat.id ? 'text-primary bg-primary/10' : 'text-text-light'}`}>
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selectedCategory && (
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 bg-primary text-bg-light hover:brightness-110 active:scale-95">
          <X size={13} />
          Quitar filtro
        </button>
      )}
    </div>
  );
}