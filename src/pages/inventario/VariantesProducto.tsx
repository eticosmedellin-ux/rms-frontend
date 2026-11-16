import { useState } from 'react';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { getApiErrorMessage } from '@/api/errors';
import { useProductos,useStockSucursal } from '@/hooks/useInventario';
import { useSucursales } from '@/hooks/useSucursales';
import { useAuthStore } from '@/stores/authStore';

type Variante = {producto_id:number;producto_base_id:number;nombre:string;atributos_json?:string;talla?:string;color?:string};

function atributosDe(v: Variante): Record<string,string> {
  return v.atributos_json ? JSON.parse(v.atributos_json) :
    Object.fromEntries(Object.entries({talla:v.talla,color:v.color}).filter((par): par is [string,string]=>Boolean(par[1])));
}

export function VariantesProducto({baseId}:{baseId:number}) {
  const usuarioId = useAuthStore(s=>s.usuarioId);
  const admin = useAuthStore(s=>s.esAdministradorTotal || s.esSuperadmin);
  const qc = useQueryClient();
  const key = ['variantes-producto',usuarioId];
  const variantes = useQuery({queryKey:key,queryFn:async()=>(await apiClient.get<Variante[]>('/inventario/comercio/variantes')).data});
  const {data:productos} = useProductos();
  const {data:sucursales} = useSucursales();
  const [sede,setSede] = useState<number|null>(null);
  const sedeActual = sucursales?.find(s=>s.id===sede && s.estado)?.id ?? sucursales?.find(s=>s.estado)?.id ?? null;
  const stock = useStockSucursal(sedeActual);
  const [productoId,setProductoId] = useState('');
  const [campos,setCampos] = useState([{nombre:'',valor:''}]);
  const [error,setError] = useState('');
  const vinculadas = (variantes.data ?? []).filter(v=>v.producto_base_id===baseId);
  const guardar = useMutation({mutationFn:({id,atributos}:{id:number;atributos:Record<string,string>})=>
    apiClient.post('/inventario/comercio/variantes',{productoBaseId:baseId,productoId:id,atributos}),
    onSuccess:()=>{setProductoId('');setCampos([{nombre:'',valor:''}]);void qc.invalidateQueries({queryKey:key});}});
  function elegir(id:string) {
    guardar.reset();setError('');setProductoId(id);
    const actual = vinculadas.find(v=>v.producto_id===Number(id));
    setCampos(actual ? Object.entries(atributosDe(actual)).map(([nombre,valor])=>({nombre,valor})) : [{nombre:'',valor:''}]);
  }
  function vincular() {
    const pares=campos.map(c=>[c.nombre.trim().toLowerCase(),c.valor.trim()]);
    if(pares.some(([nombre,valor])=>!nombre||!valor)||new Set(pares.map(([nombre])=>nombre)).size!==pares.length){
      setError('Completa cada atributo con un nombre distinto y un valor.');return;
    }
    setError('');guardar.mutate({id:Number(productoId),atributos:Object.fromEntries(pares)});
  }
  return <section className="space-y-3 rounded border p-3">
    <p className="text-sm">Cada variante es un producto con código, precio y existencias propios. Vincula un producto ya guardado y describe qué lo distingue.</p>
    <label className="block text-sm">Existencias en
      <select className="input" value={sedeActual ?? ''} onChange={e=>setSede(Number(e.target.value)||null)}>
        {!sedeActual && <option value="">Sin sucursal disponible</option>}
        {sucursales?.filter(s=>s.estado).map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
      </select>
    </label>
    {variantes.isError && <p role="alert">{getApiErrorMessage(variantes.error,'No se pudieron consultar las variantes')}</p>}
    {stock.isError && <p role="alert">No se pudieron consultar las existencias.</p>}
    {vinculadas.map(v=><div key={v.producto_id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm">
      <span><strong>{v.nombre}</strong> · {Object.entries(atributosDe(v)).map(([k,x])=>`${k}: ${x}`).join(' · ')}</span>
      <span>{!stock.isSuccess ? '—' : (stock.data.find(f=>f.productoId===v.producto_id)?.stockActual ?? 0).toLocaleString('es-CO')} en stock</span>
      {admin && <button type="button" className="underline" onClick={()=>elegir(String(v.producto_id))}>Editar atributos</button>}
    </div>)}
    {admin && <>
      <label className="block text-sm">Producto variante
        <select className="input" value={productoId} onChange={e=>elegir(e.target.value)}>
          <option value="">Seleccionar producto con inventario</option>
          {productos?.filter(p=>p.id!==baseId && p.manejaInventario && !variantes.data?.some(v=>v.producto_id===p.id&&v.producto_base_id!==baseId))
            .map(p=><option key={p.id} value={p.id}>{p.nombre} · {p.codigoInterno}</option>)}
        </select>
      </label>
      {campos.map((c,i)=><div key={i} className="flex gap-2">
        <input aria-label="Nombre de atributo" className="input" placeholder="Ej. Material" maxLength={32} value={c.nombre}
          onChange={e=>setCampos(campos.map((x,j)=>j===i?{...x,nombre:e.target.value}:x))}/>
        <input aria-label="Valor de atributo" className="input" placeholder="Ej. Algodón" maxLength={60} value={c.valor}
          onChange={e=>setCampos(campos.map((x,j)=>j===i?{...x,valor:e.target.value}:x))}/>
        <button type="button" disabled={campos.length===1} className="text-xs underline" onClick={()=>setCampos(campos.filter((_,j)=>j!==i))}>Quitar</button>
      </div>)}
      <div className="flex gap-3">
        <button type="button" className="text-sm underline" disabled={campos.length>=8} onClick={()=>setCampos([...campos,{nombre:'',valor:''}])}>Añadir atributo</button>
        <button type="button" className="rounded border px-3 py-2 text-sm" disabled={!productoId || guardar.isPending || !variantes.isSuccess} onClick={vincular}>Guardar variante</button>
      </div>
      {(error || guardar.isError) && <p role="alert">{error || getApiErrorMessage(guardar.error,'No se pudo vincular la variante')}</p>}
    </>}
  </section>;
}
