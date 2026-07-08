import { Loader2, Inbox, AlertCircle } from 'lucide-react';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-ink-400">
      <Loader2 size={24} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-200 bg-white py-16 text-center">
      <Inbox size={28} className="text-ink-300" />
      <p className="text-sm font-medium text-ink-600">{title}</p>
      {description && <p className="max-w-sm text-xs text-ink-400">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-600">
      <AlertCircle size={16} className="shrink-0" />
      {message}
    </div>
  );
}
