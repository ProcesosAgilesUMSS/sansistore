import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { generateOrderId, parseOrderId } from '../services/orderService';

export default function OrderIdGenerator() {
  const [orderId, setOrderId] = useState(generateOrderId());
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    setOrderId(generateOrderId());
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.getElementById('order-id-output') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [orderId]);

  const { uuid, friendlyName } = parseOrderId(orderId);

  return (
    <div className="max-w-lg mx-auto px-4 pt-24 pb-32">
      <div className="rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-sm">
        <h1 className="text-lg font-bold text-text-light mb-1">Order ID Generator</h1>
        <p className="text-xs text-text-light/60 mb-6">
          Generate and copy order IDs with friendly names.
        </p>

        <div className="rounded-xl border border-border-light bg-bg-light/60 p-4 mb-6">
          <p className="text-[10px] font-mono text-text-light/40 break-all">{uuid}</p>
          <p className="text-2xl font-black text-text-light mt-1">
            {friendlyName.replace(/-/g, ' ')}
          </p>
        </div>

        <input
          id="order-id-output"
          value={orderId}
          readOnly
          className="sr-only"
          aria-hidden="true"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-border-light px-4 py-2.5 text-sm font-semibold text-text-light transition hover:bg-secondary-bg-light active:scale-95"
          >
            <RefreshCw size={16} />
            Generate
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
