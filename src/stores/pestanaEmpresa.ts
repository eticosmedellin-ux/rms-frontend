export const enPractica = window.location.pathname.endsWith('/practica.html');
const memoria = new Map<string,string>();
const almacenamientoDemo = {
  getItem: (k:string) => memoria.get(k) ?? null,
  setItem: (k:string,v:string) => { memoria.set(k,v); },
  removeItem: (k:string) => { memoria.delete(k); },
};
// La entrada desde Plataforma aísla autenticación y sucursal en la pestaña nueva.
export const pestanaEmpresa = !enPractica && (window.location.pathname === '/entrada-empresa'
  || sessionStorage.getItem('sicom-pestana-empresa') === '1');
if (pestanaEmpresa) sessionStorage.setItem('sicom-pestana-empresa','1');
export const almacenamientoPestana = () => enPractica ? almacenamientoDemo : pestanaEmpresa ? sessionStorage : localStorage;
