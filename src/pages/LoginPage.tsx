import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, User, Store, Package, FileText, TrendingUp, Users } from 'lucide-react';
import { login } from '@/api/auth';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/authStore';
import { loginSchema, type LoginFormValues } from '@/pages/login-schema';

/** Íconos grandes y difuminados flotando en el fondo — son los mismos 5 del logo de SICOM
 *  (Punto de venta, Inventario, Facturación electrónica, Reportes, Multiusuario), no formas
 *  abstractas genéricas. Cada uno con su propia posición, tamaño y color (navy o verde,
 *  alternando como en la marca) para dar profundidad. */
const ICONOS_FONDO = [
  { Icono: Store, top: '8%', left: '10%', size: 120, color: 'text-sicom-greenLight', delay: '0s' },
  { Icono: TrendingUp, top: '62%', left: '6%', size: 100, color: 'text-[#3B6FE0]', delay: '1.5s' },
  { Icono: Package, top: '12%', left: '82%', size: 110, color: 'text-[#3B6FE0]', delay: '0.8s' },
  { Icono: FileText, top: '68%', left: '84%', size: 130, color: 'text-sicom-greenLight', delay: '2.2s' },
  { Icono: Users, top: '40%', left: '92%', size: 90, color: 'text-sicom-greenLight', delay: '3s' },
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
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, #123a5e 0%, #0c2740 35%, #081a2c 65%, #061422 100%)',
      }}
    >
      {/* Resplandores ambientales grandes, dan la sensación de profundidad del fondo tipo vidrio */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-sicom-green/20 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-16 h-[30rem] w-[30rem] rounded-full bg-[#2E6FE0]/25 blur-[110px]"
        aria-hidden="true"
      />

      {/* Hexágono real del logo, gigante y muy difuminado, como marca de agua ambiental */}
      <img
        src="/branding/sicom-hexagono.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/4 w-[26rem] rotate-12 opacity-[0.10] blur-sm motion-reduce:animate-none"
        style={{ animation: 'sicom-breathe 7s ease-in-out infinite' }}
      />

      {/* Íconos del sistema flotando suave en el fondo */}
      {ICONOS_FONDO.map(({ Icono, top, left, size, color, delay }, i) => (
        <Icono
          key={i}
          aria-hidden="true"
          size={size}
          className={`pointer-events-none absolute opacity-[0.16] ${color} motion-reduce:animate-none`}
          style={{ top, left, animation: `sicom-float 8s ease-in-out ${delay} infinite` }}
        />
      ))}

      {/* Tarjeta de login, tipo vidrio esmerilado */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.07] p-8 shadow-2xl backdrop-blur-2xl">
        <div className="text-center">
          <span className="font-display text-2xl font-bold tracking-tight">
            <span className="text-white">SIC</span>
            <span className="text-sicom-greenLight">OM</span>
          </span>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/50">
            Sistema Integrado Comercial
          </p>
        </div>

        <h2 className="mt-6 font-display text-xl font-semibold text-white">Inicia sesión</h2>
        <p className="mt-1 text-sm text-white/60">Ingresa tus credenciales para entrar al sistema.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-white/80">
              Usuario
            </label>
            <div className="relative">
              <User size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="w-full rounded-lg border border-white/15 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sicom-greenLight/60"
                placeholder="admin"
                {...register('username')}
              />
            </div>
            {errors.username && <p className="mt-1 text-xs text-red-300">{errors.username.message}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-white/80">
                Contraseña
              </label>
              <Link to="/olvide-password" className="text-xs font-medium text-white/50 underline hover:text-white/80">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/15 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sicom-greenLight/60"
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-200">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sicom-green py-2.5 text-sm font-semibold text-white shadow-lg shadow-sicom-green/20 transition-colors hover:bg-sicom-greenLight disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          ¿Todavía no tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-white underline">
            Registra tu negocio
          </Link>
        </p>
      </div>
    </div>
  );
}
