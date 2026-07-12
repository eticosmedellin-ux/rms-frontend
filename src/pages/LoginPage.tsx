import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, User, Store, Package, FileText, TrendingUp, Users } from 'lucide-react';
import { login } from '@/api/auth';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/authStore';
import { loginSchema, type LoginFormValues } from '@/pages/login-schema';

/** Los 5 chips que orbitan el hexágono — son exactamente los 5 íconos del logo de SICOM
 *  (Punto de venta, Inventario, Facturación electrónica, Reportes, Multiusuario y
 *  sucursales), no un adorno genérico. Posiciones calculadas en pentágono alrededor del
 *  centro (240,240) a radio 185, para que las líneas de circuito calcen exactas. */
const CHIPS = [
  { label: 'Punto de venta', icon: Store, x: 240, y: 55, delay: '0s' },
  { label: 'Inventario', icon: Package, x: 416, y: 183, delay: '0.6s' },
  { label: 'Facturación electrónica', icon: FileText, x: 349, y: 390, delay: '1.2s' },
  { label: 'Reportes', icon: TrendingUp, x: 131, y: 390, delay: '1.8s' },
  { label: 'Multiusuario y sucursales', icon: Users, x: 64, y: 183, delay: '2.4s' },
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
      <div className="relative hidden w-1/2 overflow-hidden bg-[#0F1826] lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        {/* Resplandor ambiental de fondo, del mismo verde del logo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(47,168,74,0.20), transparent 55%)',
          }}
          aria-hidden="true"
        />

        {/* Escena animada: hexágono + líneas de circuito + chips de funciones orbitando */}
        <div className="relative h-[480px] w-[480px] motion-reduce:h-auto motion-reduce:w-auto">
          <svg
            viewBox="0 0 480 480"
            className="pointer-events-none absolute inset-0 h-full w-full motion-reduce:hidden"
            aria-hidden="true"
          >
            {CHIPS.map((chip, i) => (
              <line
                key={i}
                x1={240}
                y1={240}
                x2={chip.x}
                y2={chip.y}
                stroke="rgba(107,216,124,0.35)"
                strokeWidth={1.5}
                strokeDasharray="6 6"
                style={{
                  animation: 'sicom-flow 1.6s linear infinite',
                  animationDelay: chip.delay,
                }}
              />
            ))}
          </svg>

          {/* Hexágono central — el logo real, respirando con un pulso suave */}
          <img
            src="/branding/sicom-hexagono.png"
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2 motion-reduce:animate-none"
            style={{ animation: 'sicom-breathe 4s ease-in-out infinite' }}
          />

          {/* Chips de funciones, flotando alrededor */}
          {CHIPS.map((chip) => (
            <div
              key={chip.label}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 motion-reduce:animate-none"
              style={{
                left: chip.x,
                top: chip.y,
                animation: `sicom-appear 0.6s ease-out ${chip.delay} both, sicom-float 6s ease-in-out ${chip.delay} infinite`,
              }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#2FA84A]/30 bg-[#16233A] shadow-lg">
                <chip.icon size={18} className="text-sicom-greenLight" />
              </div>
              <span className="w-24 text-center text-[10px] font-medium leading-tight text-ink-300">
                {chip.label}
              </span>
            </div>
          ))}
        </div>

        {/* Marca y mensaje */}
        <div className="relative mt-4 text-center">
          <span className="font-display text-3xl font-bold tracking-tight">
            <span className="text-white">SIC</span>
            <span className="text-sicom-green">OM</span>
          </span>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-400">
            Sistema Integrado Comercial
          </p>
          <p className="mx-auto mt-4 max-w-sm text-sm text-ink-300">
            Control <span className="text-sicom-greenLight">inteligente</span> para impulsar el{' '}
            <span className="text-sicom-greenLight">crecimiento</span> de tu empresa.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-ink-900">SIC</span>
              <span className="text-sicom-green">OM</span>
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
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink-700">
                  Contraseña
                </label>
                <Link to="/olvide-password" className="text-xs font-medium text-ink-500 underline hover:text-ink-700">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
