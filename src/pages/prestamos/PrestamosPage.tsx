import {OperacionPrestamos} from './OperacionPrestamos';
import {usePermisosOperacion} from '@/hooks/usePermisosOperacion';
export default function PrestamosPage(){const p=usePermisosOperacion('PRESTAMOS');return p.consultar?<OperacionPrestamos/>:<p>Tu administrador debe habilitar la consulta de préstamos y su alcance en tu rol.</p>;}
