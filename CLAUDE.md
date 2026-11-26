# CLAUDE.md – contexto para Claude Code

## Qué es
Generador de expedientes de contratación directa (prestación de servicios) para la **ESE Hospital Local María La Baja (Bolívar, Colombia)**. El usuario trabaja en el área de contratación y habla español: responder siempre en español.

## Cómo está armado
- `src/template.html`: HTML + CSS. Marcadores: `<!--LIBS-->` (librerías de vendor/), `/*SCRIPT*/` (código), `__MEMBRETE_SUP__`/`__MEMBRETE_INF__` (imágenes de la vista previa).
- Código en `src/`, unido en este orden y en un mismo bloque: `app.js` (formulario, compute, checks, catálogo, ajustes, guardado, diálogo Generar), `documentos.js` (texto de los 7 documentos como bloques), `exportar.js` (vista previa HTML, Word con JSZip sobre `assets/rotulo.docx`, PDF con pdfmake con `assets/membrete.jpg` de fondo), `contratistas.js` (registro por cédula), `vigencia.js` (vigencia y forma de pago: modos con botones, redacta el texto y valida), `edicion.js` (el documento sigue a la casilla que se está llenando; botón "✎ Editar" en cada dato resaltado que lleva a su casilla; alternar Formulario/Documento en celular), `inicio.js` (arranque).
- `app.js` tiene `__DATA__` (catálogo) y `__ASSETS__` (membrete, plantilla docx, fuentes en base64).
- `build.py` une todo en `dist/index.html` (~4 MB, sin dependencias externas). **Nunca editar `dist/` a mano.**
- Un documento = lista de bloques `TIT/SEC/P/PC/PI/UL/TBL/FIR/NOTA`; piezas: texto, `b()` negrilla, `x(valor,'etiqueta')`/`xb()` dato variable (si falta sale "falta: …" en rojo). La etiqueta debe estar en `FX` (documentos.js), que dice de qué casilla sale el dato: id del formulario, `cat:campo` o `aj:campo`. Los tres formatos salen de los mismos bloques.
- `tools/preparar_membrete.py` regenera `assets/` a partir del Word del rótulo del hospital (compone la marca de agua al 30 %, mide dónde terminan encabezado y pie para los márgenes).
- `tools/extraer_perfiles.py` convierte expedientes `.docx` en perfiles.
- `.github/workflows/pages.yml` publica en GitHub Pages al hacer push a `main`.

## Modelo de datos (`data/catalogo.json`)
- `general.contratante`: obligaciones del contratante (iguales para todos).
- `general.contratistaIni` y `general.contratistaFin`: obligaciones generales del contratista que van antes y después de las específicas de cada perfil.
- `perfiles[]`: `id`, `nombre`, `tipo` ("SERVICIOS PROFESIONALES" | "APOYO A LA GESTIÓN"), `supervisor` ("adm" = Subgerente Administrativa, "cie" = Subgerente Científica), `objeto`, `rubro`, `rubroNombre`, `idoneidad`, `necesidad[]`, `conveniencia[]`, `consideraciones[]`, `obligaciones[]`, `alcances[]`, `valorSug`, `mesesSug`, `vigTexto`, `pagoTexto`, `ejemplo{}`.
- `usados[]`: números de contrato ya asignados, formato `C-HLMLB-AAAAMMDD-NN`.
- `ajustes{}` (opcional): datos de la entidad (gerente, supervisoras, NIT, SMMLV…). Si existe, reemplaza los valores por defecto de `AJ` en `app.js`. Lo escribe el botón "Descargar copia".

## Reglas de negocio importantes
- La necesidad y el certificado de idoneidad **siempre** los firma la Subgerente Administrativa. Designación, notificación, cláusula de supervisión y acta de inicio usan el supervisor del perfil.
- Tope de contratación directa usado: 28 SMMLV. SMMLV 2026 = $1.750.905 (editable en Ajustes).
- Número de contrato = prefijo + fecha de suscripción (AAAAMMDD) + consecutivo de 2 dígitos.
- Valores en letras: función `pesos()`; "UN MILLÓN DE PESOS" lleva "DE" solo si el valor termina en millones exactos.
- Fechas en letras: "primero (01) del mes de septiembre del año dos mil veintiséis (2026)".
- Vigencia (`vmodo`): `meses` | `dias` (meses + vdias) | `fechas` (vini–vfin → "DESDE EL 21 DE SEPTIEMBRE HASTA EL 31 DE OCTUBRE DE 2026") | `texto` (vigt).
- Forma de pago (`pmodo`): `iguales` (ncuotas; vacío = una por mes de vigencia; debe dividir exacto) | `unico` | `varios` (`pagos` = JSON de valores; deben sumar el total) | `texto` (pagot). Si no hay modo guardado (datos viejos), se deduce: texto si hay vigt/pagot.
- Perfiles: `vigTexto`/`pagoTexto` (texto libre sugerido) o `vigSug`/`pagoSug` (sugerencia estructurada, p. ej. `{"pmodo":"varios","pagos":[1000000,2000000]}`).

## Almacenamiento (todo en localStorage del navegador)
- `contratacion-hlmlb-v1`: catálogo, ajustes y formulario en curso. "Volver al original" lo borra.
- `contratacion-hlmlb-contratistas-v1`: registro de contratistas `{cedula: {nombre,tdoc,sexo,exped,tel,correo,dir,contratos:[{num,perfil,valor,…,fsus}]}}`. Se llena al generar. "Volver al original" NO lo borra; "Descargar copia" lo incluye y "Cargar copia" lo fusiona.
- Un número de contrato ya usado es error, salvo que esté registrado para la misma cédula (reimpresión: aviso).
- No hay base de datos compartida entre computadores: para eso haría falta un servidor (GitHub Pages es estático).

## Privacidad
El repositorio en GitHub es público: los `ejemplo{}` del catálogo son datos inventados y `docs/expedientes_originales/` está en `.gitignore` (los .docx reales quedan solo en el computador del usuario). Nunca subir nombres ni cédulas reales.

## Verificación
Después de cambiar algo: `python3 build.py`, abrir `dist/index.html`, probar "Cargar ejemplo de este perfil" en varios perfiles, revisar la validación, generar PDF y Word (un archivo y separados) y revisarlos (p. ej. `soffice --headless --convert-to pdf` + `pdftoppm` para ver las páginas). LibreOffice no respeta la transparencia de la marca de agua del Word; en Microsoft Word sí sale al 30 %.
