const categories = [
  {
    name: 'Novedades',
    description: 'Lo último en tendencias',
    emoji: '✨',
    color: '#88B04B',
  },
  {
    name: 'Más vendidos',
    description: 'Los favoritos del momento',
    emoji: '🔥',
    color: '#1E1E1E',
  },
  {
    name: 'Ofertas',
    description: 'Hasta 50% de descuento',
    emoji: '🏷️',
    color: '#88B04B',
  },
  {
    name: 'Colecciones',
    description: 'Selecciones exclusivas',
    emoji: '🎁',
    color: '#1E1E1E',
  },
];

export default function Categories() {
  return (
    <section
      id="categorias"
      className="py-24"
      style={{ backgroundColor: '#FFFBF4' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="text-center mb-14">
          <h2
            style={{
              color: '#1E1E1E',
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            Explora por categoría
          </h2>

          <p style={{ color: '#1E1E1E', opacity: 0.6 }}>
            Encuentra exactamente lo que buscas
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(136,176,75,0.15)',
              }}
            >

              {/* BACKGROUND LAYER */}
              <div
                className="absolute inset-0 transition-all duration-500 group-hover:scale-110"
                style={{
                  backgroundColor: cat.color,
                  opacity: 0.08,
                }}
              />

              {/* HOVER GLOW (GREEN CONSISTENCY) */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(136,176,75,0.12), transparent 70%)',
                }}
              />

              {/* CONTENT */}
              <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">

                <span
                  className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110"
                >
                  {cat.emoji}
                </span>

                <h3
                  className="text-lg font-bold transition-colors duration-300 group-hover:text-[#88B04B]"
                  style={{ color: '#1E1E1E' }}
                >
                  {cat.name}
                </h3>

                <p
                  className="text-sm mt-1"
                  style={{ color: '#1E1E1E', opacity: 0.6 }}
                >
                  {cat.description}
                </p>

              </div>

              {/* BORDER ACCENT ON HOVER */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 group-hover:border-[#88B04B]"
                style={{
                  border: '1px solid transparent',
                }}
              />

            </a>
          ))}

        </div>
      </div>
    </section>
  );
}