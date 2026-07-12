import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { registrarEmpresa } from '@/api/registro';
import { getApiErrorMessage } from '@/api/errors';

export default function RegistroEmpresaPage() {
  const navigate = useNavigate();
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nit, setNit] = useState('');
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [apellidoAdmin, setApellidoAdmin] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!codigoInvitacion.trim() || !nombreEmpresa.trim() || !nombreAdmin.trim() || !username.trim() || !email.trim() || !password) {
      setError('Completa los campos obligatorios');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    try {
      const res = await registrarEmpresa({
        codigoInvitacion: codigoInvitacion.trim().toUpperCase(),
        nombreEmpresa,
        nit: nit || undefined,
        administrador: {
          nombre: nombreAdmin,
          apellido: apellidoAdmin || undefined,
          username,
          email,
          password,
        },
      });
      setExito(res.mensaje);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo completar el registro'));
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6">
        <div className="w-full max-w-sm rounded-xl border border-ink-100 bg-white p-8 text-center shadow-card">
          <CheckCircle2 size={40} className="mx-auto text-success-500" />
          <h1 className="mt-4 font-display text-xl font-semibold text-ink-800">¡Listo!</h1>
          <p className="mt-2 text-sm text-ink-500">{exito}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white hover:bg-ink-700"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-ink-100 bg-white p-8 shadow-card">
        <span className="font-display text-xl font-bold tracking-tight">
          <span className="text-ink-900">SIC</span>
          <span className="text-sicom-green">OM</span>
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-800">Registra tu negocio</h1>
        <p className="mt-1 text-sm text-ink-400">Crea tu empresa y tu usuario administrador para empezar a usar el sistema.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Código de invitación</span>
            <input
              className="input font-mono uppercase"
              placeholder="XXXX-XXXX"
              value={codigoInvitacion}
              onChange={(e) => setCodigoInvitacion(e.target.value)}
            />
            <span className="mt-1 block text-xs text-ink-400">Te lo debe compartir quien te invitó al sistema.</span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre del negocio</span>
            <input className="input" value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">NIT (opcional)</span>
            <input className="input" value={nit} onChange={(e) => setNit(e.target.value)} />
          </label>

          <div className="border-t border-ink-100 pt-4">
            <p className="mb-3 text-sm font-semibold text-ink-700">Tu usuario administrador</p>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</span>
                <input className="input" value={nombreAdmin} onChange={(e) => setNombreAdmin(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Apellido</span>
                <input className="input" value={apellidoAdmin} onChange={(e) => setApellidoAdmin(e.target.value)} />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Usuario</span>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Email</span>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Contraseña</span>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          </div>

          {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

          <button
            type="submit"
            disabled={cargando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {cargando && <Loader2 size={16} className="animate-spin" />}
            Crear mi empresa
          </button>

          <p className="text-center text-xs text-ink-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-ink-700 underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
