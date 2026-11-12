import {useEffect,useRef,useState} from 'react';

type ResultadoVoz={isFinal:boolean;0?:{transcript:string}};
type Reconocimiento={
 lang:string;continuous:boolean;interimResults:boolean;
 onresult:((e:{resultIndex:number;results:ArrayLike<ResultadoVoz>})=>void)|null;
 onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;
 start():void;stop():void;abort():void;
};
type NavegadorVoz=Window & {
 SpeechRecognition?:new()=>Reconocimiento;
 webkitSpeechRecognition?:new()=>Reconocimiento;
};
type Dictado='inactivo'|'escuchando'|'procesando';
export const unirDictado=(borrador:string,fragmento:string)=>
 [borrador.trimEnd(),fragmento.trim()].filter(Boolean).join(' ').slice(0,400);

const estiloLatino=/^es(?:[-_](?!es\b)[a-z0-9]+)?$/i;
const femenina=/\b(?:sabina|dalia|elvira|monica|mónica|paulina|angelica|angélica|marisol|jimena|salome|salomé|lupe|mia|female|femenina)\b/i;
const puntuar=(v:SpeechSynthesisVoice)=>(femenina.test(v.name)?10:0)+(/^es[-_](?:mx|419)$/i.test(v.lang)?4:0)+(/natural|neural|premium|enhanced|mejorada/i.test(v.name)?2:0);
export function prepararLectura(texto:string){
 const limpio=texto.replace(/\r/g,'').replace(/^\s*•\s*/gm,'').replace(/\s*·\s*/g,', ')
  .replace(/\$\s*([\d.,]+)\s*(?:COP\b)?/g,'$1 pesos ').replace(/(\d)\s*%/g,'$1 por ciento');
 return limpio.split('\n').flatMap(linea=>{
  const partes:string[]=[];let bloque='';
  for(const palabra of linea.trim().split(/\s+/).filter(Boolean)){
   if(bloque&&bloque.length+palabra.length>220){partes.push(bloque);bloque='';}
   bloque=bloque?bloque+' '+palabra:palabra;
  }
  if(bloque)partes.push(/[.!?]$/.test(bloque)?bloque:bloque+'.');
  return partes;
 });
}

export function useVozBot(){
 const navegador=typeof window==='undefined'?undefined:window as NavegadorVoz;
 const Motor=navegador?.SpeechRecognition??navegador?.webkitSpeechRecognition;
 const lector=navegador?.speechSynthesis;
 const puedeLeer=!!lector&&typeof SpeechSynthesisUtterance!=='undefined';
 const activo=useRef<Reconocimiento|null>(null),reproduccion=useRef<{mensaje:number;frase:SpeechSynthesisUtterance|null}|null>(null);
 const [dictado,setDictado]=useState<Dictado>('inactivo'),[leyendo,setLeyendo]=useState<number|null>(null);
 const [voces,setVoces]=useState<SpeechSynthesisVoice[]>([]),[vozElegida,setVozElegida]=useState('');
 useEffect(()=>{
  if(!lector)return;
  const cargar=()=>setVoces(lector.getVoices().filter(v=>v.localService&&estiloLatino.test(v.lang)).sort((a,b)=>puntuar(b)-puntuar(a)));
  cargar();lector.addEventListener('voiceschanged',cargar);return ()=>lector.removeEventListener('voiceschanged',cargar);
 },[lector]);
 function liberarDictado(){
  const r=activo.current;activo.current=null;
  if(r){r.onend=null;r.onerror=null;r.onresult=null;try{r.abort();}catch{/* Ya se detuvo. */}}
 }
 function liberarLectura(){
  if(reproduccion.current){reproduccion.current=null;lector?.cancel();}
 }
 useEffect(()=>()=>{liberarDictado();liberarLectura();},[lector]);
 function cancelarVoz(){liberarDictado();liberarLectura();setDictado('inactivo');setLeyendo(null);}
 function microfono(escribir:(texto:string)=>void,avisar:(texto:string)=>void){
  if(activo.current){
   if(dictado!=='escuchando')return;
   setDictado('procesando');
   try{activo.current.stop();}catch{liberarDictado();setDictado('inactivo');}
   return;
  }
  if(!Motor){avisar('Este navegador no admite dictado. Puedes escribir la pregunta.');return;}
  liberarLectura();setLeyendo(null);avisar('');
  let r:Reconocimiento;
  try{r=new Motor();}catch{avisar('No se pudo preparar el micrófono. Puedes escribir la pregunta.');return;}
  activo.current=r;
  r.lang='es-CO';r.continuous=false;r.interimResults=false;
  let recibio=false,fallo=false;
  r.onresult=e=>{
   if(activo.current!==r)return;
   const texto=Array.from(e.results).slice(e.resultIndex).filter(x=>x.isFinal).map(x=>x[0]?.transcript??'').join(' ').trim();
   if(texto){recibio=true;escribir(texto);}
  };
  r.onerror=e=>{
   if(activo.current!==r)return;
   fallo=true;
   const avisos:Record<string,string>={
    'not-allowed':'El navegador bloqueó el micrófono. Revisa el permiso del sitio.',
    'service-not-allowed':'El navegador no permite usar el servicio de dictado.',
    'audio-capture':'No se encontró un micrófono disponible.',
    'no-speech':'No se detectó voz. Intenta de nuevo o escribe tu pregunta.',
    network:'El servicio de dictado no está disponible. Puedes escribir la pregunta.',
   };
   avisar(avisos[e.error]??'No se pudo completar el dictado. Puedes escribir la pregunta.');
   liberarDictado();setDictado('inactivo');
  };
  r.onend=()=>{
   if(activo.current!==r)return;
   activo.current=null;setDictado('inactivo');
   if(!recibio&&!fallo)avisar('No se obtuvo texto. Intenta de nuevo o escribe tu pregunta.');
  };
  try{r.start();setDictado('escuchando');}catch{liberarDictado();setDictado('inactivo');avisar('No se pudo iniciar el micrófono. Puedes escribir la pregunta.');}
 }
 function escuchar(mensaje:number,texto:string,avisar:(texto:string)=>void){
  if(!puedeLeer||!lector||activo.current)return;
  const detener=reproduccion.current?.mensaje===mensaje;
  liberarLectura();setLeyendo(null);
  if(detener)return;
  const partes=prepararLectura(texto);
  if(!partes.length)return;
  const voz=voces.find(v=>v.voiceURI===vozElegida)??voces[0];
  if(!voz){avisar('No hay una voz local en español latino. Instala una voz de español latino en tu equipo y vuelve a abrir SICOM.');return;}
  const sesion:{mensaje:number;frase:SpeechSynthesisUtterance|null}={mensaje,frase:null};
  reproduccion.current=sesion;setLeyendo(mensaje);avisar('');
  function siguiente(i:number){
   if(reproduccion.current!==sesion)return;
   if(i>=partes.length){reproduccion.current=null;setLeyendo(null);return;}
   const frase=new SpeechSynthesisUtterance(partes[i]);sesion.frase=frase;
   frase.lang=voz.lang;frase.voice=voz;frase.rate=0.94;frase.pitch=1;
   frase.onend=()=>siguiente(i+1);
   frase.onerror=()=>{if(reproduccion.current===sesion){liberarLectura();setLeyendo(null);avisar('No se pudo leer la respuesta. Sigue disponible en pantalla.');}};
   try{lector?.speak(frase);}catch{liberarLectura();setLeyendo(null);avisar('No se pudo iniciar la lectura.');}
  }
  siguiente(0);
 }
 return {puedeDictar:!!Motor,puedeLeer,voces,vozElegida,setVozElegida,dictado,leyendo,microfono,escuchar,cancelarVoz};
}
