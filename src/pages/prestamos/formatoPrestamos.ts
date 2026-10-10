export type Fila=Record<string,unknown>;
export const importe=(n:unknown)=>{const v=Number(n??0);return Number.isFinite(v)?v.toLocaleString('es-CO',{minimumFractionDigits:Math.abs(v-Math.round(v))>0.00001?2:0,maximumFractionDigits:2}):'—';};
export const dinero=(n:unknown)=>`$${importe(n)}`;
export const fecha=(n:unknown)=>{if(!n)return '—';const s=String(n);if(/^\d{4}-\d{2}-\d{2}$/.test(s))return `${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`;const d=new Date(s);return Number.isNaN(d.getTime())?s:d.toLocaleString('es-CO',{timeZone:'America/Bogota',hour12:false});};
const monetarios=new Set(['capital','interes','mora','total','saldoCapital','monto_principal','monto_cuota','monto_pagado','capital_pagado','interes_pagado','interes_condonado','moraPendiente','saldo','monto','por_entregar','pendiente','importe']);
export const legible=(filas:Fila[])=>filas.map(r=>({...Object.fromEntries(Object.entries(r).map(([k,v])=>[k,monetarios.has(k)&&v!=null&&/^-?\d+(\.\d+)?$/.test(String(v))?dinero(v):['fecha','fecha_cita','vence','fecha_vencimiento','vencimiento','fecha_ruta','fecha_costo'].includes(k)?fecha(v):v])),__original:r}));
// Entrada colombiana: punto para miles y coma para centavos.
export const leerImporte=(s:string)=>{if(!/^\s*\d{1,3}(\.\d{3})*(,\d{1,2})?\s*$/.test(s)&&!/^\s*\d+(,\d{1,2})?\s*$/.test(s))return NaN;return Number(s.trim().replaceAll('.','').replace(',','.'));};
