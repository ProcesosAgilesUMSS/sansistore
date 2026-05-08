import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const isSuccess = type === 'success';

  return (
    <div
      className={`
        fixed z-100 transition-all duration-300 ease-out

        /* Mobile: bottom center */
        bottom-4 left-4 right-4
        md:bottom-auto md:left-auto

        /* Desktop: top-right */
        md:top-5 md:right-5 md:w-auto md:max-w-sm
      `}
    >
      <div
        className={`
          flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-lg border
          transition-all duration-300 ease-out
          ${isSuccess
            ? 'bg-[#f0f7e6] border-[rgba(136,176,75,0.3)] text-[#3d5a1e]'
            : 'bg-[#fef2f2] border-[rgba(220,60,60,0.2)] text-[#991b1b]'
          }
          ${isVisible && !isExiting
            ? 'opacity-100 translate-y-0'
            : isExiting
              ? 'opacity-0 translate-y-2 md:-translate-y-2'
              : 'opacity-0 translate-y-4 md:-translate-y-4'
          }
        `}
      >
        {isSuccess
          ? <CheckCircle2 size={18} className="text-primary shrink-0" />
          : <XCircle size={18} className="text-[#dc3c3c] shrink-0" />
        }
        <p className="text-[13px] font-medium flex-1">{message}</p>
        <button
          onClick={handleClose}
          className={`
            p-1 rounded-md shrink-0 transition-colors
            ${isSuccess
              ? 'hover:bg-primary/10 text-[#3d5a1e]/50 hover:text-[#3d5a1e]'
              : 'hover:bg-[#dc3c3c]/10 text-[#991b1b]/50 hover:text-[#991b1b]'
            }
          `}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
