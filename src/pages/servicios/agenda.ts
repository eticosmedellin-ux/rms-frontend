import type {Cita} from '@/api/servicios';
export const bloquea=(c:Cita)=>['PROGRAMADA','CONFIRMADA','EN_CURSO'].includes(c.estado);
export const fechaHoy=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function sumarDias(d:string,n:number){const x=new Date(`${d}T12:00:00`);x.setDate(x.getDate()+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;}
export const minuto=(iso:string)=>Number(iso.slice(11,13))*60+Number(iso.slice(14,16));
export const hora=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export function cruza(c:Cita,dia:string,desde:number,duracion:number){return bloquea(c)&&c.fechaHora.slice(0,10)===dia&&minuto(c.fechaHora)<desde+duracion&&minuto(c.fechaHora)+c.duracionMinutos>desde;}
export const dinero=(n:unknown)=>Number(n??0).toLocaleString('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:2,maximumFractionDigits:2});

export function sumarMes(d:string,n:number){const x=new Date(`${d.slice(0,7)}-01T12:00:00`);x.setMonth(x.getMonth()+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-01`;}
