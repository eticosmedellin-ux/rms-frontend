import { useEffect } from 'react';
import { useEmpresa } from '@/hooks/useGestion';

/** Aplica (o quita) la clase `dark` en <html> según la preferencia de tema de la empresa.
 *  Cobertura actual: el esqueleto de la app (Sidebar, Topbar, fondo). Las pantallas
 *  individuales todavía no tienen estilos `dark:` propios — es un punto de partida
 *  funcional, no una cobertura completa de cada pantalla. */
export function useAplicarTema() {
  const { data: empresa } = useEmpresa();

  useEffect(() => {
    const esOscuro = empresa?.tema === 'OSCURO';
    document.documentElement.classList.toggle('dark', esOscuro);
  }, [empresa?.tema]);
}
