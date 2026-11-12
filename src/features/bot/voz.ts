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

export function useVozBot(){
 const navegador=typeof window==='undefined'?undefined:window as NavegadorVoz;
 const Motor=navegador?.SpeechRecognition??navegador?.webkitSpeechRecognition;
 const lector=navegador?.speechSynthesis;
 const puedeLeer=!!lector&&typeof SpeechSynthesisUtterance!=='undefined';
 const activo=useRef<Reconocimiento|null>(null),reproduccion=useRef<{mensaje:number;frase:SpeechSynthesisUtterance|null}|null>(null);
 const [dictado,setDictado]=useState<Dictado>('inactivo'),[leyendo,setLeyendo]=useState<number|null>(null);
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
  const partes=texto.replace(/•/g,'').match(/.{1,180}(?:\s|$)|.{1,180}/gs)?.map(p=>p.trim()).filter(Boolean)??[];
  if(!partes.length)return;
  const voces=lector.getVoices(),voz=voces.find(v=>v.lang.toLowerCase()==='es-co'&&v.localService)
   ??voces.find(v=>/^es[-_]/i.test(v.lang)&&v.localService)
   ??voces.find(v=>v.lang.toLowerCase()==='es-co')??voces.find(v=>/^es[-_]/i.test(v.lang));
  const sesion:{mensaje:number;frase:SpeechSynthesisUtterance|null}={mensaje,frase:null};
  reproduccion.current=sesion;setLeyendo(mensaje);avisar('');
  function siguiente(i:number){
   if(reproduccion.current!==sesion)return;
   if(i>=partes.length){reproduccion.current=null;setLeyendo(null);return;}
   const frase=new SpeechSynthesisUtterance(partes[i]);sesion.frase=frase;
   frase.lang=voz?.lang??'es-CO';if(voz)frase.voice=voz;
   frase.onend=()=>siguiente(i+1);
   frase.onerror=()=>{if(reproduccion.current===sesion){liberarLectura();setLeyendo(null);avisar('No se pudo leer la respuesta. Sigue disponible en pantalla.');}};
   try{lector?.speak(frase);}catch{liberarLectura();setLeyendo(null);avisar('No se pudo iniciar la lectura.');}
  }
  siguiente(0);
 }
 return {puedeDictar:!!Motor,puedeLeer,dictado,leyendo,microfono,escuchar,cancelarVoz};
}
