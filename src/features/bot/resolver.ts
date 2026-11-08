import type {Consulta} from './consultas';
import {biblioteca} from '../tutorial/practica/casos';
import type {Guia} from '../tutorial/practica/bibliotecaApi';

export const normal=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const reglas:[RegExp,string][]=[
 [/\b(cafes?|productos?|articulos?|carritos?)\b.*\b(solo era|deberia ser|me equivoque|cantidad|unidades)\b|\b(cambiar|corregir|ajustar|modificar|incorrecta)\b.*\b(cantidad|unidades)\b/,'0-3'],
 [/\b(quitar|borrar|retirar|eliminar)\b.*\b(carrito|producto de la venta)\b/,'0-4'],
 [/\b(pago mixto|dividir pago|varios medios|varios metodos|dos medios|dos metodos)\b/,'0-8'],
 [/\b(cliente duplicado|dos veces al mismo cliente|repeti un cliente)\b/,'1-3'],
 [/\b(no cuadra|no coincide|diferencia|descuadre)\b.*\b(caja|efectivo|dinero)\b|\b(caja|efectivo|dinero)\b.*\b(no cuadra|no coincide|descuadre)\b/,'2-5'],
];
const omitidas=new Set('como que hago para puedo quiero donde cual necesito saber no se un una el la los las de del en al mi me con por registrar hacer consultar ver sicom'.split(' '));
const tokens=(s:string)=>new Set(normal(s).split(' ').filter(w=>w.length>2&&!omitidas.has(w)).map(w=>w.replace(/(?:es|s)$/,'')));
export type Respuesta={texto:string;datoVivo?:boolean;fuente?:string;pendiente?:Consulta;contexto?:Consulta;opciones?:{id:string;titulo:string;nota?:string}[];sinGuia?:boolean;aclarar?:boolean};
export function resolver(pregunta:string,publicadas:Guia[],anterior=''):Respuesta{
 const q=normal(pregunta),contexto=normal(anterior+' '+pregunta);
 if(/^(hola|buenas|buenos dias|buenas tardes)( bot| sicom)?$/.test(q))return {texto:'Hola. Cuéntame qué estás intentando hacer en SICOM y buscaré una práctica que te ayude.'};
 if(/\b(cuanto vendimos|cuanto se vendio|cuanto le debo|cuanto debemos|como nos fue|cuanto vendi|cuantas unidades quedan)\b/.test(q))return {texto:'Todavía no puedo consultar los datos de tu empresa. Puedo ayudarte a encontrar la guía para revisar esa información.',sinGuia:true};
 const catalogo=biblioteca.filter(c=>c.pasos?.length).map(c=>({...c,nota:''}));
 const propias=publicadas.filter(g=>g.estado==='PUBLICADO').flatMap(g=>{
  const c=catalogo.find(x=>x.id===g.plantilla);return c?[{...c,titulo:g.titulo,nota:g.indicacion}]:[];
 });
 const convertir=(c:typeof catalogo[number])=>({id:c.id,titulo:c.titulo,nota:c.nota});
 const responder=(c:typeof catalogo[number]):Respuesta=>({
  texto:[c.nota,...(c.acciones?['Abre el ejercicio para resolver el caso con datos ficticios.']:(c.pasos??[]).map(([t],i)=>`${i+1}. ${t}`))].filter(Boolean).join('\n'),
  opciones:[convertir(c)],
 });
 const exacta=[...propias,...catalogo].find(c=>normal(c.titulo)===q);
 if(exacta)return responder(exacta);
 if(/\b(venta ya registrada|venta ya finalizada|ya la registre|ya cobre|ya facturada|ya cerrada)\b/.test(contexto)&&/\b(cantidad|carrito|producto|cobre|corrij|corrijo|rectificar)\b/.test(contexto))
  return {texto:'Si la venta ya se registró, no se corrige desde el carrito. Revisa el comprobante en Historial de ventas antes de decidir el procedimiento correspondiente.',opciones:[convertir(catalogo.find(c=>c.id==='0-9')!)]};
 if(/\b(cantidad|unidades)\b/.test(q)&&/\b(venta|carrito)\b/.test(q)&&!/\b(abierta|borrador)\b/.test(contexto)&&!anterior)return {texto:'¿La venta sigue abierta en el carrito o ya la registraste?',aclarar:true};
 const regla=reglas.find(([patron])=>patron.test(contexto));
 if(regla){const c=catalogo.find(x=>x.id===regla[1]);if(c)return responder(c);}
 const entrada=tokens(contexto);
 const candidatos=[...propias,...catalogo].map(c=>{
  const titulo=tokens(c.titulo),grupo=tokens(c.grupo);
  const coincidencias=[...entrada].filter(w=>titulo.has(w)).length;
  return {c,n:coincidencias*3+[...entrada].filter(w=>grupo.has(w)).length};
 }).filter(x=>x.n>=6).sort((a,b)=>b.n-a.n);
 const primero=candidatos[0];
 if(!primero)return {texto:'No encontré una guía que coincida con suficiente claridad. Dime el módulo y qué estabas intentando hacer. También puedes enviar la duda a soporte.',sinGuia:true};
 const segundo=candidatos.find(x=>x.c.id!==primero.c.id);
 if(segundo&&segundo.n===primero.n)return {texto:'Encontré más de una práctica posible. Elige la que corresponda o dime en qué módulo estás.',opciones:candidatos.filter(x=>x.n===primero.n).filter((x,i,a)=>a.findIndex(y=>y.c.id===x.c.id)===i).slice(0,3).map(x=>convertir(x.c)),aclarar:true};
 return responder(primero.c);
}
