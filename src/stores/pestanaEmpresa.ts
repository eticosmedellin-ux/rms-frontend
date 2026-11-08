// La entrada desde Plataforma aísla autenticación y sucursal en la pestaña nueva.
export const pestanaEmpresa = window.location.pathname === '/entrada-empresa'
  || sessionStorage.getItem('sicom-pestana-empresa') === '1';
if (pestanaEmpresa) sessionStorage.setItem('sicom-pestana-empresa','1');
export const almacenamientoPestana = () => pestanaEmpresa ? sessionStorage : localStorage;
