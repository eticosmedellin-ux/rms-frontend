import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as documentosCajaApi from '@/api/documentosCaja';
import type { DocumentoCajaRequest } from '@/types/pos';

export function useDocumentosCaja() {
  return useQuery({ queryKey: ['documentos-caja'], queryFn: documentosCajaApi.listarDocumentosCaja });
}

export function useCrearDocumentoCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentoCajaRequest) => documentosCajaApi.crearDocumentoCaja(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-caja'] });
      queryClient.invalidateQueries({ queryKey: ['caja-abierta'] });
      queryClient.invalidateQueries({ queryKey: ['caja-movimientos'] });
    },
  });
}

export function useRegistrarImpresion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentosCajaApi.registrarImpresion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-caja'] }),
  });
}
