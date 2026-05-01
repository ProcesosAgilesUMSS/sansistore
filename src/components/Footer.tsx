export default function Footer() {
  return (
    <footer
      className="border-t"
      style={{
        borderColor: 'rgba(136,176,75,0.15)',
        backgroundColor: '#FFFBF4',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <span
          className="font-black tracking-tight"
          style={{
            color: '#1E1E1E',
            fontSize: '16px',
          }}
        >
          sansi<span style={{ color: '#88B04B' }}>store</span>
        </span>

        {/* Copyright */}
        <p
          style={{
            color: '#1E1E1E',
            opacity: 0.55,
            fontSize: '12px',
            letterSpacing: '0.02em',
          }}
        >
          © 2025 Sansistore. Todos los derechos reservados.
        </p>

        {/* Social links */}
        <div className="flex items-center gap-6">

          {['Instagram', 'TikTok', 'Facebook'].map((s) => (
            <a
              key={s}
              href="#"
              style={{
                color: '#1E1E1E',
                opacity: 0.55,
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.color = '#88B04B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.55';
                e.currentTarget.style.color = '#1E1E1E';
              }}
            >
              {s}
            </a>
          ))}

        </div>
      </div>
    </footer>
  );
}