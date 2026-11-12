import casos from './casosBot.json';
import {normal,type Respuesta} from './resolver';
import {entender,type Consulta,type Intencion,type Sede} from './lenguaje';

const modulos=[
 ['Dashboard','/','revisa los indicadores y confirma qué período y sucursales incluye cada cifra'],
 ['Punto de venta','/pos','revisa la operación en su caja y turno; si ya se registró, busca su comprobante en Documentos'],
 ['Descuentos','/descuentos','revisa la vigencia y las condiciones configuradas de la promoción'],
 ['Gastos','/gastos','filtra el período y revisa los comprobantes y el concepto de cada gasto'],
 ['Reportes','/reportes','elige el reporte correspondiente y verifica fecha, sede y estado antes de comparar cifras'],
 ['Alertas','/alertas','revisa la alerta en su categoría y abre el registro relacionado, si aparece'],
 ['Inventarios','/inventario','busca por código o nombre y revisa existencias y movimientos en la sede correspondiente'],
 ['Compras','/compras','identifica si corresponde a una orden, una recepción o una factura de proveedor y abre su detalle'],
 ['Restaurante','/restaurante','revisa la mesa, la comanda o el turno al que corresponde la consulta'],
 ['Citas','/servicios','abre la agenda y revisa la fecha, el servicio y el profesional de la cita'],
 ['Órdenes de trabajo','/servicios','busca la orden por número o cliente y revisa su estado y detalle'],
 ['Contabilidad','/contabilidad','revisa el comprobante, la cuenta y el período contable con los permisos correspondientes'],
 ['Préstamos','/prestamos','abre la ficha del préstamo y revisa cuotas, pagos y saldo registrado'],
 ['Domicilios','/domicilios','busca el pedido y verifica su estado, asignación y datos de entrega'],
 ['Nómina','/nomina','abre el período de nómina y revisa el registro del empleado autorizado'],
 ['Administración','/administracion','busca el usuario y revisa sus roles y sucursales asignadas'],
 ['Configuración','/configuracion','revisa el apartado de la empresa correspondiente al tema antes de modificar un parámetro'],
 ['Documentos','/documentos','busca el documento por número y revisa su estado o detalle'],
 ['Tienda de Aplicaciones','/aplicaciones','revisa las fichas disponibles y el estado de instalación'],
 ['Consultas entre módulos','/reportes','consulta cada fuente por separado con las mismas fechas y sedes antes de comparar'],
] as const;

type Caso={modulo:number;pregunta:string;tipo?:Consulta['tipo'];clave:string;extra:boolean};
export const catalogoBot:Caso[]=casos.map(([m,p,t],i)=>({modulo:Number(m),pregunta:String(p),tipo:t as Consulta['tipo']|undefined,clave:normal(String(p)),extra:i>=600}));
const indice=new Map(catalogoBot.map(c=>[c.clave,c]));
const palabras=(t:string)=>new Set(normal(t).split(' ').filter(p=>p.length>3&&!['puedo','donde','necesito','quiero','cuales','cuanto','cuantas','cuantos','cual','para','esta','este','estas','estos','tengo','tenemos','nuestro','nuestra','sicom'].includes(p)));
export function buscarCasoBot(pregunta:string,aproximada=true){
 const exacta=indice.get(normal(pregunta));if(exacta||!aproximada)return exacta;
 const entrada=palabras(pregunta);if(entrada.size<3)return;
 const candidatos=new Map<number,{caso:Caso;valor:number}>();
 for(const caso of catalogoBot){
  const otras=palabras(caso.pregunta);
  const iguales=[...entrada].filter(p=>otras.has(p)).length;
  const valor=2*iguales/(entrada.size+otras.size);
  if(iguales>=3&&valor>=0.7&&valor>(candidatos.get(caso.modulo)?.valor??0))candidatos.set(caso.modulo,{caso,valor});
 }
 const orden=[...candidatos.values()].sort((a,b)=>b.valor-a.valor);
 if(orden.length&&(!orden[1]||orden[0].valor-orden[1].valor>=0.15))return {...orden[0].caso,tipo:undefined};
}
export function consultaDelCaso(c:Caso,pregunta:string,sedes:Sede[],anterior?:Consulta){
 if(!c.tipo)return;
 const i:Intencion={tipo:c.tipo,filtro:'ninguno',contar:/^cuant[oa]s\b/.test(normal(pregunta)),ultimo:/\bultima vez\b/.test(normal(pregunta)),porMonto:false,soloFacturas:/\bfacturas\b/.test(normal(pregunta)),retomar:false,requierePeriodo:false};
 return entender(pregunta,sedes,anterior,[],undefined,undefined,i);
}
export function orientarCasoBot(c:Caso):Respuesta{
 const [nombre,fuente,pasos]=modulos[c.modulo-1];
 const guia=c.extra&&!c.tipo;
 return {texto:guia?`En ${nombre}, ${pasos}.`:`No puedo confirmar ese dato desde el chat. En ${nombre}, ${pasos}.`,fuente,sinGuia:!guia};
}
