import {useEffect,useState,type CSSProperties} from 'react';
import {contraste,imagenUrl,type Fondo} from './tema';

export function textoContraste(color:string){
 return contraste(color,'#101828')>=contraste(color,'#FFFFFF')?'#101828':'#FFFFFF';
}
const hex=(rgb:number[])=>'#'+rgb.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');
export function useContrasteInicio(f?:Fondo,url=imagenUrl){
 const origen=f?.imagenId?url(f.imagenId):'';
 const color=f?.color??'#FFFFFF',velo=(f?.velo??0)/100;
 const clave=JSON.stringify([origen,color,velo]);
 const [muestra,setMuestra]=useState<{clave:string;color:string}>();
 useEffect(()=>{
  if(!origen)return;
  let vigente=true;
  const img=new Image();img.crossOrigin='anonymous';
  img.onload=()=>{
   if(!vigente)return;
   try{
    const c=document.createElement('canvas');c.width=c.height=16;
    const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)return;
    ctx.fillStyle=color;ctx.fillRect(0,0,16,16);ctx.drawImage(img,0,0,16,16);
    const p=ctx.getImageData(0,0,16,16).data,base=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
    const rgb=base.map((n,j)=>{let suma=0;for(let i=j;i<p.length;i+=4)suma+=p[i];return n*velo+suma/256*(1-velo);});
    setMuestra({clave,color:hex(rgb)});
   }catch{/* Si la imagen no se puede leer, se usa el color configurado. */}
  };
  img.src=origen;return ()=>{vigente=false;img.onload=null;};
 },[origen,clave,color,velo]);
 if(!f)return undefined;
 const tinta=textoContraste(muestra?.clave===clave?muestra.color:color);
 return {color:tinta,...(f.imagenId?{backgroundColor:tinta==='#FFFFFF'?'#18212F':'#FFFFFF'}:{})} satisfies CSSProperties;
}
