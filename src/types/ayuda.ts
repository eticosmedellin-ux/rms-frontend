export interface OpcionAyuda {
  id: number;
  etiqueta: string;
  nodoDestinoId: number;
  orden: number;
}

export interface NodoAyuda {
  id: number;
  tipo: 'PREGUNTA' | 'RESPUESTA';
  titulo: string;
  contenido: string | null;
  videoUrl: string | null;
  esRaiz: boolean;
  opciones: OpcionAyuda[];
}

export interface NodoAyudaRequest {
  tipo: 'PREGUNTA' | 'RESPUESTA';
  titulo: string;
  contenido?: string | null;
  videoUrl?: string | null;
  esRaiz?: boolean;
}

export interface OpcionAyudaRequest {
  nodoOrigenId: number;
  nodoDestinoId: number;
  etiqueta: string;
  orden?: number;
}

export interface ConsultaSinRespuesta {
  id: number;
  empresaNombre: string;
  usuario: string;
  rutaResumen: string;
  comentarioAdicional: string | null;
  atendida: boolean;
  fecha: string;
}
