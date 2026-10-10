import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {useAuthStore} from '@/stores/authStore';
export type Paso={id:string;boton:string;titulo:string;explicacion:string;permiso:string|null;seccion:string};
export type Modulo={id:string;nombre:string;ruta:string;pasos:Paso[]};
export type Guia={version:string;modulos:Modulo[]};
export const normalizar=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
export function coincide(texto:string,busqueda:string){const palabras=normalizar(busqueda).split(/\s+/).filter(p=>p&&!['como','que','para','una','uno','el','la','los','las','un','de','del','en','se','hacer'].includes(p));const t=normalizar(texto);return palabras.every(p=>t.includes(p)||(['pagar','pago','pagos'].includes(p)&&/pag|cobr|recaud|abon/.test(t))||(['cobrar','cobro','cobros'].includes(p)&&/cobr|recaud|pag/.test(t)));}
export function useGuia(habilitado=true){const a=useAuthStore();return useQuery({queryKey:['guia-uso',a.empresaId,a.usuarioId,a.permisos.join('|'),a.esSuperadmin,a.esAdministradorTotal],queryFn:async()=>(await apiClient.get<Guia>('/ayuda/guia')).data,enabled:habilitado,retry:false});}
export const abrirTutorial=(modulo?:string,paso?:string)=>window.dispatchEvent(new CustomEvent('sicom-abrir-tutorial',{detail:{modulo,paso}}));
