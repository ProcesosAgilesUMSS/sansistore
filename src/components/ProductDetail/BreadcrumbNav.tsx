import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function BreadcrumbNav() {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-2 text-sm text-text-light"
      >
        <a href="/" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
          Inicio
        </a>
        <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
        <a href="/productos" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
          Productos
        </a>
        <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
        <span className="font-bold text-primary" aria-current="page">
          Detalle
        </span>
      </nav>

      <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-border-light bg-card-bg-light px-4 py-2 text-sm font-semibold text-text-light transition-colors hover:border-primary hover:text-primary"
      >
        <ArrowLeft size={16} />
        Atrás
      </button>
    </div>
  );
}
