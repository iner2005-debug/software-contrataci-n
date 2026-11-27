/* ============================================================
   CREAR O ACTUALIZAR PERFILES DESDE UN EXPEDIENTE EN WORD (.docx)
   Lee el documento en el navegador (nada se sube a internet) y saca
   objeto, obligaciones, alcances, necesidad, conveniencia, rubro,
   valor, vigencia, forma de pago y supervisor. Es la misma lógica de
   tools/extraer_perfiles.py.
   ============================================================ */
const sinTildes=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const GENERALES_OBL=['garantizar el cumplimiento del objeto contractual','obrar con seriedad','reportar en caso de cualquier novedad','acatar las directrices','guardar estricta reserva','guardar la debida','realizarse el examen','asumir de manera total','realizar aquellas actividades','presentar cuenta de cobro'];
const GENERALES_CONS=['realizar la prest','realizar prest','realizar el objeto','la empresa social del estado hospital local maria la baja no posee','no posee el personal','la contratacion repercutira','adoptar procedimientos','es necesario entonces','el cubrimiento de esta necesidad'];

/* párrafos del Word, en orden (incluye los de las tablas) */
async function leerWord(buf){
 const zip=await JSZip.loadAsync(buf),f=zip.file('word/document.xml');
 if(!f)throw new Error('El archivo no es un Word .docx válido.');
 const doc=new DOMParser().parseFromString(await f.async('string'),'application/xml'),W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 /* los cuadros de texto vienen repetidos (versión moderna y antigua): se quitan */
 [...doc.getElementsByTagNameNS(W,'txbxContent')].forEach(n=>n.parentNode&&n.parentNode.removeChild(n));
 [...doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/markup-compatibility/2006','Fallback')].forEach(n=>n.parentNode&&n.parentNode.removeChild(n));
 const L=[];
 for(const p of doc.getElementsByTagNameNS(W,'p')){let t='';
  const rec=n=>{for(const c of n.childNodes){if(c.namespaceURI===W&&c.localName==='t')t+=c.textContent;else if(c.namespaceURI===W&&(c.localName==='tab'||c.localName==='br'))t+=' ';else if(c.nodeType===1&&!(c.namespaceURI===W&&c.localName==='p'))rec(c)}};
  rec(p);t=t.replace(/\s+/g,' ').trim();if(t)L.push(t)}
 return L;
}
const buscarL=(L,re,desde=0)=>{for(let i=Math.max(desde,0);i<L.length;i++)if(re.test(L[i]))return i;return -1};

function separarItems(texto){
 const partes=(' '+texto).split(/\s(?=\d+\)+\s?)/),out=[],crudo=[];
 for(let p of partes){p=p.trim().replace(/^\d+\)+\s*/,'').replace(/\s*\d+\.\d+\)\s*/g,'. ').trim();if(!p)continue;
  const minus=p[0]===p[0].toLowerCase()&&p[0]!==p[0].toUpperCase();
  if(out.length&&minus&&!/[.:;]$/.test(crudo[crudo.length-1])){out[out.length-1]=out[out.length-1].replace(/\.+$/,'')+' '+p;crudo[crudo.length-1]=p;if(!/[.:]$/.test(out[out.length-1]))out[out.length-1]+='.';continue}
  crudo.push(p);p=p[0].toUpperCase()+p.slice(1);if(!/[.:]$/.test(p))p+='.';out.push(p)}
 return out.filter(z=>z.replace(/^[. ]+|[. ]+$/g,'').length>3);
}
function fechaIso(s){const MS=MES.map(sinTildes);
 const m=/\((\d{1,2})\)\s*del mes de\s*(\S+)/i.exec(s)||/(\d{1,2})\s*de\s*(\S+)\s*de\s*\d{4}/i.exec(s);
 if(!m||!MS.includes(sinTildes(m[2])))return'';const a=/(20\d\d)/.exec(s);
 return`${a?a[1]:new Date().getFullYear()}-${String(MS.indexOf(sinTildes(m[2]))+1).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`}
const NUMS=Object.fromEntries(['cero','un','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce'].map((w,i)=>[w,i]));

/* vigencia escrita → botones de "¿Cuánto dura?" */
function vigDesdeTexto(t,anio){t=t.toUpperCase();const s=sinTildes(t);
 let m=/desde el (\d{1,2}) de (\w+)(?: de (\d{4}))? hasta el (\d{1,2}) de (\w+)(?: de (\d{4}))?/.exec(s);const MS=MES.map(sinTildes);
 if(m&&MS.includes(m[2])&&MS.includes(m[5])){const y2=m[6]||anio,y1=m[3]||y2,f=(y,mm,d)=>`${y}-${String(MS.indexOf(mm)+1).padStart(2,'0')}-${String(+d).padStart(2,'0')}`;
  return{vmodo:'fechas',vini:f(y1,m[2],m[1]),vfin:f(y2,m[5],m[4])}}
 m=/^\w+ \(0?(\d+)\) mes(es)? y \w+ \(0?(\d+)\) dias?$/.exec(s);if(m)return{vmodo:'dias',meses:+m[1],vdias:+m[3]};
 m=/^\w+ \(0?(\d+)\) mes(es)?$/.exec(s);if(m)return{vmodo:'meses',meses:+m[1]};
 return{vmodo:'texto',vigt:t}}

function extraerPerfil(L,archivo){
 const avisos=[],clave=archivo.replace(/\.docx$/i,'').replace(/^[0-9a-f]{8}-/,'');
 const p={id:sinTildes(clave).replace(/[^a-z]+/g,'-').replace(/^-|-$/g,''),nombre:clave.replace(/_/g,' ').replace(/\./g,'. ').toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase()).replace(/\s+/g,' ').trim(),idoneidad:''};
 let i=buscarL(L,/^\d?\.?\d?\.?\s*OBJETO\s*:/i);
 if(i<0)i=buscarL(L,/^3\.2\.?\s*OBJETO/i);
 p.objeto=i>=0?L[i].replace(/^[\d.\s]*OBJETO\s*:?\s*/i,''):'';if(p.objeto&&!p.objeto.endsWith('.'))p.objeto+='.';
 p.tipo=/PROFESIONAL/i.test(p.objeto)?'SERVICIOS PROFESIONALES':'APOYO A LA GESTIÓN';
 let a=Math.min(...[buscarL(L,/^3\.3/),buscarL(L,/^CONTRATANTE:\s*1\)/)].filter(j=>j>=0).concat([1e9]));if(a===1e9)a=-1;
 let b=buscarL(L,/^3\.4|SUPERVISOR[AE]?\s*:/i,a);
 const sec=a>=0&&b>a?L.slice(a,b).join(' '):'',k=sec.indexOf('CONTRATISTA:');
 p.obligaciones=(k>=0?separarItems(sec.slice(k+12)):[]).filter(z=>!GENERALES_OBL.some(g=>sinTildes(z).startsWith(g)));
 p.supervisor=b>=0&&sinTildes(L[b]).includes('cient')?'cie':'adm';
 a=buscarL(L,/ALCANCES DEL CONTRATO/i);b=buscarL(L,/^Se evidencia dentro/i,a);
 p.alcances=(a>=0&&b>0?L.slice(a+1,b):[]).map(z=>z.replace(/^-\s+/,'')).filter(z=>!z.startsWith('El objeto del contrato')&&!sinTildes(z).startsWith('repercute indirectamente'));
 a=buscarL(L,/DESCRIPCI[ÓO]N DE LA NECESIDAD/i);b=buscarL(L,/JUSTIFICACI[ÓO]N DE LA NECESIDAD/i,a);
 p.necesidad=a>=0&&b>0?L.slice(a+1,b).map(z=>z.replace(/^-\s+/,'• ')):[];
 a=buscarL(L,/CONVENIENCIA Y OPORTUNIDAD/i);
 const fines=[buscarL(L,/^La satisfacci[óo]n de la necesidad/i,a),buscarL(L,/^Es así que a sabiendas/i,a),buscarL(L,/^En este orden de ideas/i,a)].filter(j=>j>0);
 p.conveniencia=a>=0&&fines.length?L.slice(a+1,Math.min(...fines)):[];
 a=buscarL(L,/^En este orden de ideas/i);b=buscarL(L,/^Para tal fin/i,a);
 p.consideraciones=(a>=0&&b>0?L.slice(a+1,b):[]).map(z=>z.replace(/^-\s+/,'')).filter(z=>!GENERALES_CONS.some(g=>sinTildes(z).startsWith(g)));
 i=buscarL(L,/CDP No/i);const cdpL=i>=0?L[i]:'';
 let m=/RUBRO\s*No\.?\s*(AC\.?\s*[\d.]+?)\.?\s*,?\s*(?:CON\s+)?NOMBRE:\s*(.+?)\s*(?:,|\bVALOR|\$|\b[A-ZÁÉÍÓÚ]+ MILLONES)/i.exec(cdpL);
 p.rubro=m?m[1].replace(/\s/g,'').replace(/\.\.+/g,'.'):'';p.rubroNombre=m?m[2].trim().replace(/[.,]+$/,'').toLowerCase().replace(/^./,c=>c.toUpperCase()):'';
 if(!p.rubro)avisos.push('No se encontró el rubro.');
 i=buscarL(L,/^\d?\.?\d*\.?\s*VIGENCIA:|^3\.5/i);
 const vig=i>=0?L[i].replace(/^[\d.\s]*VIGENCIA:\s*/i,'').trim().replace(/\.$/,''):'';
 i=buscarL(L,/^\d?\.?\d*\.?\s*VALOR:|^3\.6/i);m=i>=0?/\$\s*([\d.]+)/.exec(L[i]):null;
 p.valorSug=m?+m[1].replace(/\./g,''):0;
 if(m&&m[1].split('.').pop().length!==3)avisos.push(`Valor mal escrito en el documento: $${m[1]}. Revíselo.`);
 const anio=(/(20\d\d)/.exec(cdpL)||[])[1]||String(new Date().getFullYear());
 const v=vig?vigDesdeTexto(vig,anio):{vmodo:'meses',meses:2};
 p.mesesSug=v.meses||(/\(0?(\d+)\)/.exec(vig)||[])[1]*1||2;p.vigTexto='';p.vigSug=undefined;
 if(v.vmodo==='texto')p.vigTexto=v.vigt;else if(v.vmodo!=='meses')p.vigSug=v;
 if(v.vmodo==='fechas'){const a1=pd(v.vini),b1=pd(v.vfin);p.mesesSug=Math.max(1,(b1.y*12+b1.m)-(a1.y*12+a1.m)+1)}
 i=buscarL(L,/^\d?\.?\d*\.?\s*FORMA DE PAGO|^3\.7/i);const fp=i>=0?L[i]:'';p.pagoTexto='';p.pagoSug=undefined;
 if(fp&&!/cuotas mensuales iguales/i.test(fp)){const mm=/Se pagar[áa] en\s*(.+?),?\s*despu[ée]s de/i.exec(fp);const txt=mm?mm[1].trim().replace(/[,.]+$/,''):'';
  const montos=[...txt.matchAll(/\$\s*([\d.]{5,})/g)].map(z=>+z[1].replace(/\./g,''));
  if(montos.length>1&&montos.reduce((s,n)=>s+n,0)===p.valorSug)p.pagoSug={pmodo:'varios',pagos:montos};else if(txt)p.pagoTexto=txt}
 /* ejemplo con los datos del contrato que traía el documento */
 i=buscarL(L,/se reunieron/i);const acta=i>=0?L[i]:'';
 m=/(?:señora|señor)\s*(?:\(a\))?\s*,?\s*(.+?),?\s*identificad[oa]\s*(?:\(a\))?\s*con\s*C\.C\.?\s*(?:N°|No:?|No\.)?\s*([\d.]+)/.exec(acta);
 const nombre=m?m[1].trim().replace(/,$/,'').replace(/^A,\s*/,'').toUpperCase():'',sexo=/identificada\b/.test(acta)?'f':/identificado\s+con/.test(acta)?'m':'';
 const m2=/CDP No\.?\s*([\w.]+?)\s+del?\s/i.exec(cdpL);i=buscarL(L,/^CONTRATO NO\./i);const mn=i>=0?/C-HLMLB-\s*(\d{8})-\s*(\d+)/.exec(L[i]):null;
 const q=buscarL(L,/^Queda constancia que la necesidad/i),j=buscarL(L,/firma por las partes el día/i),fs=j>=0?L[j].slice(L[j].indexOf('firma por las partes el día')):'';
 const f1=fechaIso(fs),f2=fechaIso(cdpL);
 p.ejemplo={nombre,ndoc:m?m[2].replace(/\./g,''):'',sexo,cdp:m2?m2[1]:'',rp:m2?m2[1]:'',consec:mn?+mn[2]:'',fnec:q>=0?fechaIso(L[q]):'',fcdp:f2,fsus:f1>f2?f1:f2};
 const numero=mn?`C-HLMLB-${mn[1]}-${mn[2].padStart(2,'0')}`:'';
 /* Si no vinieron los Estudios previos (o les falta algo), se busca en los otros documentos */
 const C=L.slice(Math.max(0,buscarL(L,/^CONTRATO NO\./i))).join(' ');
 if(!p.objeto){const mo=/tiene como Objeto\s+(.+?)\s*CL[AÁ]USULA SEGUNDA/i.exec(C)||/con Objeto\s+(.+?),?\s*dentro de las instalaciones/i.exec(acta)||/que imparta la\s+(.+)$/i.exec(L[buscarL(L,/que imparta la/i)]||'');
  if(mo){p.objeto=mo[1].trim().replace(/[,.]*$/,'.');p.tipo=/PROFESIONAL/i.test(p.objeto)?'SERVICIOS PROFESIONALES':'APOYO A LA GESTIÓN'}}
 if(!p.obligaciones.length){const mo=/CL[AÁ]USULA SEXTA.*?componente:\s*(.+?)\s*PAR[AÁ]GRA[FD]O/i.exec(C);
  if(mo)p.obligaciones=separarItems(mo[1]).filter(z=>!GENERALES_OBL.some(g=>sinTildes(z).startsWith(g)))}
 if(!p.alcances.length){const mo=/CL[AÁ]USULA SEGUNDA.*?alcance:\s*(.+?)\s*CL[AÁ]USULA TERCERA/i.exec(C);
  if(mo)p.alcances=separarItems(mo[1]).map(z=>z.replace(/^-\s*/,'')).filter(z=>!sinTildes(z).startsWith('repercute indirectamente'))}
 if(!p.rubro){const mo=/RUBRO\s*No\.?\s*(AC\.?\s*[\d.]+?)\.?\s*,?\s*(?:CON\s+)?NOMBRE:\s*(.+?)\s*(?:,|\bVALOR|\$|\b[A-ZÁÉÍÓÚ]+ MILLONES|expedido)/i.exec(C);
  if(mo){p.rubro=mo[1].replace(/\s/g,'').replace(/\.\.+/g,'.');p.rubroNombre=mo[2].trim().replace(/[.,]+$/,'').toLowerCase().replace(/^./,c=>c.toUpperCase());const k=avisos.indexOf('No se encontró el rubro.');if(k>=0)avisos.splice(k,1)}}
 if(!p.valorSug){const k=buscarL(L,/^VALOR( TOTAL)?:?$/i),mo=k>=0?/\$\s*([\d.]+)/.exec(L[k+1]||''):null;if(mo)p.valorSug=+mo[1].replace(/\./g,'')}
 if(!vig){const k=buscarL(L,/^PLAZO DE EJECUCI[ÓO]N:?$/i);if(k>=0&&L[k+1]){const v2=vigDesdeTexto(L[k+1].replace(/\.$/,''),anio);p.mesesSug=v2.meses||p.mesesSug;if(v2.vmodo==='texto')p.vigTexto=v2.vigt;else if(v2.vmodo!=='meses')p.vigSug=v2}}
 const supTxt=sinTildes([acta,...L.filter(z=>/^PARA\b|SUPERVISI[ÓO]N|NOMBRE DEL SUPERVISOR|^CARGO/i.test(z))].join(' '));
 if(buscarL(L,/^\d?\.?\d*\.?\s*SUPERVISOR[AE]?\s*:|^3\.4/i)<0&&supTxt.includes('cientific'))p.supervisor='cie';
 ['objeto','obligaciones','alcances'].forEach(c=>{if(!p[c]||!p[c].length)avisos.push(`No se encontró: ${c}.`)});
 if(!p.objeto&&!p.obligaciones.length)avisos.unshift('No parece un expediente de contratación de la ESE (no tiene objeto ni obligaciones).');
 return{p,numero,avisos};
}

/* ---------- pantalla: revisar lo que se encontró antes de guardar ---------- */
const CAMPOS_IMP=[['objeto','Objeto'],['obligaciones','Obligaciones específicas'],['alcances','Alcances'],['necesidad','Descripción de la necesidad'],['conveniencia','Conveniencia y oportunidad'],['consideraciones','Consideraciones'],['rubro','Rubro'],['rubroNombre','Nombre del rubro'],['tipo','Tipo'],['supervisor','Supervisa'],['valorSug','Valor sugerido'],['vigpago','Vigencia y forma de pago'],['ejemplo','Ejemplo (datos del contrato del documento)']];
let impEstado=null;
const resumenCampo=(p,k)=>{const v=p[k];if(k==='vigpago'){const[a,b]=resumenSug(p);return(a||'—')+' · '+(b||'—')}
 if(k==='supervisor')return v==='cie'?'Subgerente científica':'Subgerente administrativa';if(k==='valorSug')return money(v||0);
 if(k==='ejemplo')return v&&v.nombre?`${v.nombre} · ${v.ndoc?cc(v.ndoc):''}`:'—';
 if(Array.isArray(v))return v.length?`${v.length} · ${v[0].slice(0,90)}${v[0].length>90?'…':''}`:'—';return v?String(v).slice(0,140)+(String(v).length>140?'…':''):'—'};
const tieneValor=(p,k)=>k==='vigpago'?true:k==='ejemplo'?!!(p.ejemplo&&p.ejemplo.nombre):Array.isArray(p[k])?p[k].length>0:!!p[k];

/* Un Word por documento: se leen todos y se unen en el orden del expediente */
async function importarPartes(partes,modo){const L=[],leidos=[],errores=[];
 for(const[k,n] of DOCLIST){const f=partes[k];if(!f)continue;
  if(!/\.docx$/i.test(f.name)){errores.push(`${n}: «${f.name}» no es .docx`);continue}
  try{L.push(...await leerWord(await f.arrayBuffer()));leidos.push(n)}catch(e){errores.push(`${n}: ${e.message||e}`)}}
 if(!leidos.length){alert('No se pudo leer ningún documento.\n'+errores.join('\n'));return}
 const base=(partes.est||partes.con||partes.nec||Object.values(partes).find(Boolean)).name;
 const r=extraerPerfil(L,base);r.p.nombre='';r.pedirNombre=true;
 const faltan=DOCLIST.filter(([k])=>!partes[k]).map(([,n])=>n);
 if(!partes.est)r.avisos.unshift('Sin los Estudios previos no se pueden leer la necesidad, la conveniencia ni las consideraciones; lo demás se tomó de los otros documentos.');
 errores.forEach(e=>r.avisos.unshift(e));
 impEstado={modo,res:[{archivo:`${leidos.length} documento${leidos.length===1?'':'s'}: ${leidos.join(', ')}`+(faltan.length?` · sin: ${faltan.join(', ')}`:''),...r,dest:modo==='actualizar'?catI:'nuevo'}]};
 renderImp();$('imp').classList.add('on');
}
/* ¿A qué perfil del catálogo corresponde un expediente? Por el nombre del
   archivo y, si no, por las palabras del objeto. */
/* palabras que están en casi todos los contratos: no sirven para distinguir perfiles */
const COMUNES=new Set('prestacion prestaciones servicio servicios apoyo gestion empresa social estado hospital local maria baja como para entidad conformidad normatividad vigente lineamientos institucionales necesidades demas actividades propias perfil profesional profesionales contrato objeto realizar cumplir garantizar acuerdo dentro todas segun cada desarrollo usuarios pacientes atencion'.split(' '));
const palabras=t=>new Set(sinTildes(t).split(/[^a-z]+/).filter(w=>w.length>3&&!COMUNES.has(w)));
function parecido(a,b){const A=palabras(a),B=palabras(b);if(!A.size||!B.size)return 0;let c=0;A.forEach(w=>{if(B.has(w))c++});return c/(A.size+B.size-c)}
function adivinarPerfil(p){const exacto=D.perfiles.findIndex(x=>x.id===p.id);if(exacto>=0)return{i:exacto,s:1,nombre:true};
 const sc=D.perfiles.map((x,i)=>({i,s:parecido(p.objeto,x.objeto)*.3+parecido(p.obligaciones.join(' '),x.obligaciones.join(' '))*.45+parecido(p.alcances.join(' '),x.alcances.join(' '))*.25})).sort((a,b)=>b.s-a.s);
 const[m1,m2]=sc;if(!m1||m1.s<.2)return{i:-1,s:m1?m1.s:0};
 return{i:m1.i,s:m1.s,dudoso:m2&&m1.s-m2.s<.08,segundo:m2&&m2.i}}

async function importarWord(files,modo){
 const res=[];
 for(const f of files){if(!/\.docx$/i.test(f.name)){res.push({archivo:f.name,error:'Solo se pueden leer archivos .docx (Word 2007 en adelante). Si es .doc, ábralo en Word y guárdelo como .docx.'});continue}
  try{const L=await leerWord(await f.arrayBuffer());res.push({archivo:f.name,...extraerPerfil(L,f.name)})}catch(e){res.push({archivo:f.name,error:e.message||String(e)})}}
 res.forEach(r=>{if(r.error)return;if(modo==='actualizar')r.dest=catI;else if(modo==='crear')r.dest='nuevo';
  else{const g=adivinarPerfil(r.p);r.dest=g.i>=0?g.i:'nuevo';r.seguro=g.s;r.porNombre=!!g.nombre;r.dudoso=!!g.dudoso;r.segundo=g.segundo}});
 impEstado={modo,res};renderImp();$('imp').classList.add('on');
}
function tarjetaImp(r,ri){
 if(r.error)return`<div class="card"><b>${esc(r.archivo)}</b><p class="gmsg bad">${esc(r.error)}</p></div>`;
 const p=r.p,lote=impEstado.modo==='lote',act=typeof r.dest==='number',actual=act?D.perfiles[r.dest]:null,nuevo=r.dest==='nuevo';
 const existe=nuevo&&D.perfiles.find(x=>x.id===p.id);
 const repetido=act&&impEstado.res.some((o,j)=>j!==ri&&!o.error&&o.dest===r.dest);
 return`<div class="card imp${r.dest==='no'?' apagada':''}" data-ri="${ri}"><p class="note" style="margin:0 0 6px">📎 ${esc(r.archivo)}</p>
  ${lote?`<label for="dest-${ri}">Actualiza el perfil</label><select id="dest-${ri}" data-dest="${ri}">
    ${D.perfiles.map((x,i)=>`<option value="${i}"${r.dest===i?' selected':''}>${esc(x.nombre)}</option>`).join('')}
    <option value="nuevo"${nuevo?' selected':''}>➕ Crear como perfil nuevo</option><option value="no"${r.dest==='no'?' selected':''}>✕ No usar este archivo</option></select>
   <p class="${r.dudoso&&!r.cambiado?'gmsg bad':'hint'}" style="margin:4px 0 0">${r.cambiado?'Elegido por usted.':r.porNombre?'Reconocido por el nombre del archivo.':act?(r.dudoso?`⚠ Dudoso: se parece casi igual a «${esc(D.perfiles[r.segundo]?.nombre||'')}». Confirme cuál es.`:'Reconocido por el contenido (objeto, obligaciones y alcances). Revise que sea el correcto.'):'No se encontró un perfil parecido: se creará uno nuevo, o elija cuál actualizar.'}</p>
   ${repetido?'<p class="gmsg bad" style="margin:4px 0 0">Otro archivo también actualiza este perfil: revise.</p>':''}`:''}
  ${nuevo?`<label for="nom-${ri}">Nombre del perfil${r.pedirNombre?' (escríbalo)':''}</label><input id="nom-${ri}" data-nombre="${ri}" placeholder="Ej.: Psicólogo(a), Auxiliar de enfermería – urgencias" value="${esc(existe?p.nombre+' (nuevo)':p.nombre)}">${existe&&!lote?`<p class="hint" style="margin:4px 0 0">Ya existe un perfil «${esc(existe.nombre)}». Se creará uno nuevo; si quería reemplazarlo, use «Actualizar desde Word».</p>`:''}`:''}
  ${r.dest==='no'?'':`${r.avisos.length?`<ul class="checks" style="margin:10px 0 4px">${r.avisos.map(a=>`<li class="warn">${esc(a)}</li>`).join('')}</ul>`:''}
  <p class="q" style="margin:12px 0 4px">${act?'Marque lo que quiere reemplazar':'Lo que se encontró'}</p>
  <div class="scroll"><table class="ptab mini impt"><thead><tr>${act?'<th></th>':''}<th>Parte</th>${act?'<th>Ahora</th>':''}<th>${act?'Del Word':'Valor'}</th></tr></thead><tbody>
  ${CAMPOS_IMP.map(([k,n])=>{const ok=tieneValor(p,k),dif=act&&JSON.stringify(k==='vigpago'?resumenSug(p):p[k])!==JSON.stringify(k==='vigpago'?resumenSug(actual):actual[k]);
   return`<tr>${act?`<td><input type="checkbox" data-campo="${k}" ${ok&&dif&&k!=='ejemplo'?'checked':''} ${ok?'':'disabled'} aria-label="Reemplazar ${esc(n)}"></td>`:''}<td><b>${esc(n)}</b></td>${act?`<td class="note">${esc(resumenCampo(actual,k))}</td>`:''}<td${ok?'':' class="note"'}>${esc(ok?resumenCampo(p,k):'no se encontró')}${act&&ok&&!dif?' <span class="note">(igual)</span>':''}</td></tr>`}).join('')}
  </tbody></table></div>
  ${r.numero?`<label class="chk" style="margin-top:8px"><input type="checkbox" data-usado="${ri}" ${usados().includes(r.numero)?'disabled':'checked'}> Marcar el contrato ${esc(r.numero)} como usado ${usados().includes(r.numero)?'(ya lo está)':''}</label>`:''}`}</div>`}
function renderImp(){const{modo,res}=impEstado,ok=res.filter(r=>!r.error);
 $('impt').textContent=modo==='actualizar'?`Actualizar «${D.perfiles[ok[0]?.dest??catI].nombre}» desde Word`:modo==='lote'?`Actualizar varios perfiles desde Word (${res.length} archivo${res.length===1?'':'s'})`:res.length>1?`Crear ${res.length} perfiles desde Word`:'Crear perfil desde Word';
 $('impbody').innerHTML=(modo==='lote'?`<p class="hint">El programa reconoció a qué perfil corresponde cada archivo. Revise cada uno: puede cambiar el perfil, crearlo como nuevo o no usarlo.</p>`:'')+res.map(tarjetaImp).join('');
 renderImpBtn()}
function renderImpBtn(){const{modo,res}=impEstado,ok=res.filter(r=>!r.error&&r.dest!=='no');
 const na=ok.filter(r=>typeof r.dest==='number').length,nn=ok.filter(r=>r.dest==='nuevo').length;
 $('impok').textContent=modo==='actualizar'?'Actualizar perfil':modo==='crear'?(nn>1?'Crear perfiles':'Crear perfil'):[na?`Actualizar ${na} perfil${na===1?'':'es'}`:'',nn?`crear ${nn}`:''].filter(Boolean).join(' y ')||'Nada que guardar';
 $('impok').disabled=!ok.length}
$('impbody').addEventListener('change',e=>{const d=e.target.closest('[data-dest]');if(!d)return;const r=impEstado.res[+d.dataset.dest];
 r.dest=d.value==='nuevo'||d.value==='no'?d.value:+d.value;r.cambiado=true;
 const y=$('imp').querySelector('.box').scrollTop;renderImp();$('imp').querySelector('.box').scrollTop=y});
function aplicarImp(){const{modo,res}=impEstado;let nuevos=0,act=0;const marcar=[];
 const vacio=[...document.querySelectorAll('#impbody [data-nombre]')].find(el=>!el.value.trim());if(vacio){vacio.classList.add('bad');vacio.focus();vacio.placeholder='Escriba aquí el nombre del perfil';return}
 res.forEach((r,ri)=>{if(r.error||r.dest==='no')return;const p=r.p;
  const cb=document.querySelector(`[data-usado="${ri}"]`);if(r.numero&&cb&&cb.checked)marcar.push(r.numero);
  if(typeof r.dest==='number'){const t=D.perfiles[r.dest];let n=0;
   document.querySelectorAll(`.imp[data-ri="${ri}"] [data-campo]:checked`).forEach(c=>{const k=c.dataset.campo;n++;
    if(k==='vigpago'){['mesesSug','vigTexto','vigSug','pagoTexto','pagoSug'].forEach(z=>t[z]=p[z])}else t[k]=p[k]});
   if(n)act++;catI=r.dest}
  else{const nombre=(document.querySelector(`[data-nombre="${ri}"]`)?.value||p.nombre).trim()||'Nuevo perfil';
   const base=sinTildes(nombre).replace(/[^a-z]+/g,'-').replace(/^-|-$/g,'')||'perfil';let id=base,n=2;while(D.perfiles.some(x=>x.id===id))id=base+'-'+n++;
   D.perfiles.push({...p,id,nombre});catI=D.perfiles.length-1;nuevos++}});
 if(marcar.length)AJ.usados=[...new Set(usados().concat(marcar))].join(', ');
 $('imp').classList.remove('on');impEstado=null;renderAj();renderPerfilSel();renderCat();render();guardar();
 const msg=[act?`${act} perfil${act===1?'':'es'} actualizado${act===1?'':'s'}`:'',nuevos?`${nuevos} perfil${nuevos===1?'':'es'} creado${nuevos===1?'':'s'}`:''].filter(Boolean).join(' y ')||'No se cambió nada';
 $('catmsg').textContent='✓ '+msg+'. Revise los datos abajo y corrija lo que haga falta.';$('catmsg').hidden=false;setTimeout(()=>$('catmsg').hidden=true,9000);
 $('cat').scrollIntoView({block:'start',behavior:'smooth'});
}
let origenModo='crear',partesSel={};
function abrirOrigen(modo){origenModo=modo;partesSel={};
 $('orit').textContent=modo==='actualizar'?`Actualizar «${D.perfiles[catI].nombre}» desde Word`:'Crear perfil desde Word';
 $('oriuno').querySelector('small').textContent=modo==='actualizar'?'Un archivo con los 7 documentos seguidos.':'Un archivo con los 7 documentos seguidos. Puede elegir varios expedientes a la vez: se crea un perfil por cada uno.';
 $('oripartes').hidden=true;renderPartes();$('origen').classList.add('on');$('oriuno').focus()}
function renderPartes(){$('partes').innerHTML=DOCLIST.map(([k,n],i)=>`<div class="parte"><span><b>${i+1}. ${esc(n)}</b><small>${partesSel[k]?'📎 '+esc(partesSel[k].name):'sin adjuntar'}</small></span>
  <span class="pbtn">${partesSel[k]?`<button type="button" class="btn sm" data-quitarp="${k}" aria-label="Quitar ${esc(n)}">×</button>`:''}<button type="button" class="btn sm" data-parte="${k}">${partesSel[k]?'Cambiar':'Adjuntar'}</button></span></div>`).join('');
 const n=Object.values(partesSel).filter(Boolean).length;$('orileer').disabled=!n;$('orileer').textContent=n?`Leer ${n} documento${n===1?'':'s'}`:'Leer documentos'}
$('catword').onclick=()=>abrirOrigen('crear');
$('catwordup').onclick=()=>{$('alcnom').textContent=D.perfiles[catI].nombre;$('alcance').classList.add('on');$('alcuno').focus()};
$('alcuno').onclick=()=>{$('alcance').classList.remove('on');abrirOrigen('actualizar')};
$('alcvarios').onclick=()=>{$('alcance').classList.remove('on');$('wordfile').dataset.modo='lote';$('wordfile').multiple=true;$('wordfile').click()};
$('alcc').onclick=()=>$('alcance').classList.remove('on');
$('alcance').addEventListener('keydown',e=>{if(e.key==='Escape')$('alcance').classList.remove('on')});
$('oriuno').onclick=()=>{$('origen').classList.remove('on');$('wordfile').dataset.modo=origenModo;$('wordfile').multiple=origenModo==='crear';$('wordfile').click()};
$('orivarios').onclick=()=>{$('oripartes').hidden=false;$('partes').querySelector('[data-parte]').focus()};
$('partes').addEventListener('click',e=>{const a=e.target.closest('[data-parte]'),q=e.target.closest('[data-quitarp]');
 if(q){delete partesSel[q.dataset.quitarp];renderPartes();return}
 if(a){$('partefile').dataset.k=a.dataset.parte;$('partefile').click()}});
$('partefile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f){partesSel[e.target.dataset.k]=f;renderPartes()}};
$('orileer').onclick=()=>{$('origen').classList.remove('on');importarPartes(partesSel,origenModo)};
$('oric').onclick=()=>$('origen').classList.remove('on');
$('origen').addEventListener('keydown',e=>{if(e.key==='Escape')$('origen').classList.remove('on')});
$('wordfile').onchange=e=>{const fs=[...e.target.files];e.target.value='';if(fs.length)importarWord(fs,e.target.dataset.modo)};
$('impok').onclick=aplicarImp;$('impc').onclick=()=>{$('imp').classList.remove('on');impEstado=null};
$('imp').addEventListener('keydown',e=>{if(e.key==='Escape')$('imp').classList.remove('on')});
