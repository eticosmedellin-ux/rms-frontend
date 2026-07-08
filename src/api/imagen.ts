/**
 * Redimensiona una imagen (típicamente una foto de celular, que puede pesar varios MB)
 * a un ancho máximo razonable para un catálogo de productos, y la comprime a JPEG.
 * Devuelve un data URL base64 listo para guardar/mostrar.
 */
export function comprimirImagen(file: File, anchoMaximo = 640, calidad = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
      img.onload = () => {
        const escala = Math.min(1, anchoMaximo / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * escala;
        canvas.height = img.height * escala;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.src = lector.result as string;
    };
    lector.readAsDataURL(file);
  });
}
