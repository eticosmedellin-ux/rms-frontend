import { apiClient } from '@/api/client';
import type {
  Categoria,
  Marca,
  Producto,
  ProductoRequest,
  StockPorSucursal,
  MovimientoInventario,
  EntradaInventarioRequest,
  AjusteInventario,
  AjusteInventarioRequest,
  TransferenciaInventario,
  TransferenciaInventarioRequest,
  ConteoFisico,
  IniciarConteoRequest,
  CerrarConteoRequest,
  ImportarProductosRequest,
  ImportacionResultado,
} from '@/types/inventario';

// --- Categorías ---
export const listarCategorias = async (): Promise<Categoria[]> =>
  (await apiClient.get<Categoria[]>('/categorias')).data;

export const crearCategoria = async (data: { nombre: string; descripcion?: string }): Promise<Categoria> =>
  (await apiClient.post<Categoria>('/categorias', data)).data;

// --- Marcas ---
export const listarMarcas = async (): Promise<Marca[]> =>
  (await apiClient.get<Marca[]>('/marcas')).data;

export const crearMarca = async (data: { nombre: string; descripcion?: string }): Promise<Marca> =>
  (await apiClient.post<Marca>('/marcas', data)).data;

// --- Productos ---
export const listarProductos = async (): Promise<Producto[]> =>
  (await apiClient.get<Producto[]>('/productos')).data;

export const crearProducto = async (data: ProductoRequest): Promise<Producto> =>
  (await apiClient.post<Producto>('/productos', data)).data;

export const actualizarProducto = async (id: number, data: ProductoRequest): Promise<Producto> =>
  (await apiClient.put<Producto>(`/productos/${id}`, data)).data;

export const actualizarImagenProducto = async (id: number, imagen: string): Promise<Producto> =>
  (await apiClient.put<Producto>(`/productos/${id}/imagen`, { imagen })).data;

// --- Stock y Kardex ---
export const stockPorSucursal = async (sucursalId: number): Promise<StockPorSucursal[]> =>
  (await apiClient.get<StockPorSucursal[]>(`/inventario/stock/sucursal/${sucursalId}`)).data;
export const obtenerStockPorProducto = async (productoId: number): Promise<StockPorSucursal[]> =>
  (await apiClient.get<StockPorSucursal[]>(`/inventario/stock/producto/${productoId}`)).data;

export const obtenerKardex = async (productoId: number, sucursalId: number): Promise<MovimientoInventario[]> =>
  (
    await apiClient.get<MovimientoInventario[]>('/inventario/kardex', {
      params: { productoId, sucursalId },
    })
  ).data;

export const registrarEntrada = async (data: EntradaInventarioRequest): Promise<void> => {
  await apiClient.post('/inventario/entradas', data);
};

// --- Ajustes de inventario ---
export const listarAjustes = async (): Promise<AjusteInventario[]> =>
  (await apiClient.get<AjusteInventario[]>('/ajustes-inventario')).data;

export const crearAjuste = async (data: AjusteInventarioRequest): Promise<AjusteInventario> =>
  (await apiClient.post<AjusteInventario>('/ajustes-inventario', data)).data;

// --- Transferencias entre sucursales ---
export const listarTransferencias = async (): Promise<TransferenciaInventario[]> =>
  (await apiClient.get<TransferenciaInventario[]>('/transferencias-inventario')).data;

export const crearTransferencia = async (data: TransferenciaInventarioRequest): Promise<TransferenciaInventario> =>
  (await apiClient.post<TransferenciaInventario>('/transferencias-inventario', data)).data;

export const enviarTransferencia = async (id: number): Promise<TransferenciaInventario> =>
  (await apiClient.post<TransferenciaInventario>(`/transferencias-inventario/${id}/enviar`)).data;

export const recibirTransferencia = async (id: number): Promise<TransferenciaInventario> =>
  (await apiClient.post<TransferenciaInventario>(`/transferencias-inventario/${id}/recibir`)).data;

export const cancelarTransferencia = async (id: number): Promise<TransferenciaInventario> =>
  (await apiClient.post<TransferenciaInventario>(`/transferencias-inventario/${id}/cancelar`)).data;

// --- Conteos físicos ---
export const listarConteos = async (): Promise<ConteoFisico[]> =>
  (await apiClient.get<ConteoFisico[]>('/conteos-fisicos')).data;

export const iniciarConteo = async (data: IniciarConteoRequest): Promise<ConteoFisico> =>
  (await apiClient.post<ConteoFisico>('/conteos-fisicos', data)).data;

export const cerrarConteo = async (id: number, data: CerrarConteoRequest): Promise<ConteoFisico> =>
  (await apiClient.post<ConteoFisico>(`/conteos-fisicos/${id}/cerrar`, data)).data;

// --- Importación de productos ---
export const importarProductos = async (data: ImportarProductosRequest): Promise<ImportacionResultado> =>
  (await apiClient.post<ImportacionResultado>('/importaciones/productos', data)).data;
