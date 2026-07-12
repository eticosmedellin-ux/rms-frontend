import { apiClient } from '@/api/client';
import type { NodoAyuda, NodoAyudaRequest, OpcionAyudaRequest, ConsultaSinRespuesta } from '@/types/ayuda';

export const obtenerRaizAyuda = async (): Promise<NodoAyuda> =>
  (await apiClient.get<NodoAyuda>('/ayuda/raiz')).data;

export const obtenerNodoAyuda = async (id: number): Promise<NodoAyuda> =>
  (await apiClient.get<NodoAyuda>(`/ayuda/nodo/${id}`)).data;

export const registrarConsultaSinRespuesta = async (rutaResumen: string, comentarioAdicional?: string): Promise<void> => {
  await apiClient.post('/ayuda/consulta-sin-respuesta', { rutaResumen, comentarioAdicional });
};

// --- Administración (superadmin) ---

export const listarNodosAyuda = async (): Promise<NodoAyuda[]> =>
  (await apiClient.get<NodoAyuda[]>('/plataforma/ayuda/nodos')).data;

export const crearNodoAyuda = async (data: NodoAyudaRequest): Promise<NodoAyuda> =>
  (await apiClient.post<NodoAyuda>('/plataforma/ayuda/nodos', data)).data;

export const actualizarNodoAyuda = async (id: number, data: NodoAyudaRequest): Promise<NodoAyuda> =>
  (await apiClient.put<NodoAyuda>(`/plataforma/ayuda/nodos/${id}`, data)).data;

export const eliminarNodoAyuda = async (id: number): Promise<void> => {
  await apiClient.delete(`/plataforma/ayuda/nodos/${id}`);
};

export const crearOpcionAyuda = async (data: OpcionAyudaRequest): Promise<void> => {
  await apiClient.post('/plataforma/ayuda/opciones', data);
};

export const eliminarOpcionAyuda = async (id: number): Promise<void> => {
  await apiClient.delete(`/plataforma/ayuda/opciones/${id}`);
};

export const listarConsultasSinRespuesta = async (): Promise<ConsultaSinRespuesta[]> =>
  (await apiClient.get<ConsultaSinRespuesta[]>('/plataforma/ayuda/consultas-sin-respuesta')).data;

export const marcarConsultaAtendida = async (id: number): Promise<void> => {
  await apiClient.post(`/plataforma/ayuda/consultas-sin-respuesta/${id}/atender`);
};
