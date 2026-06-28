import { ShoppingBag } from 'lucide-react';
import { FaInstagram, FaTiktok, FaFacebookF } from 'react-icons/fa6';

const SOCIALS = [
  { label: 'Instagram', href: '#', Icon: FaInstagram },
  { label: 'TikTok', href: '#', Icon: FaTiktok },
  { label: 'Facebook', href: '#', Icon: FaFacebookF },
];

export default function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`border-t border-(--theme-border) bg-(--theme-bg) font-sans ${className}`}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-9 flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Brand */}
        <a href="/" aria-label="SansiStore — inicio" className="group flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-sm shadow-primary/30 transition-transform group-hover:scale-105 group-active:scale-95">
            <ShoppingBag size={15} strokeWidth={2.4} />
          </span>
          <span className="font-display font-black tracking-tight text-base leading-none text-(--theme-text)">
            Sansi<span className="text-primary">Store</span>
          </span>
        </a>

        {/* Copyright */}
        <p className="text-(--theme-text) opacity-55 text-xs tracking-[0.02em]">
          © 2026 SansiStore. Todos los derechos reservados.
        </p>

        {/* Redes */}
        <div className="flex items-center gap-2">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-(--theme-border) text-(--theme-text) opacity-70 transition-all hover:border-primary hover:bg-primary hover:text-white hover:opacity-100 hover:scale-105"
            >
              <Icon size={15} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
