import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {useAuthStore} from '@/stores/authStore';
import {CambiarPassword} from './GestionUsuarios';

const ruta='/mi-cuenta/fotos';
export function useFotosPerfil(){
 const empresa=useAuthStore(a=>a.empresaId),usuario=useAuthStore(a=>a.usuarioId);
 return useQuery({queryKey:['fotos-perfil',empresa,usuario],queryFn:async()=>(await apiClient.get<{empresa?:string;usuario?:string}>(ruta)).data,enabled:!!empresa&&!!usuario,retry:false});
}
async function prepararFoto(f:File){
 if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5_000_000)throw new Error('Elige un PNG, JPEG o WebP de máximo 5 MB.');
 const img=await createImageBitmap(f);
 try{
  const c=document.createElement('canvas');c.width=c.height=256;
  const ctx=c.getContext('2d');if(!ctx)throw new Error('No se pudo preparar la foto.');
  const lado=Math.min(img.width,img.height);
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,256,256);
  ctx.drawImage(img,(img.width-lado)/2,(img.height-lado)/2,lado,lado,0,0,256,256);
  return c.toDataURL('image/jpeg',0.85);
 }finally{img.close();}
}
export function CuentaFotos(){
 const a=useAuthStore(),qc=useQueryClient(),fotos=useFotosPerfil();
 const [perfil,setPerfil]=useState('0'),[mensaje,setMensaje]=useState(''),[ocupado,setOcupado]=useState(false);
 const admin=a.esAdministradorTotal&&!a.esSuperadmin;
 const usuarios=useQuery({queryKey:['usuarios-fotos',a.empresaId],queryFn:async()=>(await apiClient.get<{id:number;nombre:string;apellido?:string}[]>('/usuarios/gestion')).data,enabled:admin,retry:false});
 async function guardar(f?:File){
  setOcupado(true);setMensaje('');
  try{await apiClient.put(ruta+'/'+perfil,{imagen:f?await prepararFoto(f):null});await qc.invalidateQueries({queryKey:['fotos-perfil']});setMensaje(f?'Foto guardada.':'Foto retirada.');}
  catch(e){setMensaje(getApiErrorMessage(e,e instanceof Error?e.message:'No se pudo actualizar la foto.'));}finally{setOcupado(false);}
 }
 const otro=usuarios.data?.find(u=>String(u.id)===perfil&&u.id!==a.usuarioId);
 return <section className="space-y-4 rounded-2xl border bg-white p-5">
  <h3 className="text-lg font-semibold">Contraseña personal y fotos</h3>
  {a.usuarioId&&<CambiarPassword id={a.usuarioId} nombre={a.nombreCompleto??'Mi cuenta'} propia/>}
  {admin&&<><label className="block text-sm">Foto de empresa o perfil<select className="input mt-1" value={perfil} disabled={ocupado} onChange={e=>{setPerfil(e.target.value);setMensaje('');}}>
   <option value="0">Foto de la empresa</option>{usuarios.data?.map(u=><option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
  </select></label>
  {(perfil==='0'?fotos.data?.empresa:perfil===String(a.usuarioId)?fotos.data?.usuario:undefined)&&<img className="h-14 w-14 rounded-full object-cover" src={perfil==='0'?fotos.data?.empresa:fotos.data?.usuario} alt="Foto actual"/>}
  <div className="flex flex-wrap items-center gap-3"><label className="sicom-accion">Elegir foto<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" disabled={ocupado} onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void guardar(f);}}/></label>
  <button type="button" className="sicom-accion" disabled={ocupado} onClick={()=>void guardar()}>Quitar foto</button>
  {otro&&<CambiarPassword id={otro.id} nombre={otro.nombre}/>}</div></>}
  {mensaje&&<p role="status" className="text-sm">{mensaje}</p>}
 </section>;
}
