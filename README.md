# FotoClean

FotoClean es una aplicación de escritorio para encontrar fotos y videos duplicados o visualmente similares. Permite comparar los resultados, conservar las versiones de mayor calidad y gestionar los archivos seleccionados.

## Funciones

- Analiza imágenes JPG, JPEG, PNG, WEBP, GIF, BMP y AVIF.
- Analiza videos MP4, WEBM, MOV, MKV, AVI y M4V.
- Detecta duplicados exactos y archivos similares mediante hashes perceptuales.
- Ajusta el umbral de similitud y filtra los resultados.
- Recomienda conservar las versiones de mayor calidad y permite seleccionar archivos manualmente.
- Previsualiza y compara elementos de un grupo antes de actuar.
- En Windows, puede mover los archivos seleccionados a la Papelera de reciclaje.
- Permite probar la aplicación con imágenes de ejemplo.

## Requisitos

- Node.js y npm.
- Windows para ejecutar y generar la versión de escritorio con Electron.

## Instalación

```bash
npm install
```

## Desarrollo

Inicia la versión web en modo desarrollo:

```bash
npm run dev
```

Inicia la aplicación de escritorio con Electron:

```bash
npm run electron:dev
```

## Compilación

Genera los archivos de la aplicación web en `dist/`:

```bash
npm run build
```

Genera el ejecutable portable de Windows en `release/`:

```bash
npm run electron:build
```

Ejecuta las comprobaciones de Oxlint:

```bash
npm run lint
```

## Uso

1. Abre FotoClean y selecciona archivos o una carpeta con fotos y videos, o carga las imágenes de ejemplo.
2. Espera a que termine el análisis y revisa los grupos encontrados.
3. Ajusta el umbral de similitud y compara los elementos si es necesario.
4. Revisa los archivos seleccionados para eliminar. La aplicación sugiere conservar la versión de mayor calidad.
5. Confirma la acción desde la barra de acciones. En la aplicación de escritorio para Windows, los archivos se envían a la Papelera de reciclaje.

La selección y el análisis se realizan localmente en el equipo.
