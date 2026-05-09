export default function Footer() {
  return (
    <footer className="border-t border-border-light bg-bg-light font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <span className="font-black tracking-tight text-[16px] text-text-light">
          sansi<span className="text-primary">store</span>
        </span>

        {/* Copyright */}
        <p className="text-text-light opacity-[0.55] text-[12px] tracking-[0.02em]">
          © 2025 Sansistore. Todos los derechos reservados.
        </p>

        {/* Social links */}
        <div className="flex items-center gap-6">

          {['Instagram', 'TikTok', 'Facebook'].map((s) => (
            <a
              key={s}
              href="#"
              className="text-[12px] text-text-light opacity-[0.55] font-semibold tracking-[0.05em] transition-all hover:text-primary hover:opacity-100"
            >
              {s}
            </a>
          ))}

        </div>
      </div>
    </footer>
  );
}