#!/usr/bin/env python3
"""Arma dist/index.html: un solo archivo con todo adentro.

Une src/template.html, el código de src/*.js, el catálogo (data/catalogo.json),
el membrete del hospital (assets/) y las librerías para Word y PDF (vendor/).

Uso:
    python3 build.py

El resultado funciona sin internet (salvo las fuentes de la pantalla, que
tienen respaldo) y se puede abrir con doble clic o publicar en GitHub Pages.
"""
import base64
import json
import os
import re
from pathlib import Path

RAIZ = Path(__file__).parent
SRC = RAIZ / "src"
# Orden en que se unen los archivos de código (todos comparten el mismo bloque).
CODIGO = ["app.js", "documentos.js", "exportar.js", "contratistas.js", "vigencia.js", "importar.js", "edicion.js", "inicio.js"]
LIBRERIAS = ["vendor/jszip.min.js", "vendor/pdfmake.min.js"]


def b64(ruta):
    return base64.b64encode((RAIZ / ruta).read_bytes()).decode()


def js_seguro(texto):
    # Que ningún texto pueda cerrar la etiqueta <script> por accidente.
    return texto.replace("</", "<\\/")


plantilla = (SRC / "template.html").read_text(encoding="utf-8")
app = "\n".join(f"/* ---- {n} ---- */\n" + (SRC / n).read_text(encoding="utf-8") for n in CODIGO)
datos = json.loads((RAIZ / "data" / "catalogo.json").read_text(encoding="utf-8"))
membrete = json.loads((RAIZ / "assets" / "membrete.json").read_text(encoding="utf-8"))
assets = {
    "membrete": membrete,
    "rotulo": b64("assets/rotulo.docx"),
    "fondo": b64("assets/membrete.jpg"),
    "fuenteR": b64("assets/fonts/LiberationSans-Regular.ttf"),
    "fuenteB": b64("assets/fonts/LiberationSans-Bold.ttf"),
}
img_sup = "data:image/png;base64," + b64("assets/membrete-sup.png")
img_inf = "data:image/png;base64," + b64("assets/membrete-inf.png")

for marca, donde in [("__DATA__", app), ("__ASSETS__", app), ("/*SCRIPT*/", plantilla), ("<!--LIBS-->", plantilla),
                     ("__MEMBRETE_SUP__", plantilla), ("__MEMBRETE_INF__", plantilla)]:
    if marca not in donde:
        raise SystemExit(f"Falta el marcador {marca}")

libs = "\n".join(
    "<script>\n" + re.sub(r"//# sourceMappingURL=.*", "", (RAIZ / l).read_text(encoding="utf-8")) + "\n</script>"
    for l in LIBRERIAS)
codigo = app.replace("__DATA__", js_seguro(json.dumps(datos, ensure_ascii=False, separators=(",", ":")))) \
            .replace("__ASSETS__", json.dumps(assets, separators=(",", ":")))
# Dirección pública de la página: en GitHub Actions sale del nombre real del
# repositorio, así que si se renombra el repositorio se actualiza sola.
dueno, repo = os.environ.get("GITHUB_REPOSITORY", "iner2005-debug/software-contratacion-").split("/")
url = f"https://{dueno.lower()}.github.io/{repo}/"
html = (plantilla.replace("__URL__", url).replace("<!--LIBS-->", libs)
        .replace("__MEMBRETE_SUP__", img_sup).replace("__MEMBRETE_INF__", img_inf)
        .replace("/*SCRIPT*/", codigo))

salida = RAIZ / "dist" / "index.html"
salida.parent.mkdir(exist_ok=True)
salida.write_text(html, encoding="utf-8")
# Imagen que muestran WhatsApp, Facebook, Teams… al compartir el enlace.
(salida.parent / "vista-previa.png").write_bytes((RAIZ / "assets" / "vista-previa.png").read_bytes())
print(f"Listo: {salida}  ({len(datos['perfiles'])} perfiles, {len(datos['usados'])} contratos usados, "
      f"{salida.stat().st_size / 1e6:.1f} MB)")
