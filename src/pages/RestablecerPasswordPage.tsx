import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { restablecerPassword } from '@/api/passwordReset';
import { getApiErrorMessage } from '@/api/errors';

export default function RestablecerPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Este enlace no es válido. Solicita uno nuevo.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      await restablecerPassword(token, password);
      setExito(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo restablecer la contraseña'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-ink-100 bg-white p-8 shadow-card">
        <span className="font-display text-xl font-semibold tracking-tight text-ink-800">RMS</span>

        {exito ? (
          <div className="mt-6 text-center">
            <CheckCircle2 size={40} className="mx-auto text-success-500" />
            <h1 className="mt-4 font-display text-xl font-semibold text-ink-800">¡Listo!</h1>
            <p className="mt-2 text-sm text-ink-500">Tu contraseña fue actualizada. Ya puedes iniciar sesión.</p>
          </div>
        ) : (
          <>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink-800">Elige tu nueva contraseña</h1>

            {!token && (
              <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">
                No encontramos un enlace válido. Pídelo de nuevo desde{' '}
                <Link to="/olvide-password" className="underline">
                  aquí
                </Link>
                .
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Nueva contraseña</span>
                <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Confirma la contraseña</span>
                <input type="password" className="input" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              </label>

              {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

              <button
                type="submit"
                disabled={cargando || !token}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {cargando && <Loader2 size={16} className="animate-spin" />}
                Restablecer contraseña
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
