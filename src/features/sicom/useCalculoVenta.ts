import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
export interface LineaCalculo {productoId?:number|null;comboId?:number|null;cantidad:number;precioUnitario:number;tipoDescuentoId?:number|null}
export interface ResultadoLinea {base:number;impuesto:number;total:number;descuento:number;tipo:string;tarifa:number}
export interface ResumenVenta {subtotal:number;descuento:number;baseImponible:number;impuestos:number;total:number;modoImpuesto:string;detalles:ResultadoLinea[]}
export function agruparLineas(detalles:LineaCalculo[]):LineaCalculo[]{
 const m=new Map<string,LineaCalculo>();for(const d of detalles){const k=d.productoId!=null?`P${d.productoId}`:`C${d.comboId}`;const a=m.get(k);if(!a)m.set(k,{...d});else if(a.precioUnitario===d.precioUnitario)a.cantidad=Number((a.cantidad+d.cantidad).toFixed(2));else return detalles;}return [...m.values()];
}
export function useCalculoVenta(body:{detalles:LineaCalculo[];tipoDescuentoFacturaId?:number|null;clienteId?:number|null;puntosCanjear?:number},enabled=true,contexto:"ventas"|"restaurante"|"domicilios"="ventas"){
 return useQuery({queryKey:['calculo-venta',contexto,body],enabled:enabled&&body.detalles.length>0,retry:false,staleTime:0,refetchOnWindowFocus:false,queryFn:async({signal})=>(await apiClient.post<ResumenVenta>(contexto==='ventas'?'/ventas/calcular':`/${contexto}/calcular-venta`,body,{signal})).data});
}
