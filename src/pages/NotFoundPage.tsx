import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 text-center">
      <p className="font-display text-6xl font-semibold text-ink-300">404</p>
      <p className="mt-2 text-sm text-ink-500">Esta página no existe.</p>
      <Link to="/" className="mt-4 text-sm font-medium text-ink-700 underline">
        Volver al inicio
      </Link>
    </div>
  );
}
