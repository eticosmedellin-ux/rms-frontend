import {Boxes,Store,Package,Megaphone,CalendarClock,BarChart3,Settings} from 'lucide-react';

export const iconosAplicaciones = {
 caja: {Icon:Boxes,nombre:'Caja'},
 ventas: {Icon:Store,nombre:'Ventas'},
 inventario: {Icon:Package,nombre:'Inventario'},
 marketing: {Icon:Megaphone,nombre:'Marketing'},
 servicios: {Icon:CalendarClock,nombre:'Servicios'},
 reportes: {Icon:BarChart3,nombre:'Reportes'},
 configuracion: {Icon:Settings,nombre:'Configuración'},
};
export function iconoAplicacion(codigo?:string) {
 return iconosAplicaciones[codigo as keyof typeof iconosAplicaciones]?.Icon;
}

export function LogoAplicacion({codigo,alternativo:Alternativo=Boxes,size=18,className}:{codigo?:string;alternativo?:typeof Boxes;size?:number;className?:string}){
 if(codigo?.startsWith('data:image/png;base64,'))return <img src={codigo} alt="" width={size} height={size} className={`object-contain ${className??''}`}/>;
 const Icon=iconoAplicacion(codigo)??Alternativo;
 return <Icon size={size} className={className} aria-hidden="true"/>;
}
