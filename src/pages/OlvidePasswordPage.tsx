import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { solicitarRecuperacion } from '@/api/passwordReset';

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setCargando(true);
    try {
      await solicitarRecuperacion(email.trim());
    } finally {
      setCargando(false);
      setEnviado(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-ink-100 bg-white p-8 shadow-card">
        <span className="font-display text-xl font-bold tracking-tight">
          <span className="text-ink-900">SIC</span>
          <span className="text-sicom-green">OM</span>
        </span>

        {enviado ? (
          <div className="mt-6 text-center">
            <MailCheck size={40} className="mx-auto text-success-500" />
            <h1 className="mt-4 font-display text-xl font-semibold text-ink-800">Revisa tu correo</h1>
            <p className="mt-2 text-sm text-ink-500">
              Si <strong>{email}</strong> está registrado, te enviamos un enlace para restablecer tu contraseña. Es
              válido por 1 hora.
            </p>
            <Link to="/login" className="mt-6 block w-full rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white hover:bg-ink-700">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink-800">¿Olvidaste tu contraseña?</h1>
            <p className="mt-1 text-sm text-ink-400">Ingresa tu correo y te mandamos un enlace para restablecerla.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Email</span>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </label>

              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {cargando && <Loader2 size={16} className="animate-spin" />}
                Enviar enlace
              </button>

              <p className="text-center text-xs text-ink-400">
                <Link to="/login" className="font-medium text-ink-700 underline">
                  Volver a iniciar sesión
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
