import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {useAuthStore} from '@/stores/authStore';
export default function AccesoEmpresaConfig(){
 const admin=useAuthStore(s=>s.esAdministradorTotal||s.esSuperadmin);
 const datos=useQuery({queryKey:['acceso-empresa-config'],queryFn:async()=>(await apiClient.get<{cuenta?:string}>('/acceso-empresa/config')).data,enabled:admin});
 const [cuenta,setCuenta]=useState(''),[password,setPassword]=useState(''),[mensaje,setMensaje]=useState(''),[busy,setBusy]=useState(false);
 if(!admin)return null;
 return <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Cuenta de empresa y perfiles</h2><p className="my-2 text-sm">Cuenta actual: {datos.data?.cuenta||'Se crea al ingresar con el administrador actual'}. Después de ingresar, cada empleado selecciona su perfil y escribe su propia contraseña.</p><form onSubmit={async e=>{e.preventDefault();setBusy(true);setMensaje('');try{await apiClient.put('/acceso-empresa/config',{cuenta,password});setPassword('');await datos.refetch();window.dispatchEvent(new Event('sicom-config-guardada'));setMensaje('Cuenta guardada. Los dispositivos deberán volver a ingresar a la empresa.');}catch(err){setMensaje(getApiErrorMessage(err));}finally{setBusy(false);}}}><label className="block">Nueva cuenta de empresa<input className="input" value={cuenta} onChange={e=>setCuenta(e.target.value)} minLength={3} maxLength={100} pattern="[A-Za-z0-9_.@-]+" required autoComplete="off"/></label><label className="mt-3 block">Nueva contraseña de empresa<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={12} maxLength={72} required autoComplete="new-password"/></label><p className="my-2 text-sm">Mínimo 12 caracteres. Cambiar esta contraseña cierra los accesos de empresa guardados; las contraseñas personales se administran en Usuarios.</p><button disabled={busy} className="rounded bg-ink-800 px-4 py-2 text-white">{busy?'Guardando…':'Guardar cuenta de empresa'}</button></form>{mensaje&&<p role="status" className="mt-3 text-sm">{mensaje}</p>}</section>;
}
