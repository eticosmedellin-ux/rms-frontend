import { useState } from 'react';
import { UsuariosTab } from '@/pages/administracion/UsuariosTab';
import { RolesTab } from '@/pages/administracion/RolesTab';
import { SucursalesTab } from '@/pages/administracion/SucursalesTab';
import { AuditoriaTab } from '@/pages/administracion/AuditoriaTab';
import { HistorialAccesoTab } from '@/pages/administracion/HistorialAccesoTab';

const TABS = [
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'roles', label: 'Roles y permisos' },
  { id: 'sucursales', label: 'Sucursales' },
  { id: 'auditoria', label: 'Auditoría' },
  { id: 'accesos', label: 'Historial de accesos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdministracionPage() {
  const [tab, setTab] = useState<TabId>('usuarios');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Administración</h1>
      <p className="mt-1 text-sm text-ink-400">
        Usuarios (empleados), roles y permisos, sucursales, auditoría y accesos.
      </p>

      <div className="mt-5 flex gap-1 border-b border-ink-100">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'usuarios' && <UsuariosTab />}
        {tab === 'roles' && <RolesTab />}
        {tab === 'sucursales' && <SucursalesTab />}
        {tab === 'auditoria' && <AuditoriaTab />}
        {tab === 'accesos' && <HistorialAccesoTab />}
      </div>
    </div>
  );
}
