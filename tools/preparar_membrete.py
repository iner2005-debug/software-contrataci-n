#!/usr/bin/env python3
"""Prepara el membrete (rótulo) del hospital para el software.

Toma el Word con el formato del hospital (encabezado, marca de agua y pie de
página) y genera en assets/:
  - rotulo.docx        plantilla base de todos los Word que produce el software
  - membrete.jpg       la hoja completa como imagen, fondo de cada página del PDF
  - membrete-sup.png   franja superior (vista previa en pantalla)
  - membrete-inf.png   franja inferior (vista previa en pantalla)
  - membrete.json      dónde empieza y termina el área de texto (márgenes)

Uso:
    python3 tools/preparar_membrete.py RUTA/FORMATO_ROTULO_HOSPITAL.docx
    python3 build.py

Requisitos: LibreOffice (soffice), pdftoppm (poppler-utils) y Pillow.
Solo hay que correrlo de nuevo si cambia el formato del hospital.
"""
import io, json, re, shutil, subprocess, sys, tempfile, zipfile
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ASSETS = RAIZ / 'assets'
DPI = 150
EMU_PT = 12700
TW_PT = 20


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    origen = Path(sys.argv[1])
    ASSETS.mkdir(exist_ok=True)
    shutil.copy(origen, ASSETS / 'rotulo.docx')
    z = zipfile.ZipFile(origen)
    doc = z.read('word/document.xml').decode()
    sect = re.findall(r'<w:sectPr.*?</w:sectPr>', doc, re.S)[-1]
    mar = dict(re.findall(r'w:(top|left|bottom|right)="(\d+)"', re.search(r'<w:pgMar[^>]*>', sect).group(0)))
    pg = re.search(r'<w:pgSz w:w="(\d+)" w:h="(\d+)"', sect)
    W, H = int(pg.group(1)) / TW_PT, int(pg.group(2)) / TW_PT

    # La marca de agua (imagen con transparencia) se dibuja aparte, porque
    # LibreOffice no respeta la transparencia al convertir a PDF.
    marcas = []
    vacias = {}
    for parte in [n for n in z.namelist() if re.match(r'word/(header|footer)\d+\.xml$', n)]:
        xml = z.read(parte).decode()
        rels = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"',
                               z.read(parte.replace('word/', 'word/_rels/') + '.rels').decode()))
        for anc in re.findall(r'<wp:anchor.*?</wp:anchor>', xml, re.S):
            m = re.search(r'<a:blip r:embed="(rId\d+)"[^>]*>\s*<a:alphaModFix amt="(\d+)"', anc)
            if not m:
                continue
            ext = re.search(r'<wp:extent cx="(\d+)" cy="(\d+)"', anc)
            ph = re.search(r'<wp:positionH relativeFrom="(\w+)"><wp:posOffset>(-?\d+)', anc)
            pv = re.search(r'<wp:positionV relativeFrom="(\w+)"><wp:posOffset>(-?\d+)', anc)
            base_x = int(mar['left']) / TW_PT if ph.group(1) in ('margin', 'column') else 0
            base_y = int(mar['top']) / TW_PT if pv.group(1) == 'margin' else 0
            img = 'word/' + rels[m.group(1)]
            marcas.append(dict(img=z.read(img), alpha=int(m.group(2)) / 100000,
                               x=base_x + int(ph.group(2)) / EMU_PT, y=base_y + int(pv.group(2)) / EMU_PT,
                               w=int(ext.group(1)) / EMU_PT, h=int(ext.group(2)) / EMU_PT))
            im = Image.open(io.BytesIO(z.read(img)))
            b = io.BytesIO(); Image.new('RGBA', im.size, (0, 0, 0, 0)).save(b, 'PNG'); vacias[img] = b.getvalue()

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        sin = tmp / 'sin_marca.docx'
        with zipfile.ZipFile(sin, 'w', zipfile.ZIP_DEFLATED) as out:
            for n in z.namelist():
                out.writestr(n, vacias.get(n, z.read(n)))
        subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', str(tmp), str(sin)],
                       check=True, capture_output=True)
        subprocess.run(['pdftoppm', '-r', str(DPI), '-png', '-singlefile', str(tmp / 'sin_marca.pdf'), str(tmp / 'p')],
                       check=True)
        hoja = Image.open(tmp / 'p.png').convert('RGB')

    k = DPI / 72
    # Franjas de encabezado y pie (antes de pegar la marca de agua).
    gris = hoja.convert('L')
    px = gris.load()
    filas = [any(px[x, y] < 235 for x in range(0, hoja.width, 3)) for y in range(hoja.height)]
    sup = max(y for y in range(int(hoja.height * .3)) if filas[y]) + 1
    inf = min(y for y in range(int(hoja.height * .7), hoja.height) if filas[y])
    hoja.crop((0, 0, hoja.width, sup + int(6 * k))).save(ASSETS / 'membrete-sup.png', optimize=True)
    hoja.crop((0, inf - int(6 * k), hoja.width, hoja.height)).save(ASSETS / 'membrete-inf.png', optimize=True)

    for m in marcas:
        im = Image.open(io.BytesIO(m['img'])).convert('RGBA').resize((round(m['w'] * k), round(m['h'] * k)))
        a = im.getchannel('A').point(lambda v: round(v * m['alpha']))
        im.putalpha(a)
        hoja.paste(im, (round(m['x'] * k), round(m['y'] * k)), im)
    hoja.save(ASSETS / 'membrete.jpg', quality=82, optimize=True, progressive=True)

    info = {'ancho': W, 'alto': H, 'encabezadoHasta': round(sup / k, 1), 'pieDesde': round(inf / k, 1),
            'margenIzq': int(mar['left']) / TW_PT, 'margenDer': int(mar['right']) / TW_PT}
    (ASSETS / 'membrete.json').write_text(json.dumps(info, indent=1))
    print('Listo:', info)


if __name__ == '__main__':
    main()
