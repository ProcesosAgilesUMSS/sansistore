export default function Newsletter() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ backgroundColor: '#0A0B0D' }}
    >
      {/* Glow background */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(136,176,75,0.12)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 text-center">

        {/* Badge */}
        <span
          className="text-sm font-semibold uppercase tracking-widest block mb-4"
          style={{ color: '#88B04B' }}
        >
          Newsletter
        </span>

        {/* Title */}
        <h2
          className="font-bold mb-4"
          style={{
            color: '#F5F3EF',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            letterSpacing: '-0.03em',
          }}
        >
          Sé el primero en enterarte
        </h2>

        {/* Description */}
        <p
          className="mb-10"
          style={{ color: '#F5F3EF', opacity: 0.6 }}
        >
          Recibe novedades, ofertas exclusivas y lanzamientos antes que nadie directamente en tu correo.
        </p>

        {/* Form */}
        <form
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="tu@correo.com"
            className="flex-1 px-5 py-3.5 rounded-full outline-none transition-all duration-300 focus:scale-[1.01]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#F5F3EF',
            }}
          />

          <button
            type="submit"
            className="px-6 py-3.5 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: '#88B04B',
              color: '#0A0B0D',
            }}
          >
            Suscribirme
          </button>
        </form>

        {/* Footer note */}
        <p
          className="text-xs mt-4"
          style={{ color: '#F5F3EF', opacity: 0.4 }}
        >
          Sin spam. Cancela cuando quieras.
        </p>
      </div>
    </section>
  );
}