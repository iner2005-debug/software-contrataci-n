#!/usr/bin/env python3
"""Lee expedientes de contratación en Word (.docx) y crea perfiles para el catálogo.

Cada .docx debe ser un expediente completo de la ESE (necesidad, estudios
previos, idoneidad, designación, contrato y acta de inicio), como los que se
usaron para armar el catálogo actual.

Uso:
    python3 tools/extraer_perfiles.py CARPETA_CON_DOCX            # solo muestra lo que encontró
    python3 tools/extraer_perfiles.py CARPETA_CON_DOCX --agregar  # además lo agrega a data/catalogo.json

Requisitos: pandoc (recomendado) o la librería python-docx.
El nombre del perfil sale del nombre del archivo (p. ej. AUXILIAR_DE_FARMACIA.docx
-> "Auxiliar De Farmacia"); se puede cambiar después en el Catálogo.
"""
import json
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CATALOGO = RAIZ / "data" / "catalogo.json"

# Obligaciones del contratista que son iguales en todos los contratos.
# El software las agrega solo, así que no se guardan en el perfil.
GENERALES = ['garantizar el cumplimiento del objeto contractual', 'obrar con seriedad',
             'reportar en caso de cualquier novedad', 'acatar las directrices',
             'guardar estricta reserva', 'guardar la debida', 'realizarse el examen',
             'asumir de manera total', 'realizar aquellas actividades', 'presentar cuenta de cobro']
# Consideraciones (sección 2) que son iguales en todos los contratos.
CONSID_GENERALES = ['realizar la prest', 'realizar prest', 'realizar el objeto',
                    'la empresa social del estado hospital local maria la baja no posee',
                    'no posee el personal', 'la contratacion repercutira', 'adoptar procedimientos',
                    'es necesario entonces', 'el cubrimiento de esta necesidad']
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
         'septiembre', 'octubre', 'noviembre', 'diciembre']


def sin_tildes(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()


def leer_docx(ruta):
    """Devuelve la lista de párrafos (no vacíos) del documento."""
    if shutil.which('pandoc'):
        txt = subprocess.run(['pandoc', str(ruta), '-t', 'plain', '--wrap=none'],
                             capture_output=True, text=True, check=True).stdout
        return [l.strip() for l in txt.splitlines() if l.strip()]
    try:
        import docx  # python-docx
    except ImportError:
        raise SystemExit('Instale pandoc o python-docx (pip install python-docx)')
    d = docx.Document(str(ruta))
    out = [p.text.strip() for p in d.paragraphs if p.text.strip()]
    for t in d.tables:  # las tablas (contrato, acta) se agregan al final
        for fila in t.rows:
            celdas = [c.text.strip() for c in fila.cells]
            if any(celdas):
                out.append('   '.join(dict.fromkeys(celdas)))
    return out


def buscar(L, patron, desde=0):
    for i in range(max(desde, 0), len(L)):
        if re.search(patron, L[i], re.I):
            return i
    return -1


def separar_items(texto):
    """'1) Hacer X. 2) hacer Y' -> ['Hacer X.', 'Hacer Y.']"""
    partes = re.split(r'\s(?=\d+\)+\s?)', ' ' + texto)
    out, crudo = [], []
    for p in partes:
        p = re.sub(r'^\d+\)+\s*', '', p.strip())
        p = re.sub(r'\s*\d+\.\d+\)\s*', '. ', p).strip()
        if not p:
            continue
        # Un "2016) ante..." no es un ítem nuevo: se pega al anterior.
        if out and p[0].islower() and not crudo[-1].endswith(('.', ':', ';')):
            out[-1] = out[-1].rstrip('.') + ' ' + p
            crudo[-1] = p
            if not out[-1].endswith(('.', ':')):
                out[-1] += '.'
            continue
        crudo.append(p)
        p = p[0].upper() + p[1:]
        if not p.endswith(('.', ':')):
            p += '.'
        out.append(p)
    return [x for x in out if len(x.strip('. ')) > 3]


def fecha_iso(s, anio='2026'):
    m = (re.search(r'\((\d{1,2})\)\s*del mes de\s*(\w+)', s, re.I)
         or re.search(r'(\d{1,2})\s*de\s*(\w+)\s*de\s*\d{4}', s, re.I))
    if not m or sin_tildes(m.group(2)) not in MESES:
        return ''
    a = re.search(r'(20\d\d)', s)
    return f"{a.group(1) if a else anio}-{MESES.index(sin_tildes(m.group(2))) + 1:02d}-{int(m.group(1)):02d}"


def extraer(ruta):
    L = leer_docx(ruta)
    clave = re.sub(r'^[0-9a-f]{8}-', '', ruta.stem)  # quita prefijos tipo "2ebcb024-"
    p = {'id': re.sub(r'[^a-z]+', '-', sin_tildes(clave)).strip('-'),
         'nombre': clave.replace('_', ' ').replace('.', '. ').title().replace('  ', ' ')}
    avisos = []

    i = buscar(L, r'^3\.2\.?\s*OBJETO')
    p['objeto'] = re.sub(r'^3\.2\.?\s*OBJETO\s*:?\s*', '', L[i]) if i >= 0 else ''
    if p['objeto'] and not p['objeto'].endswith('.'):
        p['objeto'] += '.'
    p['tipo'] = 'SERVICIOS PROFESIONALES' if 'PROFESIONAL' in p['objeto'].upper() else 'APOYO A LA GESTIÓN'

    a = min([j for j in (buscar(L, r'^3\.3'), buscar(L, r'^CONTRATANTE:\s*1\)')) if j >= 0] or [-1])
    b = buscar(L, r'^3\.4', a)
    seccion = ' '.join(L[a:b]) if a >= 0 and b > a else ''
    k = seccion.find('CONTRATISTA:')
    obl = separar_items(seccion[k + 12:]) if k >= 0 else []
    p['obligaciones'] = [x for x in obl if not any(sin_tildes(x).startswith(g) for g in GENERALES)]
    p['supervisor'] = 'cie' if b >= 0 and 'cient' in sin_tildes(L[b]) else 'adm'

    a = buscar(L, r'ALCANCES DEL CONTRATO'); b = buscar(L, r'^Se evidencia dentro', a)
    al = [re.sub(r'^-\s+', '', x) for x in L[a + 1:b] if not x.startswith('El objeto del contrato')] if a >= 0 < b else []
    p['alcances'] = [x for x in al if not sin_tildes(x).startswith('repercute indirectamente')]

    a = buscar(L, r'DESCRIPCI[ÓO]N DE LA NECESIDAD'); b = buscar(L, r'JUSTIFICACI[ÓO]N DE LA NECESIDAD', a)
    p['necesidad'] = [re.sub(r'^-\s+', '• ', x) for x in L[a + 1:b]] if a >= 0 < b else []

    a = buscar(L, r'CONVENIENCIA Y OPORTUNIDAD')
    fines = [j for j in (buscar(L, r'^La satisfacci[óo]n de la necesidad', a), buscar(L, r'^Es así que a sabiendas', a),
                         buscar(L, r'^En este orden de ideas', a)) if j > 0]
    p['conveniencia'] = L[a + 1:min(fines)] if a >= 0 and fines else []

    a = buscar(L, r'^En este orden de ideas'); b = buscar(L, r'^Para tal fin', a)
    cs = [re.sub(r'^-\s+', '', x) for x in L[a + 1:b]] if a >= 0 < b else []
    p['consideraciones'] = [x for x in cs if not any(sin_tildes(x).startswith(g) for g in CONSID_GENERALES)]

    i = buscar(L, r'CDP No'); cdp_linea = L[i] if i >= 0 else ''
    m = re.search(r'RUBRO\s*No\.?\s*(AC\.?\s*[\d\.]+?)\.?\s*,?\s*(?:CON\s+)?NOMBRE:\s*(.+?)\s*(?:,|\bVALOR|\$|\b[A-ZÁÉÍÓÚ]+ MILLONES)', cdp_linea, re.I)
    p['rubro'] = re.sub(r'\.\.+', '.', m.group(1).replace(' ', '')) if m else ''
    p['rubroNombre'] = m.group(2).strip().rstrip('.,').capitalize() if m else ''
    if not p['rubro']:
        avisos.append('no se encontró el rubro')

    p['idoneidad'] = ''
    i = buscar(L, r'^\d?\.?\s*VIGENCIA:|^3\.5')
    vig = re.sub(r'^3\.5\.?\s*VIGENCIA:\s*', '', L[i]).strip().rstrip('.') if i >= 0 else ''
    m = re.match(r'^(\w+)\s*\(0?(\d+)\)\s*mes(es)?$', vig, re.I)
    if m:
        p['mesesSug'], p['vigTexto'] = int(m.group(2)), ''
    else:
        p['vigTexto'] = vig.upper()
        m = re.search(r'\(0?(\d+)\)', vig)
        p['mesesSug'] = int(m.group(1)) if m else 2

    i = buscar(L, r'^3\.6')
    m = re.search(r'\$\s*([\d\.]+)', L[i]) if i >= 0 else None
    p['valorSug'] = int(m.group(1).replace('.', '')) if m else 0
    if m and len(m.group(1).split('.')[-1]) != 3:
        avisos.append(f'valor mal escrito en el documento: ${m.group(1)} (revíselo en el Catálogo)')

    i = buscar(L, r'^3\.7'); fp = L[i] if i >= 0 else ''
    p['pagoTexto'] = ''
    if fp and not re.search(r'cuotas mensuales iguales', fp, re.I):
        mm = re.search(r'Se pagar[áa] en\s*(.+?),?\s*despu[ée]s de', fp, re.I)
        p['pagoTexto'] = mm.group(1).strip().rstrip(',.') if mm else ''

    # Ejemplo: datos del contratista real del documento, tomados del acta de inicio.
    i = buscar(L, r'se reunieron'); acta = L[i] if i >= 0 else ''
    m = re.search(r'(?:señora|señor)\s*(?:\(a\))?\s*,?\s*(.+?),?\s*identificad[oa]\s*(?:\(a\))?\s*con\s*C\.C\.?\s*(?:N°|No:?|No\.)?\s*([\d\.]+)', acta)
    nombre = re.sub(r'^A,\s*', '', m.group(1).strip().rstrip(',')).upper() if m else ''
    sexo = 'f' if re.search(r'identificada\b', acta) else ('m' if re.search(r'identificado\s+con', acta) else '')
    m2 = re.search(r'CDP No\.?\s*([\w\.]+?)\s+del?\s', cdp_linea, re.I); cdp = m2.group(1) if m2 else ''
    i = buscar(L, r'^CONTRATO NO\.'); num = L[i] if i >= 0 else ''
    mn = re.search(r'C-HLMLB-\s*(\d{8})-\s*(\d+)', num)
    q = buscar(L, r'^Queda constancia que la necesidad')
    j = buscar(L, r'firma por las partes el día'); fs = L[j][L[j].find('firma por las partes el día'):] if j >= 0 else ''
    p['ejemplo'] = {'nombre': nombre, 'ndoc': m.group(2).replace('.', '') if m else '', 'sexo': sexo,
                    'cdp': cdp, 'rp': cdp, 'consec': int(mn.group(2)) if mn else '',
                    'fnec': fecha_iso(L[q]) if q >= 0 else '', 'fcdp': fecha_iso(cdp_linea),
                    'fsus': max(fecha_iso(fs), fecha_iso(cdp_linea))}
    numero = f'C-HLMLB-{mn.group(1)}-{mn.group(2).zfill(2)}' if mn else None
    for campo in ('objeto', 'obligaciones', 'alcances'):
        if not p[campo]:
            avisos.append(f'no se encontró: {campo}')
    return p, numero, avisos


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    carpeta = Path(sys.argv[1])
    agregar = '--agregar' in sys.argv
    D = json.loads(CATALOGO.read_text(encoding='utf-8'))
    ids = {p['id'] for p in D['perfiles']}
    usados = set(D['usados'])
    nuevos = 0
    for ruta in sorted(carpeta.glob('*.docx')):
        p, numero, avisos = extraer(ruta)
        estado = 'YA EXISTE' if p['id'] in ids else 'nuevo'
        print(f"{ruta.name}: {p['nombre']} [{estado}] · {len(p['obligaciones'])} obligaciones · "
              f"{len(p['alcances'])} alcances · rubro {p['rubro'] or '?'} · {p['valorSug']:,}".replace(',', '.'))
        for a in avisos:
            print('   ! ' + a)
        if numero and numero in usados:
            print(f'   ! el número {numero} ya estaba usado por otro contrato')
        if agregar and p['id'] not in ids:
            D['perfiles'].append(p); ids.add(p['id']); nuevos += 1
        if agregar and numero:
            usados.add(numero)
    if agregar:
        D['perfiles'].sort(key=lambda p: (p['tipo'], p['nombre']))
        D['usados'] = sorted(usados)
        CATALOGO.write_text(json.dumps(D, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'\nAgregados {nuevos} perfiles. Ejecute "python3 build.py" para actualizar dist/index.html')


if __name__ == '__main__':
    main()
