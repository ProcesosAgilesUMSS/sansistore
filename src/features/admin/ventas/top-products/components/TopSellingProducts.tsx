import { useState, useMemo } from 'react';
import { useTopProducts } from '../hooks/useTopProducts';
import { Search, ChevronDown, Trophy, Package, TrendingUp } from 'lucide-react';
import type { TopProduct, CategoryOption } from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 MODO DEMO: cambiar a false para usar datos reales
const USE_MOCK_DATA = false;
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MOCK_CATEGORIES: CategoryOption[] = [
  { id: 'cat-1', name: 'Bolsas' },
  { id: 'cat-2', name: 'Botellas' },
  { id: 'cat-3', name: 'Utensilios' },
  { id: 'cat-4', name: 'Desechables' },
  { id: 'cat-5', name: 'Cuidado Personal' },
  { id: 'cat-6', name: 'Limpieza' },
];

const MOCK_PRODUCTS: TopProduct[] = [
  {
    productId: '1',
    name: 'Bolsa Ecológica Grande',
    categoryId: 'cat-1',
    categoryName: 'Bolsas',
    price: 35,
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=100&h=100&fit=crop',
    soldCount: 248,
  },
  {
    productId: '2',
    name: 'Botella Reutilizable 750ml',
    categoryId: 'cat-2',
    categoryName: 'Botellas',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=100&h=100&fit=crop',
    soldCount: 215,
  },
  {
    productId: '3',
    name: 'Set de Cubiertos Bambú',
    categoryId: 'cat-3',
    categoryName: 'Utensilios',
    price: 28,
    imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=100&h=100&fit=crop',
    soldCount: 189,
  },
  {
    productId: '4',
    name: 'Plato Biodegradable Pack x10',
    categoryId: 'cat-4',
    categoryName: 'Desechables',
    price: 22,
    imageUrl: '',
    soldCount: 167,
  },
  {
    productId: '5',
    name: 'Vaso Térmico Acero',
    categoryId: 'cat-2',
    categoryName: 'Botellas',
    price: 52,
    imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=100&h=100&fit=crop',
    soldCount: 142,
  },
  {
    productId: '6',
    name: 'Cepillo Dental Bambú x3',
    categoryId: 'cat-5',
    categoryName: 'Cuidado Personal',
    price: 18,
    imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=100&h=100&fit=crop',
    soldCount: 128,
  },
  {
    productId: '7',
    name: 'Bolsa Malla Frutas x5',
    categoryId: 'cat-1',
    categoryName: 'Bolsas',
    price: 25,
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop',
    soldCount: 115,
  },
  {
    productId: '8',
    name: 'Jabón Artesanal Lavanda',
    categoryId: 'cat-5',
    categoryName: 'Cuidado Personal',
    price: 15,
    imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=100&h=100&fit=crop',
    soldCount: 98,
  },
  {
    productId: '9',
    name: 'Esponja Natural Cocina x3',
    categoryId: 'cat-6',
    categoryName: 'Limpieza',
    price: 12,
    imageUrl: '',
    soldCount: 87,
  },
  {
    productId: '10',
    name: 'Pajillas Acero Inoxidable x6',
    categoryId: 'cat-3',
    categoryName: 'Utensilios',
    price: 20,
    imageUrl: 'https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=100&h=100&fit=crop',
    soldCount: 76,
  },
];

const formatCurrency = (amount: number) =>
  `Bs. ${amount.toLocaleString('es-BO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  })}`;

const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function TopSellingProducts() {
  const firestore = useTopProducts();

  const products = USE_MOCK_DATA ? MOCK_PRODUCTS : firestore.products;
  const categories = USE_MOCK_DATA ? MOCK_CATEGORIES : firestore.categories;
  const loading = USE_MOCK_DATA ? false : firestore.loading;
  const error = USE_MOCK_DATA ? null : firestore.error;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q),
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  const maxSoldCount = useMemo(
    () => Math.max(...filteredProducts.map((p) => p.soldCount), 1),
    [filteredProducts],
  );

  const selectedCategoryLabel =
    selectedCategory === 'all'
      ? 'Todas las categorías'
      : categories.find((c) => c.id === selectedCategory)?.name ?? 'Categoría';

  if (loading) {
    return (
      <div className="space-y-6 pb-10 animate-pulse">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="h-7 w-64 bg-(--theme-secondary-bg) rounded-lg" />
            <div className="h-4 w-48 bg-(--theme-secondary-bg) rounded-lg mt-2" />
          </div>
          <div className="h-4 w-44 bg-(--theme-secondary-bg) rounded-lg mt-1" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-12 bg-(--theme-secondary-bg) rounded-xl" />
          <div className="w-full sm:w-56 h-12 bg-(--theme-secondary-bg) rounded-xl" />
        </div>
        <div className="bg-(--theme-card-bg) rounded-2xl overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-(--theme-border)/30' : ''}`}
            >
              <div className="w-8 h-6 bg-(--theme-secondary-bg) rounded" />
              <div className="w-12 h-12 bg-(--theme-secondary-bg) rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-(--theme-secondary-bg) rounded" />
                <div className="h-3 w-24 bg-(--theme-secondary-bg) rounded" />
              </div>
              <div className="hidden sm:block flex-1">
                <div className="h-6 bg-(--theme-secondary-bg) rounded-full" />
              </div>
              <div className="h-4 w-16 bg-(--theme-secondary-bg) rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-10">
        <div className="bg-(--theme-error-bg) border border-(--theme-error-border) rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-(--theme-error)">Error al cargar los datos</p>
          <p className="text-xs text-(--theme-error) mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-(--theme-text) tracking-tight">
            Productos más vendidos
          </h2>
          <p className="text-xs text-(--theme-text)/50 mt-0.5">
            Top {filteredProducts.length > 0 ? filteredProducts.length : 10} productos por unidades vendidas
          </p>
        </div>
        <span className="text-xs text-(--theme-text)/40 mt-1 sm:mt-0.5 capitalize">
          {formatDate()}
        </span>
      </div>

      

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2.5 bg-(--theme-card-bg) border border-(--theme-border) rounded-xl px-4 py-2.5">
          <Search size={16} className="text-(--theme-text)/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none text-(--theme-text) placeholder:text-(--theme-text)/30"
          />
        </div>

        {/* Category dropdown */}
        <div className="relative w-full sm:w-56">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2 bg-(--theme-card-bg) border border-(--theme-border) rounded-xl px-4 py-2.5 text-sm text-(--theme-text) hover:border-primary/40 transition-colors"
          >
            <span className="truncate">{selectedCategoryLabel}</span>
            <ChevronDown
              size={16}
              className={`text-(--theme-text)/40 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute z-20 top-full mt-1 w-full bg-(--theme-card-bg) border border-(--theme-border) rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-(--theme-text)/70 hover:bg-(--theme-secondary-bg)'
                  }`}
                >
                  Todas las categorías
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-(--theme-text)/70 hover:bg-(--theme-secondary-bg)'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length > 0 ? (
        <div className="bg-(--theme-card-bg) rounded-2xl overflow-hidden">
          {filteredProducts.map((product, index) => {
            const barPercent = (product.soldCount / maxSoldCount) * 100;
            const isTop3 = index < 3;

            return (
              <div
                key={product.productId}
                className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 transition-colors hover:bg-(--theme-secondary-bg)/50 ${
                  index > 0 ? 'border-t border-(--theme-border)/30' : ''
                }`}
              >
                {/* Rank number */}
                <span
                  className={`text-lg sm:text-lg font-bold w-6 sm:w-8 text-center flex-shrink-0 ${
                    isTop3 ? 'text-primary' : 'text-(--theme-text)/20'
                  }`}
                >
                  {index + 1}
                </span>

                {/* Product image */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-(--theme-secondary-bg) flex-shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={18} className="text-(--theme-text)/20" />
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-(--theme-text) truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-(--theme-text)/40 truncate">
                    {product.categoryName}
                  </p>
                </div>

                {/* Progress bar - hidden on very small screens */}
                <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs">
                  <div className="flex-1 h-7 bg-(--theme-secondary-bg) rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                      style={{ width: `${Math.max(barPercent, 18)}%` }}
                    >
                      <span className="text-xs font-semibold text-white whitespace-nowrap">
                        {product.soldCount} vendidos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sold count on mobile */}
                <div className="sm:hidden flex-shrink-0">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {product.soldCount}
                  </span>
                </div>

                {/* Price */}
                <span className="text-sm font-medium text-(--theme-text)/60 flex-shrink-0 w-16 sm:w-20 text-right">
                  {formatCurrency(product.price)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="border-2 border-dashed border-(--theme-border) rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-(--theme-secondary-bg) flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-(--theme-text)/25" />
          </div>
          <p className="text-sm font-bold text-(--theme-text)">
            No hay datos de ventas disponibles
          </p>
          <p className="text-xs text-(--theme-text)/50 mt-1.5 max-w-sm">
            {selectedCategory !== 'all' || searchQuery.trim()
              ? 'No se encontraron productos con los filtros seleccionados. Intenta con otra categoría o búsqueda.'
              : 'Aún no se han registrado ventas. Los productos aparecerán aquí cuando se confirmen órdenes.'}
          </p>
        </div>
      )}

      {/* Real-time info box */}
      <div className="flex items-start gap-3 bg-(--theme-success-bg) border border-(--theme-success-border) rounded-2xl p-4 sm:p-5">
        <Trophy size={16} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-(--theme-text) mb-0.5">Datos en tiempo real</h4>
          <p className="text-xs text-(--theme-text)/60 leading-relaxed">
            El ranking se actualiza automáticamente desde Firestore.
            Solo se muestran productos con al menos una venta confirmada.
          </p>
        </div>
      </div>
    </div>
  );
}
