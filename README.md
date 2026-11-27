# Software de contratación – ESE Hospital Local María La Baja

Llena automáticamente el expediente de un contrato de prestación de servicios (contratación directa) a partir de unos 12 datos, y lo entrega en **Word**, en **PDF** o directo a la **impresora**, siempre con el membrete del hospital: logo y escudo arriba, marca de agua y pie de página.

Los 7 documentos:

1. Requerimiento de necesidad
2. Estudios previos (completos: justificación, riesgos, criterios, garantías, estudio jurídico…)
3. Certificado de idoneidad
4. Designación de supervisión
5. Notificación al supervisor
6. Contrato (las 30 cláusulas completas)
7. Acta de inicio

Trae un catálogo de **28 perfiles** sacados de los expedientes reales de 2026 y un **registro de contratistas**: al digitar una cédula ya registrada, los datos de la persona se llenan solos y se ven sus contratos anteriores.

Es una sola página web. No necesita servidor: funciona abriendo el archivo con doble clic o publicada en GitHub Pages.

## Cómo usarlo

```bash
python3 build.py          # arma dist/index.html
```

Abra `dist/index.html` en Chrome o Edge. En **Nuevo contrato**:

1. Elija el perfil.
2. Digite la cédula. Si la persona ya está registrada, el resto de sus datos se llena solo.
3. Escriba el valor y elija con los botones:
   - **¿Cuánto dura?** Meses · Meses y días · Entre dos fechas · Otro texto.
   - **¿Cómo se paga?** Cuotas iguales · Un solo pago · Pagos diferentes · Otro texto.

   Debajo aparece **"Así queda en el documento: …"** con el texto ya redactado. Si las cuotas no dan exactas, o los pagos no suman el total, el programa avisa y ofrece un botón para arreglarlo.
4. Complete CDP, RP, consecutivo y fechas.
5. Pulse **Generar Word / PDF / Imprimir…** y elija:
   - qué documentos (todos o algunos);
   - cómo los quiere: **PDF**, **Word**, **Word y PDF** o **Imprimir ahora**;
   - en un solo archivo (todo seguido) o un archivo por documento (en un `.zip`).

Mientras llena el formulario, el documento de la derecha salta solo a la hoja donde sale el dato y lo resalta. Si ve un dato mal escrito en el documento, tóquelo: aparece **✎ Editar**, que lo lleva directo a la casilla para corregirlo, sea del formulario, del Catálogo o de los Ajustes. En el celular, use los botones **Formulario / Documento** de arriba.

Al generar, la persona y el contrato quedan guardados en **Contratistas**. Desde ahí se puede abrir un contrato anterior para reimprimirlo, o empezar uno nuevo con los datos de esa persona.

## Dónde quedan los datos

Todo se guarda **en el navegador del computador** donde se usa: catálogo, ajustes y contratistas. No hay una base de datos central.

- Otro computador, u otro navegador en el mismo computador, empieza vacío.
- Si se borran los datos de navegación, se pierde lo guardado.
- **Descargar copia** (pestañas Catálogo o Ajustes) baja un `.json` con todo: catálogo, ajustes y contratistas. Hágalo con frecuencia como respaldo.
- **Cargar copia** sube ese archivo. Los contratistas se suman a los que ya hay; no se borra ninguno.
- **Volver al original** deshace los cambios del catálogo y los ajustes. No borra los contratistas.
- Para dejar fijos en el programa los cambios del catálogo: reemplace `data/catalogo.json` con la copia descargada y corra `python3 build.py`.

## Publicarlo en GitHub Pages

El repositorio trae `.github/workflows/pages.yml`, que arma y publica el software cada vez que se sube un cambio a la rama `main`.

1. Cree el repositorio en GitHub y suba el proyecto.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada vez que suba un cambio a `main`, en unos minutos la página queda en `https://iner2005-debug.github.io/software-contratacion-/`.

> **Datos personales.** Este repositorio es público. Por eso los ejemplos del catálogo usan personas y cédulas **inventadas**, y los expedientes reales (`docs/expedientes_originales/`) **no se suben**: están en `.gitignore` y se guardan solo en el computador de contratación. Los contratistas registrados en el programa tampoco se suben, porque viven solo en el navegador.

## Estructura

```
software-contratacion/
├── build.py                    # une todo en dist/index.html (un solo archivo)
├── src/
│   ├── template.html           # pantalla y estilos
│   ├── app.js                  # formulario, cálculos, validación, catálogo, ajustes, guardado
│   ├── documentos.js           # TEXTO de los 7 documentos (aquí se corrige la redacción)
│   ├── exportar.js             # vista previa, Word (.docx) y PDF
│   ├── contratistas.js         # registro de contratistas por cédula
│   └── inicio.js               # arranque
├── data/catalogo.json          # obligaciones generales, 28 perfiles, números de contrato usados
├── assets/                     # membrete del hospital (rotulo.docx e imágenes) y fuente del PDF
├── vendor/                     # librerías: JSZip (Word) y pdfmake (PDF)
├── tools/
│   ├── preparar_membrete.py    # regenera assets/ si cambia el formato del hospital
│   └── extraer_perfiles.py     # lee expedientes .docx y crea perfiles nuevos
├── .github/workflows/pages.yml # publicación automática en GitHub Pages
└── docs/                       # errores encontrados en los expedientes originales (los .docx no se publican)
```

## Si cambia el membrete (rótulo) del hospital

```bash
python3 tools/preparar_membrete.py RUTA/NUEVO_FORMATO.docx
python3 build.py
```

Necesita LibreOffice, poppler-utils (`pdftoppm`) y Pillow. El Word que produce el software usa ese `.docx` como base, así que el encabezado, la marca de agua y el pie salen idénticos. El PDF usa una imagen de la misma hoja.

## Catálogo de perfiles: crear, actualizar y eliminar

En la pestaña **Catálogo de perfiles**:

- **Crear**
  - **📎 Desde un expediente en Word:** adjunte uno o varios `.docx`. El programa saca objeto, obligaciones, alcances, necesidad, conveniencia, rubro, valor, vigencia, forma de pago y supervisor, y le muestra lo que encontró antes de guardar.
  - **En blanco**, o **copia del perfil elegido**.
- **Actualizar el perfil elegido**
  - **📎 Desde un Word:** muestra lado a lado lo que hay ahora y lo que trae el documento, y usted marca qué partes reemplazar.
  - O edítelo directamente en el formulario del Catálogo: cada cambio se guarda solo.
- **Eliminar** el perfil elegido, con confirmación.

Al pulsar 📎, el programa pregunta **cómo tiene los documentos**:

- **Todo en un solo Word**: el expediente completo en un archivo. Para crear, puede elegir varios expedientes a la vez.
- **Un Word por documento**: siete casillas (Necesidad, Estudios previos, Idoneidad, Designación, Notificación, Contrato, Acta de inicio) para adjuntar cada uno por separado. Se pueden adjuntar solo los que tenga. Lo más completo sale de los Estudios previos; si faltan, el objeto, las obligaciones, los alcances, el rubro, el valor y el plazo se toman del Contrato y del Acta.

El Word se lee dentro del navegador: el documento no se sube a internet.

## Agregar perfiles desde la terminal (opcional)

```bash
python3 tools/extraer_perfiles.py carpeta_con_docx/             # revisar qué encuentra
python3 tools/extraer_perfiles.py carpeta_con_docx/ --agregar   # agregarlos al catálogo
python3 build.py
```

## Detalles de los documentos

- **Word**: letra Arial Narrow 10,5, como los expedientes originales. Se puede editar normalmente.
- **PDF**: letra Liberation Sans, de las mismas medidas que Arial. Puede tener una o dos páginas más que el Word.
- Los márgenes de arriba y de abajo se ajustaron para que el texto no tape el logo ni el pie.
- La numeración de los estudios previos quedó corrida de 1 a 17 (en los originales se repetía).

## Hoja de ruta sugerida

1. **Base de datos compartida.** Para que todos los computadores vean los mismos contratistas, se necesita un servidor, por ejemplo una pequeña app con SQLite o un servicio como Supabase. GitHub Pages solo sirve páginas.
2. **Usuarios y permisos.** Quién crea, quién revisa y quién firma.
3. **Textos editables desde la pantalla**: justificación, riesgos y cláusulas, sin tocar el código.
