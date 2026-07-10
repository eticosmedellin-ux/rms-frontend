import { apiClient } from '@/api/client';
import type { DocumentoCaja, DocumentoCajaRequest } from '@/types/pos';

export const listarDocumentosCaja = async (): Promise<DocumentoCaja[]> =>
  (await apiClient.get<DocumentoCaja[]>('/documentos-caja')).data;

export const crearDocumentoCaja = async (data: DocumentoCajaRequest): Promise<DocumentoCaja> =>
  (await apiClient.post<DocumentoCaja>('/documentos-caja', data)).data;

export const registrarImpresion = async (id: number): Promise<DocumentoCaja> =>
  (await apiClient.post<DocumentoCaja>(`/documentos-caja/${id}/registrar-impresion`)).data;
