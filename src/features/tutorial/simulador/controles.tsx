import {createContext,useContext,type ReactNode,type ButtonHTMLAttributes} from 'react';
import {Hand} from 'lucide-react';
export const GuiaDemo=createContext({objetivo:''});
export function Blanco({id,children,marcar=false}:{id:string;children:ReactNode;marcar?:boolean}){
 const {objetivo}=useContext(GuiaDemo),activo=objetivo.split('|').some(x=>id.split('|').includes(x));
 return <div data-demo={id} className={`relative min-w-0 ${activo?'z-10 rounded-lg ring-2 ring-emerald-500 ring-offset-2 bg-white motion-safe:animate-[pulse_2s_ease-in-out_infinite]':marcar&&objetivo?'opacity-70':''}`}>
  {children}{activo&&<span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 rounded-full bg-emerald-700 p-1 text-white shadow"><Hand size={14}/></span>}
 </div>;
}
export function Boton({id,children,principal,...rest}:ButtonHTMLAttributes<HTMLButtonElement>&{id:string;principal?:boolean}){
 return <Blanco id={id} marcar><button {...rest} type="button" className={`sicom-accion w-full ${principal?'sicom-accion-principal':''}`}>{children}</button></Blanco>;
}
export const dinero=(n:number)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
