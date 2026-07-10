import { z } from 'zod';

export const productoSchema = z.object({
  codigoInterno: z.string().min(1, 'El código interno es obligatorio'),
  codigoBarras: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  unidadMedida: z.string().optional(),
  categoriaId: z.string().optional(),
  marcaId: z.string().optional(),
  precioCompra: z.coerce.number().min(0, 'No puede ser negativo'),
  precioVenta: z.coerce.number().min(0, 'No puede ser negativo'),
  esServicio: z.boolean().optional(),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;
