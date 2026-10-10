import {useApariencia} from './AparienciaProvider';
import {imagenUrl,type Tema} from './tema';
export function MarcaSicom({tema,url=imagenUrl,compacta=false}:{tema?:Tema;url?:(id:number)=>string;compacta?:boolean}){
 const actual=useApariencia(),t=tema??actual;
 if(!t.activo)return <span className="text-xl font-semibold">SICOM</span>;
 return <div className="flex items-center gap-2" style={{transform:`translate(${compacta?Math.max(-10,Math.min(10,t.logoX)):t.logoX}px,${compacta?0:t.logoY}px)`,justifyContent:compacta?'flex-start':'center'}}>{t.logoId&&<img draggable={false} alt={`Logo de ${t.nombre}`} src={url(t.logoId)} style={{width:Math.min(t.logoAncho,compacta?96:240),height:Math.min(t.logoAlto,compacta?80:160),objectFit:'contain',maxWidth:'45vw'}}/>}<span className={compacta?'min-w-0 truncate font-semibold':'text-3xl font-semibold'}>{t.nombre}</span></div>;
}
