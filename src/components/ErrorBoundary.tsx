import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Red de seguridad: si un error de JavaScript se escapa durante el render de
 * cualquier pantalla, en vez de dejar la app en blanco (el comportamiento por
 * defecto de React), mostramos un mensaje y un botón para recargar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Error no controlado:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 p-6 text-center">
          <h1 className="font-display text-xl font-semibold text-ink-800">Algo salió mal</h1>
          <p className="max-w-md text-sm text-ink-500">
            Ocurrió un error inesperado en esta pantalla. Intenta recargar la página; si el
            problema sigue, avísale al soporte técnico.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
