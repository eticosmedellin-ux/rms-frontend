import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import { useSearchParams } from 'react-router-dom';
import { useMenuPublico } from '@/hooks/useMenu';

export default function MenuPublicoPage() {
  const [searchParams] = useSearchParams();
  const sucursalParam = searchParams.get('sucursal');
  const sucursalId = sucursalParam ? Number(sucursalParam) : null;
  const { data: archivos, isLoading, isError } = useMenuPublico(sucursalId);

  const platos=useQuery({queryKey:['menu-publico-productos',sucursalId],queryFn:async()=>(await apiClient.get<{id:number;tipo:string;nombre:string;precio:number;imagen:string|null;disponible:boolean}[]>('/restaurante/menu/publico',{params:{sucursalId,productos:true}})).data,enabled:!!sucursalId,refetchInterval:30000});

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-2xl font-bold text-ink-800">Menú</h1>

        {platos.isError&&<p role="alert" className="mt-4 text-center">No se pudo consultar la disponibilidad. Consulta con tu mesero.</p>}
        {!!platos.data?.length&&<div className="mt-6 grid gap-4 sm:grid-cols-2">{platos.data.map(p=><article key={`${p.tipo}-${p.id}`} className={`rounded-xl border bg-white p-4 ${p.disponible?'':'opacity-60'}`}>{p.imagen&&<img className="mb-3 h-40 w-full rounded-lg object-cover" src={p.imagen} alt={p.nombre}/>}<h2 className="font-semibold">{p.nombre}</h2><p>{Number(p.precio).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</p><p className="text-sm">{p.disponible?'Disponible':'Agotado'}</p></article>)}</div>}
        {!sucursalId ? (
          <p className="mt-8 text-center text-sm text-ink-400">Enlace de menú inválido — falta indicar el negocio.</p>
        ) : isLoading ? (
          <p className="mt-8 text-center text-sm text-ink-400">Cargando menú...</p>
        ) : isError || !archivos || archivos.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-400">
            {platos.data?.length?'':'Consulta los platos disponibles con tu mesero.'}
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {archivos.map((a) =>
              a.tipoArchivo === 'PDF' ? (
                <embed key={a.id} src={a.contenido} type="application/pdf" className="h-[80vh] w-full rounded-xl border border-ink-100 shadow-card" />
              ) : (
                <img key={a.id} src={a.contenido} alt={a.nombre} className="w-full rounded-xl border border-ink-100 shadow-card" />
              )
            )}
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-ink-300">Generado con SICOM — Sistema Integrado Comercial</p>
      </div>
    </div>
  );
}
