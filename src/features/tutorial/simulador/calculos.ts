export function totales(lineas:readonly {precio:number;cantidad:number}[],descuento:number){
 const subtotal=lineas.reduce((s,l)=>s+l.precio*l.cantidad,0);
 const rebaja=Math.round(subtotal*descuento/100);
 return {subtotal,rebaja,total:subtotal-rebaja};
}
export function efectivoValido(importe:string,total:number){
 const n=Number(importe);
 return Number.isInteger(n)&&n>0&&n<total;
}
