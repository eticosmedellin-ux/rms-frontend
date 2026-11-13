import {useContrasteInicio} from '@/features/apariencia/contrasteInicio';
import {useFotosPerfil} from '@/features/sicom/FotosPerfil';
import {SicomBot} from '@/features/bot/SicomBot';
import {useCatalogoAplicaciones} from '@/features/aplicaciones/api';

import BuscadorGeneral from './BuscadorGeneral';
import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {usePosStore} from '@/stores/posStore';
import {useApariencia} from '@/features/apariencia/AparienciaProvider';
import {fondo} from '@/features/apariencia/tema';
import {useQueryClient} from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function Topbar() {
  const fotos=useFotosPerfil();
  const apps=useCatalogoAplicaciones();
  const avisosApps=apps.data?.filter(a=>a.novedadDesde).length??0;
  const apariencia=useApariencia();
  const textoCabecera=useContrasteInicio(apariencia.activo?apariencia.cabecera:undefined);
  const a=useAuthStore(),sucursalId=usePosStore(x=>x.sucursalId);
  const contexto=useQuery({queryKey:['contexto-cabecera',a.empresaId,a.usuarioId],queryFn:async()=>(await apiClient.get<{sucursales:{id:number;nombre:string}[]}>('/ayuda/contexto')).data,retry:false});
  const nombreSucursal=contexto.data?.sucursales.find(s=>s.id===sucursalId)?.nombre;
  const navigate = useNavigate();const qc=useQueryClient();
  const nombreCompleto = useAuthStore((state) => state.nombreCompleto);
  const nombreEmpresa = useAuthStore((state) => state.nombreEmpresa);
  const roles = useAuthStore((state) => state.roles);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    qc.clear();logout();
    navigate('/login', { replace: true });
  }

  return (
    <header style={apariencia.activo?fondo(apariencia.cabecera):undefined} className="flex h-16 items-center justify-between gap-2 border-b border-ink-100 bg-white px-3 dark:border-ink-700 dark:bg-ink-800 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {fotos.data?.empresa&&<img src={fotos.data.empresa} alt="" className="hidden h-9 w-9 shrink-0 rounded-xl object-cover sm:block"/>}
        <div className="min-w-0 rounded-lg px-2 py-1 text-ink-800 dark:text-white" style={textoCabecera}>
          <p className="truncate text-sm font-semibold">{nombreEmpresa}</p>
          <p className="truncate text-xs">{sucursalId?`Caja: ${nombreSucursal??'Sucursal #'+sucursalId}`:'Sin sucursal de caja seleccionada'} · {roles.join(' · ')}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4"><BuscadorGeneral/>
        {a.empresaId&&a.usuarioId&&<SicomBot key={`${a.empresaId}:${a.usuarioId}`} identidad={`${a.empresaId}:${a.usuarioId}`}/>}
        {a.esAdministradorTotal&&!a.esSuperadmin&&<Link to="/aplicaciones?avisos=1" aria-label="Actualizaciones de aplicaciones" title="Actualizaciones de aplicaciones" className="relative rounded-lg border p-2 text-ink-600">
          <Bell size={17}/>{avisosApps>0&&<span className="absolute -right-1 -top-1 rounded-full bg-emerald-700 px-1 text-[10px] text-white">{avisosApps}</span>}
        </Link>}
        <div className="flex items-center gap-2 rounded-full border border-ink-100 px-2 py-1 text-ink-800 dark:text-white" style={textoCabecera} title={nombreCompleto??'Mi perfil'}>
          {fotos.data?.usuario?<img src={fotos.data.usuario} alt="" className="h-7 w-7 rounded-full object-cover"/>:<span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">{nombreCompleto?.trim().slice(0,1).toUpperCase()??'U'}</span>}
          <span className="hidden max-w-32 truncate text-sm text-current sm:inline">{nombreCompleto}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:border-danger-500 hover:text-danger-500 sm:px-3"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Cambiar perfil / salir</span>
        </button>
      </div>
    </header>
  );
}
