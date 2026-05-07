import { AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message:string;
  title:string;
}

export default function ErrorCard({ isOpen, onClose, message, title }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-sans">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[340px] rounded-[1.25rem] bg-[#FFFFFF] dark:bg-[#141518] border border-[#88B04B]/15 dark:border-white/10 p-6 shadow-xl transform transition-all">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-[#88B04B]/10 text-[#88B04B]">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-center font-display font-extrabold text-[20px] text-[#1E1E1E] dark:text-[#F5F3EF] mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-center font-medium text-[14px] text-[#1E1E1E]/70 dark:text-[#F5F3EF]/70 mb-6 leading-relaxed">
          {message}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 px-6 rounded-full bg-[#1E1E1E] dark:bg-[#F5F3EF] text-[#FFFFFF] dark:text-[#1E1E1E] uppercase font-bold text-[12px] tracking-wider transition-all hover:opacity-90 active:scale-95"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}