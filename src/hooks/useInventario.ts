import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as inventarioApi from '@/api/inventario';
import type {
  AjusteInventarioRequest,
  CerrarConteoRequest,
  EntradaInventarioRequest,
  IniciarConteoRequest,
  ImportarProductosRequest,
  ProductoRequest,
  TransferenciaInventarioRequest,
} from '@/types/inventario';

export function useCategorias() {
  return useQuery({ queryKey: ['categorias'], queryFn: inventarioApi.listarCategorias });
}

export function useMarcas() {
  return useQuery({ queryKey: ['marcas'], queryFn: inventarioApi.listarMarcas });
}

export function useProductos() {
  return useQuery({ queryKey: ['productos'], queryFn: inventarioApi.listarProductos });
}

export function useCrearCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventarioApi.crearCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  });
}

export function useCrearMarca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventarioApi.crearMarca,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marcas'] }),
  });
}

export function useCrearProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductoRequest) => inventarioApi.crearProducto(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  });
}

export function useActualizarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoRequest }) =>
      inventarioApi.actualizarProducto(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  });
}

export function useActualizarImagenProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imagen }: { id: number; imagen: string }) =>
      inventarioApi.actualizarImagenProducto(id, imagen),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  });
}

export function useStockPorProducto(productoId: number | null) {
  return useQuery({
    queryKey: ['stock', 'producto', productoId],
    queryFn: () => inventarioApi.obtenerStockPorProducto(productoId as number),
    enabled: productoId !== null,
  });
}

export function useKardex(productoId: number | null, sucursalId: number | null) {
  return useQuery({
    queryKey: ['kardex', productoId, sucursalId],
    queryFn: () => inventarioApi.obtenerKardex(productoId as number, sucursalId as number),
    enabled: productoId !== null && sucursalId !== null,
  });
}

export function useRegistrarEntrada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EntradaInventarioRequest) => inventarioApi.registrarEntrada(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'producto', variables.productoId] });
      queryClient.invalidateQueries({ queryKey: ['kardex', variables.productoId] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

// --- Ajustes de inventario ---
export function useAjustes() {
  return useQuery({ queryKey: ['ajustes-inventario'], queryFn: inventarioApi.listarAjustes });
}

export function useCrearAjuste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AjusteInventarioRequest) => inventarioApi.crearAjuste(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajustes-inventario'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

// --- Transferencias entre sucursales ---
export function useTransferencias() {
  return useQuery({ queryKey: ['transferencias-inventario'], queryFn: inventarioApi.listarTransferencias });
}

export function useCrearTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransferenciaInventarioRequest) => inventarioApi.crearTransferencia(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'] }),
  });
}

export function useEnviarTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventarioApi.enviarTransferencia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useRecibirTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventarioApi.recibirTransferencia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useCancelarTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventarioApi.cancelarTransferencia(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'] }),
  });
}

// --- Conteos físicos ---
export function useConteos() {
  return useQuery({ queryKey: ['conteos-fisicos'], queryFn: inventarioApi.listarConteos });
}

export function useIniciarConteo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IniciarConteoRequest) => inventarioApi.iniciarConteo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conteos-fisicos'] }),
  });
}

export function useCerrarConteo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CerrarConteoRequest }) => inventarioApi.cerrarConteo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conteos-fisicos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['ajustes-inventario'] });
    },
  });
}

// --- Importación de productos ---
export function useImportarProductos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportarProductosRequest) => inventarioApi.importarProductos(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  });
}
