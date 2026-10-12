export type ArchivoPago={nombre:string;tipo:string;base64:string};
export async function archivoPago(f:File):Promise<ArchivoPago>{
 if(!['application/pdf','image/png','image/jpeg'].includes(f.type)||f.size>5*1024*1024||!f.size)throw new Error('Selecciona PDF, PNG o JPG de hasta 5 MB');
 const base64=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(new Error('No se pudo leer el archivo'));r.readAsDataURL(f);});return {nombre:f.name,tipo:f.type,base64};
}
export function solicitarSoporte(medio:string):Promise<ArchivoPago>{return new Promise((resolve,reject)=>{
 const d=document.createElement('dialog');d.className='rounded-xl border border-ink-200 p-6 shadow-xl';d.style.maxWidth='460px';
 const titulo=document.createElement('h2');titulo.className='text-lg font-semibold mb-3';titulo.textContent=`Soporte obligatorio: ${medio}`;
 const texto=document.createElement('p');texto.textContent='Adjunta el comprobante de este pago (PDF, PNG o JPG, máximo 5 MB).';texto.className='text-sm mb-4';
 const input=document.createElement('input');input.type='file';input.accept='application/pdf,image/png,image/jpeg';input.className='input';
 const error=document.createElement('p');error.className='text-red-700 text-sm';error.setAttribute('role','alert');
 const cancelar=document.createElement('button');cancelar.textContent='Cancelar cobro';cancelar.className='rounded border p-2 mt-4';
 const ok=document.createElement('button');ok.textContent='Adjuntar y continuar';ok.className='rounded bg-ink-800 text-white p-2 mt-4 ml-2';
 let completo=false;function limpiar(){d.close();d.remove();}function cancel(){if(completo)return;completo=true;limpiar();reject(new Error('Cobro cancelado: falta el soporte'));}
 cancelar.onclick=cancel;d.addEventListener('cancel',e=>{e.preventDefault();cancel();});
 ok.onclick=async()=>{if(!input.files?.[0]){error.textContent='Selecciona un archivo';return;}ok.disabled=true;try{const a=await archivoPago(input.files[0]);completo=true;limpiar();resolve(a);}catch(e){error.textContent=e instanceof Error?e.message:'Archivo inválido';ok.disabled=false;}};
 d.append(titulo,texto,input,error,cancelar,ok);document.body.append(d);d.showModal();input.focus();
});}
export async function adjuntarSoportes(datos:unknown):Promise<void>{
 if(!datos||typeof datos!=='object'||datos instanceof FormData)return;
 const r=datos as Record<string,unknown>;
 if(Array.isArray(r.pagos))for(const p of r.pagos){const a=p as Record<string,unknown>;if(['TRANSFERENCIA','TARJETA'].includes(String(a.metodoPago))&&Number(a.monto)>0&&!a.soporte)a.soporte=await solicitarSoporte(String(a.metodoPago));}
 if(r.nuevaVenta)await adjuntarSoportes(r.nuevaVenta);
}
