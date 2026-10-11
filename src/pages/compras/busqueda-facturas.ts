// El listado conserva el orden descendente que devuelve el servidor.
export const textoFactura=(f:{numeroFacturaProveedor:string|null;fechaEmision:string;estado:string})=>[f.numeroFacturaProveedor,f.fechaEmision,f.estado].join(' ').toLocaleLowerCase();
