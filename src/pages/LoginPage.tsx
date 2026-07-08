import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, User } from 'lucide-react';
import { login } from '@/api/auth';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/authStore';
import { loginSchema, type LoginFormValues } from '@/pages/login-schema';

// Filas de ejemplo para el "kardex" animado del panel de identidad — puramente decorativo,
// evoca el libro de movimientos que es el corazón conceptual de todo el sistema (doc. 02).
const KARDEX_ROWS = [
  { producto: 'Arroz 1kg', tipo: 'ENTRADA', cantidad: '+120', saldo: '340' },
  { producto: 'Aceite 1L', tipo: 'SALIDA', cantidad: '-8', saldo: '52' },
  { producto: 'Panela 500g', tipo: 'ENTRADA', cantidad: '+60', saldo: '180' },
  { producto: 'Leche 1L', tipo: 'SALIDA', cantidad: '-14', saldo: '96' },
  { producto: 'Café 250g', tipo: 'AJUSTE', cantidad: '-2', saldo: '44' },
  { producto: 'Huevos x30', tipo: 'ENTRADA', cantidad: '+40', saldo: '112' },
  { producto: 'Azúcar 1kg', tipo: 'SALIDA', cantidad: '-11', saldo: '73' },
  { producto: 'Detergente', tipo: 'ENTRADA', cantidad: '+25', saldo: '58' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const response = await login(values);
      setSession(response);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Usuario o contraseña incorrectos'));
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panel de identidad — oculto en móvil, el foco ahí es el formulario */}
      <div className="relative hidden w-1/2 overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <span className="font-display text-2xl font-semibold tracking-tight text-white">
            RMS
          </span>
          <p className="mt-1 text-sm text-ink-400">Retail Management System</p>
        </div>

        <div>
          <h1 className="font-display text-3xl font-medium leading-tight text-white">
            Cada movimiento,
            <br />
            registrado.
          </h1>
          <p className="mt-3 max-w-sm text-sm text-ink-400">
            Inventario, compras, ventas y caja en un solo lugar — para que siempre sepas
            cuánto tienes, cuánto vendes y cuánto ganas.
          </p>
        </div>

        {/* El "kardex" animado: cinta vertical de movimientos que se desplaza sola */}
        <div
          className="pointer-events-none absolute -right-8 top-1/2 h-[420px] w-72 -translate-y-1/2 overflow-hidden rounded-xl border border-ink-700/60 bg-ink-800/40 font-mono text-xs shadow-2xl motion-reduce:h-auto motion-reduce:overflow-visible"
          aria-hidden="true"
        >
          <div className="animate-[kardex-scroll_18s_linear_infinite] motion-reduce:animate-none">
            {[...KARDEX_ROWS, ...KARDEX_ROWS].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-ink-700/50 px-4 py-3 text-ink-300"
              >
                <span className="truncate">{row.producto}</span>
                <span
                  className={
                    row.tipo === 'ENTRADA'
                      ? 'text-success-500'
                      : row.tipo === 'SALIDA'
                        ? 'text-amber-300'
                        : 'text-ink-400'
                  }
                >
                  {row.cantidad}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-xl font-semibold tracking-tight text-ink-800">
              RMS
            </span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink-800">Inicia sesión</h2>
          <p className="mt-1 text-sm text-ink-400">
            Ingresa tus credenciales para entrar al sistema.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink-700">
                Usuario
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className="w-full rounded-lg border border-ink-200 py-2.5 pl-10 pr-3 text-sm text-ink-800 outline-none transition-colors focus:border-ink-500"
                  placeholder="admin"
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-danger-500">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-700">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-ink-200 py-2.5 pl-10 pr-3 text-sm text-ink-800 outline-none transition-colors focus:border-ink-500"
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger-500">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-700 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            ¿Todavía no tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-ink-700 underline">
              Registra tu negocio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
