import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="pt-14 min-h-[80vh] flex items-center bg-bg-light" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center gap-6">

        {/* Badge */}
        <span className="uppercase tracking-[0.2em] font-black animate-fadeIn text-primary" style={{ fontSize: '12px', letterSpacing: '0.25em' }}>
          Nueva colección
        </span>

        {/* Title */}
        <h1 className="font-black leading-[0.95] max-w-3xl animate-fadeUp text-text-light" style={{ fontSize: 'clamp(2.2rem, 6vw, 5rem)', letterSpacing: '-0.05em', fontWeight: 900 }}>
          Encuentra tu estilo{' '}
          <span className="text-primary">único</span>
        </h1>

        {/* Description */}
        <p className="max-w-md animate-fadeUp text-text-light" style={{ opacity: 0.65, fontSize: '16px', lineHeight: 1.6 }}>
          Productos cuidadosamente seleccionados. Calidad y estilo en un solo lugar.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-2 animate-fadeUp">

          {/* Primary */}
          <a
            href="#productos"
            className="px-6 py-3 rounded-full font-semibold text-sm transition-all active:scale-95 hover:brightness-110 bg-primary text-bg-light"
          >
            Ver colección
          </a>

          {/* Secondary */}
          <a
            href="#"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border font-medium text-sm transition-all active:scale-95 hover:border-opacity-60 border-border-light text-text-light hover:border-primary"
          >
            Explorar
            <ArrowRight size={14} />
          </a>

        </div>
      </div>

      {/* Animaciones globales */}
      <style>{`
        .animate-fadeUp {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.9s cubic-bezier(0.2, 0, 0, 1) forwards;
        }

        .animate-fadeIn {
          opacity: 0;
          animation: fadeIn 1s ease forwards;
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}