import { MessageSquare } from 'lucide-react';

interface ErrorStateProps {
  error: string;
}

export default function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="rounded-3xl border border-border-light bg-card-bg-light px-6 py-10 text-center">
      <MessageSquare size={36} className="mx-auto mb-4 text-primary" />
      <h1 className="text-lg font-black text-text-light">Error al cargar el detalle</h1>
      <p className="mt-2 text-sm text-text-light opacity-70">{error}</p>
    </div>
  );
}
