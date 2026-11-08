import {normal} from './resolver';
export type Sede={id:number;nombre:string;principal:boolean};
export type Regla={expresion:string;intencion:string};
export const tipos=['ventas','productos','pagos','ranking','inventario','agotados','bajos','valor','compras','cxp','cxc','caja','gastos','utilidad','recepciones','arqueos','clientesVentas','vendedores','rotacion'] as const;
type Tipo=typeof tipos[number];
export type Consulta={tipo:Tipo;nombre:string;desde:string;hasta:string;sucursalId?:number;comparar?:[string,string]};
const meses='enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' ');
export const hoy=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const iso=(d:Date)=>d.toISOString().slice(0,10);
const sumar=(f:string,n:number)=>{const d=new Date(f+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return iso(d);};
const construir=(y:number,m:number,d:number)=>{const s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const f=new Date(s+'T00:00:00Z');return Number.isFinite(+f)&&iso(f)===s?s:'';};
export function fechas(texto:string,actual=hoy()):[string,string]|undefined{
 const q=normal(texto),[y,m]=actual.split('-').map(Number),dia=new Date(actual+'T00:00:00Z').getUTCDay(),lunes=sumar(actual,-((dia+6)%7));
 const explicitas=[...texto.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}))?\b/g)].map(a=>a[1]?construir(+a[1],+a[2],+a[3]):construir(+(a[6]||y),+a[5],+a[4]));
 if(explicitas.length)return [explicitas[0],explicitas[1]??(/\bdesde\b/.test(q)?actual:explicitas[0])];
 const mes=meses.findIndex(n=>q.includes(n));
 const dias=q.match(/\b(?:entre|del|desde(?: el)?) (\d{1,2}) (?:y|al|hasta(?: el)?) (\d{1,2})\b/);
 const diaMes=q.match(new RegExp(`\\b(\\d{1,2}) de (${meses.join('|')})(?: de (\\d{4}))?\\b`));
 const yy=Number(q.match(/\b(20\d{2})\b/)?.[1]??y);
 if(dias)return [construir(yy,mes>=0?mes+1:m,+dias[1]),construir(yy,mes>=0?mes+1:m,+dias[2])];
 if(diaMes){const f=construir(+(diaMes[3]||y),meses.indexOf(diaMes[2])+1,+diaMes[1]);return [f,/\bdesde\b/.test(q)?actual:f];}
 if(/\b(antier|anteayer)\b/.test(q))return [sumar(actual,-2),sumar(actual,-2)];
 if(/\bayer\b/.test(q))return [sumar(actual,-1),sumar(actual,-1)];
 if(/\bhoy\b/.test(q))return [actual,actual];
 if(/semana pasada/.test(q))return [sumar(lunes,-7),sumar(lunes,-1)];
 if(/esta semana/.test(q))return [lunes,actual];
 const diasSemana='lunes martes miercoles jueves viernes sabado domingo'.split(' ');
 const ds=diasSemana.findIndex(n=>q.includes('desde el '+n)||q.includes('desde '+n));
 if(ds>=0){const f=sumar(lunes,ds);return [f>actual?sumar(f,-7):f,actual];}
 if(/mes pasado/.test(q)){const f=sumar(actual.slice(0,7)+'-01',-1);return [f.slice(0,7)+'-01',f];}
 if(/este mes/.test(q))return [actual.slice(0,7)+'-01',actual];
 if(/ano pasado/.test(q))return [`${y-1}-01-01`,`${y-1}-12-31`];
 if(/este ano/.test(q))return [`${y}-01-01`,actual];
 const ult=q.match(/ultimos? (\d+|siete|treinta) dias/);
 if(ult){const n=ult[1]==='siete'?7:ult[1]==='treinta'?30:+ult[1];return n>=1&&n<=367?[sumar(actual,1-n),actual]:['',''];}
 if(mes>=0){const mm=mes+1,anio=q.includes(String(yy))?yy:mm>m?y-1:y;return [construir(anio,mm,1),iso(new Date(Date.UTC(anio,mm,0)))];}
 if(/\b(desde|hasta|entre|semana|mes|ano|fecha|trimestre)\b/.test(q))return ['',''];
}
const reglas:[Tipo,RegExp][]=[
 ['ranking',/\b(sucursal|sede)\b.*\b(vendio mas|mas vendio|mayor venta|vendieron mas)\b/],
 ['pagos',/metodos? de pago|formas? de pago|cuanto.*(tarjeta|transferencia)/],
 ['rotacion',/rotacion|se (mueven|movieron) poco|menos vendidos/],
 ['productos',/que vendi\b|que vendimos\b|que (productos? )?(salio|salieron|se vendieron)|productos? mas vendido|producto.*mas (salio|vendio)|mas se movio|unidades vendidas|ingresos por producto/],
 ['vendedores',/ventas? por (vendedor|empleado)|vendedor.*vendio/],
 ['clientesVentas',/clientes?.*(compraron|compraron mas|mayor volumen)|clientes? de la sede|quien compro/],
 ['agotados',/agotad[oa]s?|sin existencias|sin stock/],
 ['bajos',/bajo stock|poc[oa]s? existencias|quedan poc[oa]s?|reposicion/],
 ['valor',/valor del inventario|cuanto vale el inventario/],
 ['inventario',/inventar[ií]o|existencias|stock|unidades quedan|unidades hay|cuant[oa]s? .* quedan/],
 ['cxc',/me debe|nos deben|que me deben|por cobrar|cartera|saldo.*cliente|fiado|pendiente de cobro/],
 ['cxp',/le debo|debemos|a quien.*debo|por pagar|saldo.*proveedor/],
 ['recepciones',/compras? pendientes|pendiente de recibir|mercancia pendiente/],
 ['compras',/compramos|compras?|proveedores?/],
 ['arqueos',/cierres? de caja|diferencia.*caja|arqueos?/],
 ['gastos',/gastos?|gastamos/],
 ['utilidad',/ganancias?|rentabilidad|utilidad|costos/],
 ['caja',/caja|ingresos?|egresos?|dinero entro|dinero salio|recibimos dinero/],
 ['ventas',/ventas?|vend[io]|vendimos|vendieron|vendido|factur[eo]|cuanto hice|como nos fue/],
];
const quitar=(q:string,x:string)=>(' '+q+' ').replace(' '+x+' ',' ').trim();
const cerca=(a:string,b:string)=>{if(a===b)return true;if(Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;}else{if(++n>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}}return n+a.length-i+b.length-j<=1;};
export function entender(texto:string,sedes:Sede[],anterior?:Consulta,conocimiento:Regla[]=[],actual=hoy()):{consulta?:Consulta;aclarar?:string;guia?:string}{
 const partes=texto.split(/\s+y\s+(?=[¿¡]?(?:c[oó]mo|d[oó]nde)\s+(?:hago|puedo|registro|creo|abro))/i);
 const q=normal(partes[0]),guia=partes[1];
 if(/^(como|donde|pasos para|quiero aprender)\b/.test(q)&&!/^como (nos fue|estuvieron|van|vamos|estuvo)\b/.test(q))return {};
 const continuidad=/^(y\b|en\b|ayer$|hoy$|este mes$|la semana pasada$)/.test(q);
 const candidata=conocimiento.find(r=>(' '+q+' ').includes(' '+normal(r.expresion)+' ')&&(tipos as readonly string[]).includes(r.intencion));
 let tipo=(candidata?.intencion as Tipo|undefined)??reglas.find(([,r])=>r.test(q))?.[0];
 if(!tipo&&continuidad)tipo=anterior?.tipo;
 if(!tipo&&anterior&&/cuanto entro/.test(q)&&['ventas','caja'].includes(anterior.tipo))tipo=anterior.tipo;
 if(!tipo){if(/cuanto entro|que (tengo pendiente|nos falta)/.test(q))return {aclarar:'¿Te refieres a caja, ventas, cartera o inventario?'};return {};}
 const segmentos=partes[0].split(/\s+(?:contra|versus|vs\.?|comparado con)\s+/i);
 const f=fechas(segmentos[0],actual);
 const comparar=segmentos.length===2?fechas(segmentos[1],actual):undefined;
 if(segmentos.length>1&&(!f||!comparar||!comparar[0]||!comparar[1]||comparar[0]>comparar[1]||tipo!=='ventas'))
  return {aclarar:'Para comparar ventas, indica dos períodos claros, por ejemplo «ventas de este mes contra el mes pasado».'};
 if(f&&(!f[0]||!f[1]||f[0]>f[1]))return {aclarar:'No pude identificar el período. Indica una fecha o un rango, por ejemplo «del 1 al 15 de octubre».'};
 const rango=f??(continuidad&&anterior?[anterior.desde,anterior.hasta]:tipo==='rotacion'?[sumar(actual,-29),actual]:[actual,actual]);
 const sitio=q.match(/\b(?:en (?:la |el )?|sede |sucursal |punto de trabajo )([a-z0-9 ]+)$/)?.[1]
  ?.replace(/^(?:sede |sucursal |punto de trabajo )(?:de )?/,'')
  .replace(/\b(?:hoy|ayer|antier|anteayer|durante|este mes|esta semana|como nos fue|la semana pasada|desde|del)\b.*$/,'').trim();
 const ubicacionExplicita=!!sitio&&!/^(?:todas|general|efectivo|tarjeta|transferencia|total|que|vendio|vendieron)\b/.test(sitio)&&!/^\d/.test(sitio)&&!meses.includes(sitio);
 const todas=/\b(todas las|consolidado|toda la empresa)\b/.test(q)||tipo==='ranking';
 const coincidencias=todas?[]:sedes.map(s=>{
  const n=normal(s.nombre),alias=n.replace(/^(?:sucursal|sede|punto) (?:de )?/,'');
  const exacta=(' '+q+' ').includes(' '+n+' ')||(' '+q+' ').includes(' '+alias+' ');
  return {s,p:exacta?alias.length+5:s.principal&&/\b(?:sede|sucursal) principal\b/.test(q)?4:ubicacionExplicita&&sitio&&cerca(sitio,alias)?3:0};
 }).filter(x=>x.p>0).sort((a,b)=>b.p-a.p);
 if(coincidencias.length>1)return {aclarar:'Hay más de una sucursal posible. Indica el nombre completo de la sede.'};
 if(!todas&&ubicacionExplicita&&!coincidencias.length)return {aclarar:'No identifiqué una sucursal autorizada con ese nombre. Escribe el nombre registrado de la sede.'};
 const sucursalId=todas?undefined:coincidencias[0]?.s.id??(continuidad?anterior?.sucursalId:undefined);
 let resto=coincidencias[0]?quitar(q,normal(coincidencias[0].s.nombre)):q;
 resto=resto.replace(/\b(?:en|de) (?:la )?(?:sede|sucursal) principal\b|\b(?:hoy|ayer|antier|anteayer|este mes|esta semana)\b/g,'').replace(/\ben\s*$/,'').trim();
 const n=tipo==='cxp'?resto.match(/(?:le debo a|debemos pagar a|saldo (?:del |de )?proveedor|facturas por pagar (?:de|a))\s+(.+)/)?.[1]:
 tipo==='cxc'?resto.match(/(?:me debe|nos debe|saldo (?:del |de )?cliente)\s+(.+)/)?.[1]:
 tipo==='inventario'?resto.match(/(?:stock de|existencias de|quedan de|quedan|unidades de)\s+(.+)/)?.[1]:
 tipo==='compras'?resto.match(/(?:compras (?:al proveedor|a|del proveedor|de)|compramos a)\s+(.+)/)?.[1]:undefined;
 const nombre=n?.replace(/^(?:proveedor|cliente)\s+/,'').replace(/\s+(?:en (?:la )?(?:sucursal|sede)|en|durante|desde)\s*$/,'').trim()??(continuidad&&tipo===anterior?.tipo?anterior.nombre:'');
 return {consulta:{tipo,nombre,desde:rango[0],hasta:rango[1],sucursalId,comparar},guia};
}
