import {normal} from './resolver';
export type Sede={id:number;nombre:string;principal:boolean};
export type Regla={expresion:string;intencion:string};
export const tipos=['ventas','documentos','productos','pagos','ranking','inventario','agotados','bajos','valor','compras','cxp','cxc','caja','gastos','utilidad','recepciones','arqueos','clientesVentas','vendedores','rotacion','comprasResumen','ordenesCompra','recepcionesCompra','comprasPendientes','margenProducto','margenBajo','reposicion','sugerenciaCompra'] as const;
type Tipo=typeof tipos[number];
export type Intencion={tipo:Tipo|'ninguna';filtro:'ninguno'|'sede'|'no_disponible';contar:boolean;ultimo:boolean;porMonto:boolean;soloFacturas:boolean;retomar:boolean;requierePeriodo:boolean};

export type Consulta={tipo:Tipo;nombre:string;desde:string;hasta:string;sucursalId?:number;comparar?:[string,string];soloFacturas?:boolean;contar?:boolean;ultimo?:boolean;porMonto?:boolean};
const meses='enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' ');
// Corrige errores frecuentes sin alterar nombres de sedes ni fechas numéricas.
const corregir=(t:string)=>t.replace(/\b(?:ocrubre|octurbe|octube)\b/gi,'octubre').replace(/\busuarui\b/gi,'usuario');
export function consultaPublica(t:string){
 const q=normal(t);
 return /\b(?:para que sirve|que efectos|efectos secundarios|contraindicaciones|como funciona|que significa|que diferencia|cual es compatible|como se conserva|cual se usa|que .* sirve para)\b/.test(q)&&
 /\b(?:acetaminofen|paracetamol|ibuprofeno|minoxidil|medicamentos?|farmacos?|brocas?|cemento|pinturas?|procesadores?|ddr4|ddr5|aceite|bateria|motocicleta|leche|alimentos?|hialuronico|cosmeticos?)\b/.test(q);
}
export function pedirAlcance(t:string){
 return /\b(?:cual(?:es)? (?:sucursal(?:es)?|sedes?)|que (?:sucursal(?:es)?|sedes?)|de donde (?:sale|salio)|inclu(?:ye|iste) (?:las )?(?:sedes|sucursales))\b/.test(normal(t));
}
export const hoy=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const iso=(d:Date)=>d.toISOString().slice(0,10);
const sumar=(f:string,n:number)=>{const d=new Date(f+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return iso(d);};
const construir=(y:number,m:number,d:number)=>{const s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const f=new Date(s+'T00:00:00Z');return Number.isFinite(+f)&&iso(f)===s?s:'';};
export function fechas(texto:string,actual=hoy()):[string,string]|undefined{
 texto=corregir(texto);
 const q=normal(texto),[y,m]=actual.split('-').map(Number),dia=new Date(actual+'T00:00:00Z').getUTCDay(),lunes=sumar(actual,-((dia+6)%7));
 const explicitas=[...texto.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}))?\b/g)].map(a=>a[1]?construir(+a[1],+a[2],+a[3]):construir(+(a[6]||y),+a[5],+a[4]));
 if(explicitas.length)return [explicitas[0],explicitas[1]??(/\bdesde\b/.test(q)?actual:explicitas[0])];
 const mes=meses.findIndex(n=>q.split(' ').includes(n));
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
 ['documentos',/documentos? (?:de )?ventas?|(?:cuantas?|cantidad de|numero de|total de|cuantos) facturas?(?: de venta)?\b(?!.*(?:por pagar|por cobrar|proveedor|compras?))/],
 ['ranking',/\b(sucursal|sede)\b.*\b(vendio mas|mas vendio|mayor venta|vendieron mas)\b/],
 ['pagos',/(?:metodos?|medios?|formas?|ingresos?) de pago|pagos?.*mas (?:usad[oa]s?|utilizad[oa]s?|frecuentes?|comun(?:es)?)|(?:como|con que) (?:me |nos )?pag(?:an|aron) mas|cuanto.*(tarjeta|transferencia)/],
 ['margenBajo',/\b(?:poc[oa] (?:margen|ganancia|rentabilidad)|margen bajo|bajo margen|ganancia baja|baja rentabilidad|poca utilidad|perdida por producto)\b/],
 ['margenProducto',/\b(?:margen|rentabilidad|ganancia|utilidad) (?:brut[oa] )?(?:por|de los) (?:cada )?productos?\b|\bproductos?\b.*\b(?:margen|rentabilidad|ganancia bruta)\b/],
 ['rotacion',/rotacion|se (mueven|movieron) poco|menos vendidos/],
 ['productos',/que vendi\b|que vendimos\b|que (productos? )?(salio|salieron|se vendieron)|productos? mas vendido|producto.*mas (salio|vendio)|mas se movio|unidades vendidas|ingresos por producto/],
 ['vendedores',/ventas? por (vendedor|empleado)|vendedor.*vendio/],
 ['clientesVentas',/clientes?.*(compraron|compraron mas|mayor volumen)|clientes? de la sede|quien compro/],
 ['sugerenciaCompra',/\b(?:cuanto|cuantas? unidades) (?:debo|deberia|tengo que|conviene) (?:pedir|reponer|comprar)\b|\bcantidad sugerida (?:de compra|para pedir)\b/],
 ['reposicion',/\b(?:que (?:debo|toca|necesito|hay que|conviene) (?:reponer|resurtir)|(?:productos?|articulos?) (?:debo |hay que |necesito )?(?:reponer|resurtir)|sugerencias? de reposicion|prioridad(?:es)? de reposicion|riesgo de agotarse|por agotarse|se van a agotar|reponer inventario)\b/],
 ['agotados',/agotad[oa]s?|sin existencias|sin stock/],
 ['bajos',/bajo stock|poc[oa]s? existencias|quedan poc[oa]s?|reposicion/],
 ['valor',/valor (?:del|de) inventario|cuanto vale (?:el |mi )?inventario|(?:dinero|plata|capital|valor|costos?).*\b(?:inventario|mercancia|stock)\b/],
 ['inventario',/inventar[ií]o|existencias|stock|unidades quedan|unidades hay|cuant[oa]s? .* quedan/],
 ['cxc',/me debe|nos deben|que me deben|por cobrar|cartera|saldo.*cliente|fiado|pendiente de cobro/],
 ['cxp',/le debo|debemos|a quien.*debo|por pagar|saldo.*proveedor/],
 ['comprasPendientes',/\b(?:ordenes?|compras?)\b.*\bpendientes? (?:de recibir|por recibir)\b|\bcuantas?\b.*\bpendientes? (?:de recibir|por recibir)\b/],
 ['recepcionesCompra',/\brecepciones?(?: de compras?| de mercancia)?\b|\b(?:ordenes?|compras?)\b.*\b(?:recibi|recibimos)\b/],
 ['ordenesCompra',/\borden(?:es)? de compras?\b|\bcuantas? ordenes (?:hice|creamos|registre|enviamos)\b/],
 ['comprasResumen',/\b(?:cuantas? compras?|numero de compras|cantidad de compras|conteo de compras)\b(?!.*\b(?:facturas?|proveedores?)\b)/],
 ['recepciones',/compras? pendientes|pendiente de recibir|mercancia pendiente/],
 ['compras',/compramos|compras?|proveedores?/],
 ['arqueos',/cierres? de caja|cerr(?:ar|o|aron) (?:la )?caja|dejo cerrada (?:la )?caja|diferencia.*caja|arqueos?/],
 ['gastos',/gastos?|gastamos/],
 ['utilidad',/ganancias?|rentabilidad|utilidad|costos/],
 ['caja',/caja|ingresos?|egresos?|dinero entro|dinero salio|recibimos dinero/],
 ['ventas',/ventas?|vend[io]|vendimos|vendieron|vendido|factur[eo]|cuanto hice|como nos fue/],
];
const quitar=(q:string,x:string)=>(' '+q+' ').replace(' '+x+' ',' ').trim();
const cerca=(a:string,b:string)=>{if(a===b)return true;if(Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;}else{if(++n>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}}return n+a.length-i+b.length-j<=1;};
export function entender(texto:string,sedes:Sede[],anterior?:Consulta,conocimiento:Regla[]=[],actual=hoy(),periodoPendiente?:[string,string],forzada?:Intencion):{periodoPendiente?:[string,string];consulta?:Consulta;aclarar?:string;guia?:string;pendiente?:Consulta}{
 texto=corregir(texto);
 if(consultaPublica(texto))return {};
 const partes=texto.split(/\s+y\s+(?=[¿¡]?(?:c[oó]mo|d[oó]nde)\s+(?:hago|puedo|registro|creo|abro))/i);
 const q=normal(partes[0]),guia=partes[1];
 if(!forzada&&/^(como|donde|pasos para|quiero aprender|quiero crear|quiero registrar)\b/.test(q)&&!/^como (nos fue|estuvieron|van|vamos|estuvo|nos pagaron|nos pagan|me pagan|me pagaron)\b/.test(q))return {};
 const alias=(n:string)=>normal(n).replace(/^(?:sucursal|sede|punto) (?:de )?/,'');
 const periodoSuelo=!!periodoPendiente&&!/\b(?:hoy|ayer|mes|semana|ano)\b/.test(q);
 const sedeBreve=alias(q.replace(/^(?:y )?(?:solo |solamente |unicamente )?(?:en (?:la |el )?)?/, ''));
 const filtroBreve=!!anterior&&/^(?:y )?(?:solo|solamente|unicamente|sucursal|sede)\b/.test(q)&&!!sedeBreve;
 const sedeSola=!!sedeBreve&&sedes.some(s=>cerca(sedeBreve,alias(s.nombre)));
 const reintento=/^(?:reintenta(?:r)?|intenta de nuevo|vuelve a intentar|repite(?: la consulta)?)$/.test(q);
 const fCorta=fechas(partes[0],actual);
 const continuidad=!!forzada?.retomar||/^(y\b|en\b|ayer$|hoy$|este mes$|la semana pasada$|cuantas?$)/.test(q)||!!anterior&&(reintento||filtroBreve||sedeSola||!!fCorta&&q.split(' ').length<=6);
 const candidata=conocimiento.find(r=>(' '+q+' ').includes(' '+normal(r.expresion)+' ')&&(tipos as readonly string[]).includes(r.intencion));
 let tipo=(forzada?.tipo!=='ninguna'?forzada?.tipo:undefined)??(candidata?.intencion as Tipo|undefined)??reglas.find(([,r])=>r.test(q))?.[0];
 if(!tipo&&anterior&&['compras','comprasResumen','ordenesCompra','recepcionesCompra','comprasPendientes','recepciones'].includes(anterior.tipo)){
  if(/\b(?:cuantas? )?(?:quedaron|siguen|estan) pendientes\b/.test(q))tipo='comprasPendientes';
  else if(/\bcuantas? (?:se recibieron|recibi|recibimos)\b/.test(q))tipo='recepcionesCompra';
  else if(/^(?:y )?(?:las )?facturas(?: de compra)?$/.test(q))tipo='compras';
 }
 if(!tipo&&continuidad)tipo=anterior?.tipo;
 if(tipo===anterior?.tipo&&reintento)return {consulta:anterior};
 if(!tipo&&anterior&&/cuanto entro/.test(q)&&['ventas','caja'].includes(anterior.tipo))tipo=anterior.tipo;
 if(!tipo){if(fCorta?.[0])return {periodoPendiente:fCorta,aclarar:`Entendí el período ${fCorta[0]} a ${fCorta[1]}. ¿Qué quieres consultar: ventas, compras o caja?`};if(/cuanto entro|que (tengo pendiente|nos falta)/.test(q))return {aclarar:'¿Te refieres a caja, ventas, cartera o inventario?'};return {};}
 if(['margenBajo','margenProducto'].includes(tipo)&&/%|\bpor ciento\b|\b(?:producto llamado|producto con codigo|margen del producto)\b/i.test(texto))
  return {aclarar:'Este análisis usa un umbral fijo de margen menor al 15 % para detectar margen bajo. Aún no admite umbrales personalizados ni un filtro por producto.'};
 const segmentos=partes[0].split(/\s+(?:contra|versus|vs\.?|comparado con)\s+/i);
 const f=fechas(segmentos[0],actual);
 const comparar=segmentos.length===2?fechas(segmentos[1],actual):undefined;
 if(segmentos.length>1&&(!f||!comparar||!comparar[0]||!comparar[1]||comparar[0]>comparar[1]||tipo!=='ventas'))
  return {aclarar:'Para comparar ventas, indica dos períodos claros, por ejemplo «ventas de este mes contra el mes pasado».'};
 if(f&&(!f[0]||!f[1]||f[0]>f[1]))return {aclarar:'No pude identificar el período. Indica una fecha o un rango, por ejemplo «del 1 al 15 de octubre».'};
 const ultimo=tipo==='arqueos'&&(forzada?.ultimo||/\b(?:ultim[oa]|reciente|mas reciente)\b/.test(q)||continuidad&&anterior?.ultimo);
 const grupoCompra=['compras','comprasResumen','ordenesCompra','recepcionesCompra','comprasPendientes'];
 const retomaCompra=!!anterior&&grupoCompra.includes(tipo)&&grupoCompra.includes(anterior.tipo)&&/^(?:y |cuantas? (?:recibi|recibimos|se recibieron|quedaron|siguen|estan)|facturas)/.test(q);
 const sugerencia=tipo==='sugerenciaCompra';
 const retomaDemanda=sugerencia&&['reposicion','sugerenciaCompra'].includes(anterior?.tipo??'');
 if(sugerencia&&/\b(?:para|cubrir|cobertura de) (\d+) dias\b/.test(q)&&!/\b(?:para|cubrir|cobertura de) 14 dias\b/.test(q))return {aclarar:'La sugerencia usa 14 días de cobertura. Por ahora no admite otro plazo.'};
 const rango=f??(periodoSuelo?periodoPendiente:undefined)??((retomaDemanda||continuidad&&!sugerencia||retomaCompra)&&anterior?[anterior.desde,anterior.hasta]:(tipo==='rotacion'||tipo==='reposicion'||sugerencia||ultimo)?[sumar(actual,-29),actual]:tipo==='pagos'&&!f?[actual.slice(0,7)+'-01',actual]:(tipo==='documentos'||grupoCompra.includes(tipo)||tipo==='margenProducto'||tipo==='margenBajo')?[actual.slice(0,7)+'-01',actual]:[actual,actual]);
 const sitio=q.match(/\b(?:en (?:la |el )?|sede |sucursal |punto de trabajo )([a-z0-9 ]+)$/)?.[1]
  ?.replace(/^(?:sede |sucursal |punto de trabajo )(?:de )?/,'')
  .replace(/\b(?:hoy|ayer|antier|anteayer|durante|este mes|esta semana|como nos fue|la semana pasada|desde|del)\b.*$/,'').trim()??(filtroBreve?sedeBreve:undefined);
 const sitioTemporal=!!sitio&&(meses.some(m=>new RegExp(`^(?:el |la )?(?:mes de )?${m}(?: |$)`).test(sitio))||
  /^(?:el |la )?(?:mes pasado|ano pasado|este ano|ultimos |semana pasada|periodo )/.test(sitio));
 const ubicacionExplicita=!!sitio&&!sitioTemporal&&!/^(?:todas|general|efectivo|tarjeta|transferencia|total|riesgo|que|cerrar|cerrarse|abrir|vendio|vendieron|inventario|stock|mercancia|caja|ventas|compras|cartera|documentos|facturas)\b/.test(sitio)&&!/^\d/.test(sitio)&&!meses.includes(sitio);
 const todas=/\b(todas las|consolidado|toda la empresa)\b/.test(q)||tipo==='ranking';
 const coincidencias=todas?[]:sedes.map(s=>{
  const n=normal(s.nombre),corto=alias(s.nombre);
  const exacta=(' '+q+' ').includes(' '+n+' ')||(' '+q+' ').includes(' '+corto+' ');
  return {s,p:exacta?corto.length+5:s.principal&&/\b(?:sede|sucursal) principal\b/.test(q)?4:(ubicacionExplicita&&sitio&&cerca(sitio,corto)||sedeSola&&cerca(sedeBreve,corto))?3:0};
 }).filter(x=>x.p>0).sort((a,b)=>b.p-a.p);
 if(coincidencias.length>1)return {aclarar:'Hay más de una sucursal posible: '+coincidencias.map(x=>x.s.nombre).join(', ')+'. Indica el nombre completo.',pendiente:{tipo,nombre:anterior?.nombre??'',desde:rango[0],hasta:rango[1],ultimo,contar:forzada?.contar||retomaCompra||/\b(?:cuantos?|cuantas?|cantidad)\b/.test(q)||anterior?.contar}};
 const sedeDesconocida=!todas&&ubicacionExplicita&&!coincidencias.length;
 const mensajeSede='No encontré esa sede entre las que puedes consultar.'+(sedes.length?' Puedes responder con: '+sedes.map(s=>s.nombre).join(', ')+'.':'');
 const sucursalId=todas?undefined:coincidencias[0]?.s.id??((continuidad||retomaCompra||sugerencia)?anterior?.sucursalId:undefined);
 let resto=coincidencias[0]?quitar(q,normal(coincidencias[0].s.nombre)):q;
 resto=resto.replace(/\b(?:en|de) (?:la )?(?:sede|sucursal) principal\b|\b(?:hoy|ayer|antier|anteayer|este mes|esta semana)\b/g,'').replace(/\ben\s*$/,'').trim();
 const n=tipo==='cxp'?resto.match(/(?:le debo a|debemos pagar a|saldo (?:del |de )?proveedor|facturas por pagar (?:de|a))\s+(.+)/)?.[1]:
 tipo==='cxc'?resto.match(/(?:me debe|nos debe|saldo (?:del |de )?cliente)\s+(.+)/)?.[1]:
 tipo==='inventario'?resto.match(/(?:stock de|existencias de|quedan de|quedan|unidades de)\s+(.+)/)?.[1]:
 tipo==='compras'?resto.match(/(?:compras (?:al proveedor|a|del proveedor|de)|compramos a)\s+(.+)/)?.[1]:undefined;
 const nombre=n?.replace(/^(?:proveedor|cliente)\s+/,'').replace(/\s+(?:en (?:la )?(?:sucursal|sede)|en|durante|desde)\s*$/,'').trim()??(continuidad&&tipo===anterior?.tipo?anterior.nombre:'');
 const consulta={tipo,nombre,desde:rango[0],hasta:rango[1],sucursalId,comparar,ultimo,porMonto:tipo==='pagos'&&(forzada?.porMonto||/por (?:monto|valor)|mayor monto/.test(q)||continuidad&&!/por (?:uso|frecuencia|cantidad)/.test(q)&&anterior?.porMonto),
  soloFacturas:tipo==='documentos'&&(forzada?.soloFacturas||/\bfacturas?\b/.test(q)||continuidad&&anterior?.soloFacturas),
  contar:forzada?.contar||retomaCompra||/\b(?:cuantos?|cuantas?|cantidad|numero de)\b/.test(q)||continuidad&&anterior?.contar};
 return sedeDesconocida?{aclarar:mensajeSede,pendiente:consulta}:{consulta,guia};
}

export function aplicarIntencion(i:Intencion,q:string,sedes:Sede[],anterior?:Consulta,periodoPendiente?:[string,string],actual=hoy()){
 if(i.tipo==='ninguna'||!(tipos as readonly string[]).includes(i.tipo)||!['ninguno','sede','no_disponible'].includes(i.filtro)||i.retomar&&i.tipo!==anterior?.tipo)return {};
 if(i.filtro==='no_disponible')return {aclarar:'Entendí el tema, pero el bot no puede aplicar ese filtro o cruce. Puedes pedir un total general o revisar el detalle en Reportes.'};
 if(i.requierePeriodo&&!fechas(q,actual)?.[0]&&!periodoPendiente)return {aclarar:'Entendí qué dato buscas. Escribe el período con un mes o dos fechas, por ejemplo «junio» o «del 1 al 15 de junio».'};
 const resultado=entender(q,sedes,i.retomar?anterior:undefined,[],actual,periodoPendiente,i);
 if(i.filtro==='sede'&&resultado.consulta?.sucursalId==null&&!resultado.aclarar){
  return {aclarar:'Indica una sucursal autorizada para que pueda consultar ese dato.',pendiente:resultado.consulta};
 }
 return resultado;
}
