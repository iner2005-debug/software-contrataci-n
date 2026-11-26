const D=__DATA__;
const ASSETS=__ASSETS__;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const AJ={entidad:'EMPRESA SOCIAL DEL ESTADO HOSPITAL LOCAL MARIA LA BAJA',nit:'806.010.788-1',municipio:'María La Baja',depto:'Bolívar',direccion:'Barrio Chumbún, Calle 20 # 8-78',
 gerente:'LUDIS ELENA CHAVEZ BARRIOS',gerCc:'43.186.139',gerExp:'Itagüí – Antioquia',gerDecreto:'Decreto N° 045 del 21 de marzo de 2024',gerActa:'Acta de Posesión No. 68 del 01 de abril de 2024',
 supAdm:'MARIA ELISA CUETO ISAZA',supAdmCargo:'SUBGERENTE ADMINISTRATIVA',supCie:'ALISNEI DEL CARMEN TEHERAN ZUÑIGA',supCieCargo:'SUBGERENTE CIENTÍFICA',
 manual:'Acuerdo No. G02-003-2025',manualFecha:'03 de marzo de 2025',proyecto:'Asesor jurídico',prefijo:'C-HLMLB',smmlv:1750905,usados:D.usados.join(', ')};
const AJL={entidad:'Nombre de la entidad',nit:'NIT',municipio:'Municipio',depto:'Departamento',direccion:'Dirección para propuestas',gerente:'Gerente (representante legal)',gerCc:'Cédula de la gerente',gerExp:'Lugar de expedición',gerDecreto:'Decreto de nombramiento',gerActa:'Acta de posesión',
 supAdm:'Subgerente administrativa (firma necesidad e idoneidad)',supAdmCargo:'Cargo',supCie:'Subgerente científica (supervisa perfiles asistenciales)',supCieCargo:'Cargo',manual:'Manual de contratación',manualFecha:'Fecha del manual de contratación',proyecto:'Proyectó y elaboró (pie del contrato)',prefijo:'Prefijo del número de contrato',smmlv:'SMMLV vigente ($)',usados:'Números de contrato ya usados'};
if(D.ajustes)Object.keys(AJ).forEach(k=>{if(k!=='usados'&&D.ajustes[k]!=null)AJ[k]=D.ajustes[k]});
const F=['perfil','nombre','tdoc','ndoc','sexo','exped','tel','correo','dir','valor','vmodo','meses','vdias','vini','vfin','vigt','pmodo','ncuotas','pagos','pagot','cdp','rp','consec','fnec','fcdp','fsus'];

/* número a letras */
const U=['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve'];
const T=['','','','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
const H=['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
const f3=n=>{if(n===100)return'cien';const c=Math.floor(n/100),r=n%100;const rs=r===0?'':r<30?U[r]:T[Math.floor(r/10)]+(r%10?' y '+U[r%10]:'');return[H[c],rs].filter(Boolean).join(' ')};
const ap=s=>s.replace(/veintiuno$/,'veintiún').replace(/uno$/,'un');
const letras=n=>{n=Math.floor(n);if(n===0)return'cero';const m=Math.floor(n/1e6),k=Math.floor(n%1e6/1e3),r=n%1e3,o=[];
 if(m)o.push(m===1?'un millón':ap(letras(m))+' millones');if(k)o.push(k===1?'mil':ap(f3(k))+' mil');if(r)o.push(f3(r));return o.join(' ')};
const pesos=n=>{let s=ap(letras(n));const de=n>=1e6&&n%1e6===0;return(s+(de?' de pesos':' pesos')).toUpperCase()+' M/CTE.'};
const money=n=>'$'+Math.round(n).toLocaleString('es-CO');
const plazo=m=>m==1?'UN (01) MES':(ap(letras(m)).toUpperCase()+' ('+String(m).padStart(2,'0')+') MESES');
const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const pd=s=>{if(!s)return null;const[y,m,d]=s.split('-').map(Number);return{y,m,d}};
const fechaL=s=>{const f=pd(s);if(!f)return null;const dl=f.d===1?'primero':letras(f.d);return`${dl} (${String(f.d).padStart(2,'0')}) del mes de ${MES[f.m-1]} del año ${letras(f.y)} (${f.y})`};
const fechaC=s=>{const f=pd(s);return f?`${String(f.d).padStart(2,'0')} de ${MES[f.m-1]} de ${f.y}`:null};
const cc=s=>{const d=String(s||'').replace(/\D/g,'');return d?Number(d).toLocaleString('es-CO'):''};
const usados=()=>String(AJ.usados).split(/[,\s]+/).filter(Boolean);
const nextConsec=()=>Math.max(0,...usados().map(u=>Number(u.split('-').pop())||0))+1;

let S={},doc='nec',catI=0;
const PA=()=>D.perfiles.find(p=>p.id===S.perfil)||D.perfiles[0];
const SUP=p=>p.supervisor==='cie'?{n:AJ.supCie,c:AJ.supCieCargo}:{n:AJ.supAdm,c:AJ.supAdmCargo};

function compute(){
 const p=PA(),val=Number(String(S.valor).replace(/\D/g,''))||0,f=pd(S.fsus);
 const vig=vigencia(),pg=formaPago(val,vig);
 const num=(S.consec&&f)?`${AJ.prefijo}-${f.y}${String(f.m).padStart(2,'0')}${String(f.d).padStart(2,'0')}-${String(S.consec).padStart(2,'0')}`:'';
 const tr=S.sexo==='f'?{sr:'la señora',id:'identificada',al:'la CONTRATISTA',inc:'incursa'}:S.sexo==='m'?{sr:'el señor',id:'identificado',al:'el CONTRATISTA',inc:'incurso'}:{sr:'el (la) señor (a)',id:'identificado (a)',al:'el (la) CONTRATISTA',inc:'incurso (a)'};
 const obl=[...D.general.contratistaIni,...p.obligaciones,...D.general.contratistaFin];
 return{p,val,vig,pg,num,tr,obl,sup:SUP(p),anio:f?f.y:'',
  valL:val?pesos(val)+' '+money(val):'',plazoL:vig.texto,pagoTxt:pg.texto,cuotasIguales:pg.modo==='iguales',fnecL:fechaL(S.fnec),fsusL:fechaL(S.fsus),fcdpC:fechaC(S.fcdp),
  doc:S.ndoc?`${S.tdoc} N° ${cc(S.ndoc)}`:''};
}

function checks(c){
 const L=[],req=[['nombre','Nombre del contratista'],['ndoc','Número de documento'],['valor','Valor'],['cdp','No. CDP'],['rp','No. RP'],['consec','Consecutivo'],['fnec','Fecha de necesidad'],['fcdp','Fecha del CDP'],['fsus','Fecha de suscripción']];
 const miss=req.filter(([k])=>!String(S[k]??'').trim());
 const campoVig={meses:'meses',dias:'meses',fechas:S.vini?'vfin':'vini',texto:'vigt'}[c.vig.modo],campoPago={iguales:'ncuotas',varios:'pagos',texto:'pagot'}[c.pg.modo];
 if(c.vig.falta)miss.push([campoVig,c.vig.falta]);if(c.pg.falta&&c.val)miss.push([campoPago,c.pg.falta]);
 F.forEach(k=>{const el=$(k);if(el)el.classList.toggle('bad',miss.some(x=>x[0]===k))});
 L.push(miss.length?['err','Faltan '+miss.length+' datos: '+miss.map(x=>x[1]).join(', ')]:['','Todos los datos obligatorios están completos']);
 if(c.vig.error)L.push(['err','Vigencia: '+c.vig.error]);
 else if(c.vig.modo==='fechas'&&S.fsus&&S.vini&&S.vini<S.fsus)L.push(['warn','La vigencia empieza antes de la fecha de suscripción']);
 if(c.val&&!c.pg.falta){if(c.pg.error)L.push(['err','Forma de pago: '+c.pg.error]);
  else if(c.pg.modo==='iguales')L.push(['',c.pg.n===1?`Un solo pago de ${money(c.val)}`:`Cuotas exactas: ${c.pg.n} × ${money(c.pg.cuota)}`]);
  else if(c.pg.modo==='varios')L.push(['',`Los ${c.pg.n} pagos suman exactamente ${money(c.val)}`]);
  else if(c.pg.modo==='texto')L.push(['warn','Forma de pago escrita a mano: verifique que sume '+money(c.val)]);}
 if(c.val){const tope=28*AJ.smmlv;L.push(c.val<=tope?['',`Dentro del tope de contratación directa (28 SMMLV = ${money(tope)})`]:['err',`Supera 28 SMMLV (${money(tope)})`])}
 if(S.ndoc&&!/^\d{5,11}$/.test(String(S.ndoc).replace(/\D/g,'')))L.push(['err','El número de documento no parece válido']);
 if(S.cdp&&!/^\d{4}\.CEN\.\d{2}\.\d{6}$/i.test(S.cdp.trim()))L.push(['warn','El número de CDP no tiene el formato AAAA.CEN.00.000000']);
 if(S.fnec&&S.fcdp&&S.fsus){const ok=S.fnec<=S.fcdp&&S.fcdp<=S.fsus;L.push(ok?['','Fechas en orden: necesidad → CDP → suscripción']:['err','Fechas fuera de orden: la necesidad debe ir antes del CDP y este antes de la suscripción'])}
 if(c.num)L.push(!usados().includes(c.num)?['',`Número de contrato libre: ${c.num}`]:esReimpresion(c.num)?['warn',`Reimpresión: el contrato ${c.num} ya está registrado para esta persona`]:['err',`El contrato ${c.num} ya existe (cambie el consecutivo)`]);
 if(!S.sexo)L.push(['warn','Sin definir el trato: saldrá "el (la) señor (a)"']);
 const errs=L.filter(x=>x[0]==='err').length;
 $('checks').innerHTML=L.map(([k,t])=>`<li class="${k}">${esc(t)}</li>`).join('');
 $('pill').textContent=errs?errs+(errs>1?' errores':' error'):'Listo para generar';$('pill').className='pill '+(errs?'bad':'ok');
 $('gen').disabled=!!errs;
}

function calcBox(c){
 $('calc').innerHTML=`<small>Calculado automáticamente</small>
 <div><span>No. contrato</span><b>${esc(c.num||'—')}</b></div>
 <div><span>Valor en letras</span><b>${esc(c.val?pesos(c.val):'—')}</b></div>
 <div><span>Pago</span><b>${esc(!c.val||c.pg.falta?'—':c.pg.modo==='iguales'?(c.pg.n===1?'Un solo pago':`${c.pg.n} cuotas de ${money(c.pg.cuota)}`):c.pg.modo==='unico'?'Un solo pago':c.pg.modo==='varios'?`${c.pg.n} pagos diferentes`:'Texto propio')}</b></div>
 <div><span>Vigencia</span><b>${esc(c.plazoL||'—')}</b></div>
 <div><span>Rubro</span><b>${esc(c.p.rubro)}</b></div>
 <div><span>Supervisa</span><b>${esc(c.sup.c)}</b></div>`;
 $('perfinfo').textContent=`${c.p.tipo} · ${c.p.obligaciones.length} obligaciones específicas · ${c.p.alcances.length} alcances · rubro ${c.p.rubroNombre}`;
}

function renderTabs(){$('doctabs').innerHTML=DOCLIST.map(([k,n])=>`<button type="button" role="tab" aria-selected="${k===doc}" data-d="${k}">${n}</button>`).join('')}
function render(){const c=compute();calcBox(c);checks(c);$('paper').innerHTML=aHTML(bloques(doc,c))}
function read(){F.forEach(k=>S[k]=$(k).value)}
function set(o){Object.entries(o).forEach(([k,x])=>{if($(k))$(k).value=x??''});read();render();guardar()}
function sugerir(p){set(sugPerfil(p))}

function renderPerfilSel(){
 const g={};D.perfiles.forEach(p=>(g[p.tipo]=g[p.tipo]||[]).push(p));
 const cur=$('perfil').value;
 $('perfil').innerHTML=Object.entries(g).map(([t,L])=>`<optgroup label="${esc(t==='SERVICIOS PROFESIONALES'?'Servicios profesionales':'Apoyo a la gestión')}">${L.map(p=>`<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join('')}</optgroup>`).join('');
 if(cur&&D.perfiles.some(p=>p.id===cur))$('perfil').value=cur;
 $('nperf').textContent=D.perfiles.length;
 $('catsel').innerHTML=D.perfiles.map((p,i)=>`<option value="${i}">${esc(p.nombre)}</option>`).join('');$('catsel').value=catI;
}

$('f').addEventListener('input',e=>{if(e.target.id==='perfil')return;read();if(e.target.id==='ndoc')buscarCedula();render();guardar()});
$('perfil').addEventListener('change',()=>{read();sugerir(PA())});
$('ejload').onclick=()=>{const p=PA(),e=p.ejemplo||{};set({...e,consec:nextConsec(),...sugPerfil(p)});buscarCedula()};
$('vaciar').onclick=()=>{set({nombre:'',ndoc:'',sexo:'',exped:'',tel:'',correo:'',dir:'',cdp:'',rp:'',consec:nextConsec(),fnec:'',fcdp:'',fsus:''});buscarCedula()};
$('doctabs').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;doc=b.dataset.d;renderTabs();render()});
function irA(v){document.querySelectorAll('.tabs [data-v]').forEach(x=>x.setAttribute('aria-selected',x.dataset.v===v));document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+v));if(v==='contratistas')renderCt()}
document.querySelectorAll('.tabs [data-v]').forEach(b=>b.onclick=()=>irA(b.dataset.v));
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('paper').innerText);$('copy').textContent='Copiado'}catch(e){$('copy').textContent='No se pudo copiar'}setTimeout(()=>$('copy').textContent='Copiar texto',1600)};
/* ---- generar: elegir documentos, formato y forma de entrega ---- */
const KO='contratacion-hlmlb-opciones';
function opciones(){try{return JSON.parse(localStorage.getItem(KO))||{}}catch(e){return{}}}
function abrirGenerar(){const c=compute(),o=opciones();
 $('dlgs').textContent=`Contrato ${c.num} · ${S.nombre} · ${money(c.val)}`;
 $('gdocs').innerHTML=DOCLIST.map(([k,n],i)=>`<label class="chk"><input type="checkbox" value="${k}" ${!o.docs||o.docs.includes(k)?'checked':''}> ${i+1}. ${esc(n)}</label>`).join('');
 document.querySelectorAll('[name=gfmt]').forEach(r=>r.checked=r.value===(o.fmt||'pdf'));
 document.querySelectorAll('[name=gmodo]').forEach(r=>r.checked=r.value===(o.modo||'uno'));
 $('gmsg').textContent='';$('gmsg').className='gmsg';syncGen();$('dlg').classList.add('on');$('gok').focus()}
function syncGen(){const fmt=document.querySelector('[name=gfmt]:checked')?.value,n=document.querySelectorAll('#gdocs input:checked').length;
 $('gmodobox').hidden=fmt==='imp';$('gok').disabled=!n;
 $('gok').textContent=fmt==='imp'?'Imprimir':n===DOCLIST.length?'Generar expediente completo':`Generar ${n} documento${n===1?'':'s'}`}
$('dlg').addEventListener('change',syncGen);
$('gtodos').onclick=()=>{const L=[...document.querySelectorAll('#gdocs input')],t=L.some(i=>!i.checked);L.forEach(i=>i.checked=t);syncGen()};
$('f').addEventListener('submit',e=>{e.preventDefault();abrirGenerar()});
$('dlgc').onclick=()=>$('dlg').classList.remove('on');
$('dlg').addEventListener('keydown',e=>{if(e.key==='Escape')$('dlg').classList.remove('on')});
$('gok').onclick=async()=>{
 const sel=[...document.querySelectorAll('#gdocs input:checked')].map(i=>i.value),fmt=document.querySelector('[name=gfmt]:checked').value,modo=fmt==='imp'?'uno':document.querySelector('[name=gmodo]:checked').value;
 try{localStorage.setItem(KO,JSON.stringify({docs:sel,fmt,modo}))}catch(e){}
 const c=compute(),base=limpioNombre(`${c.num} - ${S.nombre}`),todos=sel.length===DOCLIST.length;
 const lista=DOCLIST.map(([k,n],i)=>({k,n,i})).filter(d=>sel.includes(d.k)),bl=d=>bloques(d.k,c);
 const tituloUno=todos?'Expediente':lista.length===1?`${lista[0].i+1} ${lista[0].n}`:'Documentos';
 $('gok').disabled=true;$('gmsg').className='gmsg';$('gmsg').textContent='Generando… (puede tardar unos segundos)';
 try{
  const salen=[];
  if(fmt==='imp'){imprimirPDF(await hacerPDF(lista.map(bl),`${c.num} ${tituloUno}`));salen.push('Se abrió la impresión. Puede elegir la impresora o "Guardar como PDF".')}
  else{const quiere={word:fmt==='word'||fmt==='ambos',pdf:fmt==='pdf'||fmt==='ambos'};
   if(modo==='uno'){
    if(quiere.word){bajar(await hacerWord(lista.map(bl),`${c.num} ${tituloUno}`),`${base} - ${tituloUno}.docx`);salen.push(`${base} - ${tituloUno}.docx`)}
    if(quiere.pdf){bajar(await hacerPDF(lista.map(bl),`${c.num} ${tituloUno}`),`${base} - ${tituloUno}.pdf`);salen.push(`${base} - ${tituloUno}.pdf`)}
   }else{const z=new JSZip();
    for(const d of lista){const nom=`${d.i+1} ${d.n}`;
     if(quiere.word)z.file(`${base} - ${nom}.docx`,await hacerWord([bl(d)],`${c.num} ${nom}`));
     if(quiere.pdf)z.file(`${base} - ${nom}.pdf`,await hacerPDF([bl(d)],`${c.num} ${nom}`))}
    bajar(await z.generateAsync({type:'blob'}),`${base}.zip`);salen.push(`${base}.zip (${Object.keys(z.files).length} archivos)`)}
  }
  registrarContrato(c);
  if(!usados().includes(c.num)){AJ.usados=usados().concat(c.num).join(', ');renderAj()}
  guardar();render();
  $('gmsg').className='gmsg ok';$('gmsg').innerHTML='<b>Listo.</b> '+salen.map(esc).join('<br>')+`<br><span class="note">${esc(S.nombre)} quedó guardado en Contratistas.</span>`;
 }catch(err){console.error(err);$('gmsg').className='gmsg bad';$('gmsg').textContent='No se pudo generar: '+(err&&err.message||err)}
 $('gok').disabled=false;
};

function renderAj(){$('aj').innerHTML=`<div class="row">${Object.keys(AJ).map(k=>k==='usados'?'':`<div><label for="aj-${k}">${esc(AJL[k])}</label><input id="aj-${k}" data-k="${k}" value="${esc(AJ[k])}"></div>`).join('')}</div>
 <label for="aj-usados">${esc(AJL.usados)} (${usados().length})</label><textarea id="aj-usados" data-k="usados" style="min-height:110px">${esc(AJ.usados)}</textarea>`}
$('aj').addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;AJ[k]=k==='smmlv'?Number(e.target.value.replace(/\D/g,''))||0:e.target.value;render();guardar()});

const TA=(i,k,lbl,h)=>{const p=D.perfiles[i],arr=Array.isArray(p[k]);return`<label for="c-${k}">${lbl}</label><textarea id="c-${k}" data-k="${k}" ${arr?'data-l="1"':''} style="min-height:${h}px">${esc(arr?p[k].join('\n'):p[k])}</textarea>`};
function renderCat(){const i=catI,p=D.perfiles[i];$('cat').innerHTML=`<div class="card">
 <label for="c-nombre">Nombre del perfil</label><input id="c-nombre" data-k="nombre" value="${esc(p.nombre)}">
 <div class="row"><div><label for="c-tipo">Tipo</label><select id="c-tipo" data-k="tipo"><option${p.tipo==='SERVICIOS PROFESIONALES'?' selected':''}>SERVICIOS PROFESIONALES</option><option${p.tipo!=='SERVICIOS PROFESIONALES'?' selected':''}>APOYO A LA GESTIÓN</option></select></div>
 <div><label for="c-supervisor">Supervisa</label><select id="c-supervisor" data-k="supervisor"><option value="adm"${p.supervisor==='adm'?' selected':''}>Subgerente administrativa</option><option value="cie"${p.supervisor==='cie'?' selected':''}>Subgerente científica</option></select></div></div>
 ${TA(i,'objeto','Objeto',90)}
 <div class="row"><div><label for="c-rubro">Rubro</label><input id="c-rubro" data-k="rubro" value="${esc(p.rubro)}"></div><div><label for="c-rubroNombre">Nombre del rubro</label><input id="c-rubroNombre" data-k="rubroNombre" value="${esc(p.rubroNombre)}"></div></div>
 <div class="row"><div><label for="c-valorSug">Valor sugerido ($)</label><input id="c-valorSug" data-k="valorSug" data-n="1" value="${esc(p.valorSug)}"></div><div><label for="c-mesesSug">Meses sugeridos</label><input id="c-mesesSug" data-k="mesesSug" data-n="1" value="${esc(p.mesesSug)}"></div></div>
 ${(()=>{const[v,pg]=resumenSug(p);return`<label>Vigencia y forma de pago sugeridas</label>
 <div class="eco bien" style="margin-top:0">Vigencia: <b>${esc(v||'—')}</b><br>Pago: <b>${esc(pg||'—')}</b></div>
 <button type="button" class="btn sm" id="c-sugusar" style="margin-top:8px">Tomar las del formulario «Nuevo contrato»</button>
 <p class="hint" style="margin:6px 0 0">Se calculan solas con el valor y los meses sugeridos. Si este perfil se contrata distinto (por fechas, pagos diferentes…), llénelo así una vez en «Nuevo contrato» con este perfil y pulse el botón: queda guardado como sugerencia.</p>`})()}
 ${TA(i,'obligaciones','Obligaciones específicas (una por línea)',200)}
 ${TA(i,'alcances','Alcances (uno por línea)',150)}
 ${TA(i,'necesidad','Descripción de la necesidad (un párrafo por línea)',150)}
 ${TA(i,'conveniencia','Conveniencia y oportunidad (un párrafo por línea; vacío = texto general)',110)}
 ${TA(i,'consideraciones','Consideraciones específicas (una por línea)',90)}
 <label for="c-idoneidad">Requisito adicional de idoneidad</label><input id="c-idoneidad" data-k="idoneidad" value="${esc(p.idoneidad)}" placeholder="Ej.: y título profesional en Derecho"></div>`;
 renderPtab()}
function renderPtab(){$('ptab').innerHTML=`<thead><tr><th>Perfil</th><th>Supervisa</th><th>Oblig.</th><th>Valor sugerido</th></tr></thead><tbody>${D.perfiles.map((p,i)=>`<tr data-i="${i}"${i===catI?' class="sel"':''}><td data-l="Perfil"><b>${esc(p.nombre)}</b><br><span class="note">${p.tipo==='SERVICIOS PROFESIONALES'?'Profesional':'Apoyo a la gestión'} · ${esc(p.rubro)}</span></td><td data-l="Supervisa">${p.supervisor==='cie'?'Científica':'Administrativa'}</td><td class="n" data-l="Oblig.">${p.obligaciones.length}</td><td class="n" data-l="Valor">${esc(money(p.valorSug||0))}${p.vigTexto||p.pagoTexto||p.vigSug||p.pagoSug?' *':` / ${p.mesesSug} m`}</td></tr>`).join('')}</tbody>`}
$('ptab').addEventListener('click',e=>{const r=e.target.closest('tr[data-i]');if(!r)return;catI=+r.dataset.i;$('catsel').value=catI;renderCat();if(innerWidth<900)$('cat').scrollIntoView({block:'start'})});
$('catsel').onchange=()=>{catI=+$('catsel').value;renderCat()};
$('cat').addEventListener('input',e=>{const t=e.target,k=t.dataset.k;if(!k)return;const p=D.perfiles[catI];
 p[k]=t.dataset.l?t.value.split('\n').map(s=>s.trim()).filter(Boolean):t.dataset.n?Number(t.value.replace(/\D/g,''))||0:t.value;
 if(k==='nombre'||k==='tipo'){renderPerfilSel()}renderPtab();render();guardar()});
$('cat').addEventListener('change',e=>{if(e.target.tagName==='SELECT')e.target.dispatchEvent(new Event('input',{bubbles:true}))});
const addPerfil=base=>{const id='perfil-'+Date.now();D.perfiles.push({...JSON.parse(JSON.stringify(base)),id,nombre:base.nombre?base.nombre+' (copia)':'Nuevo perfil'});catI=D.perfiles.length-1;renderPerfilSel();renderCat();guardar()};
$('catnew').onclick=()=>addPerfil({nombre:'',tipo:'APOYO A LA GESTIÓN',supervisor:'adm',objeto:'',rubro:'',rubroNombre:'',idoneidad:'',necesidad:[],conveniencia:[],consideraciones:[],obligaciones:[],alcances:[],valorSug:0,mesesSug:2,vigTexto:'',pagoTexto:'',ejemplo:{}});
$('catdup').onclick=()=>addPerfil(D.perfiles[catI]);
/* sugerencia de vigencia y pago del perfil: se calcula sola o se toma del formulario */
function resumenSug(p){const antes=S;S={...S,...sugPerfil(p)};try{const v=vigencia(),pg=formaPago(Number(p.valorSug)||0,v);return[v.texto,pg.texto]}finally{S=antes}}
$('cat').addEventListener('click',e=>{if(e.target.id!=='c-sugusar')return;const p=D.perfiles[catI];
 if(S.perfil!==p.id&&!confirm(`El formulario «Nuevo contrato» tiene otro perfil (${PA().nombre}). ¿Usar igual su vigencia y forma de pago para «${p.nombre}»?`))return;
 const c=compute();if(c.vig.falta||c.pg.falta||c.vig.error||c.pg.error)return alert('Primero complete bien la vigencia y la forma de pago en «Nuevo contrato» (no debe haber avisos en rojo).');
 const vm=vModo(),pm=pModo();
 Object.assign(p,{valorSug:c.val||p.valorSug,mesesSug:Number(S.meses)||c.vig.meses||p.mesesSug,
  vigTexto:vm==='texto'?String(S.vigt||'').trim():'',pagoTexto:pm==='texto'?String(S.pagot||'').trim():'',
  vigSug:vm==='meses'?undefined:{vmodo:vm,meses:S.meses,vdias:S.vdias,vini:S.vini,vfin:S.vfin},
  pagoSug:pm==='iguales'&&!S.ncuotas?undefined:{pmodo:pm,ncuotas:S.ncuotas,pagos:listaPagos()}});
 renderCat();renderPtab();guardar()});

$('catdel').onclick=()=>{if(D.perfiles.length<2)return alert('Debe quedar al menos un perfil.');const p=D.perfiles[catI];
 if(!confirm(`¿Eliminar el perfil "${p.nombre}"? Esta acción no se puede deshacer (salvo con "Volver al original" o cargando una copia).`))return;
 D.perfiles.splice(catI,1);catI=Math.max(0,catI-1);renderPerfilSel();renderCat();if(!D.perfiles.some(x=>x.id===S.perfil)){$('perfil').value=D.perfiles[0].id;read();sugerir(PA())}render();guardar()};

/* ---- guardado en el navegador, copia de seguridad y restauración ---- */
const KEY='contratacion-hlmlb-v1';
const huella=t=>{let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return(h>>>0).toString(36)};
const BASE=huella(JSON.stringify(D));
let gT=0,gUlt=null,gErr=false,gViejo=false,cargando=true;
const hora=d=>d.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
function guardarYa(){try{localStorage.setItem(KEY,JSON.stringify({v:1,base:BASE,ts:Date.now(),general:D.general,perfiles:D.perfiles,ajustes:AJ,form:S}));gUlt=new Date();gErr=false}catch(e){gErr=true}}
function guardar(){if(cargando)return;clearTimeout(gT);gT=setTimeout(()=>{gT=0;guardarYa();renderSave()},300)}
/* si se cierra o recarga la página antes de los 300 ms, se guarda de inmediato */
addEventListener('pagehide',()=>{if(gT&&!cargando){clearTimeout(gT);gT=0;guardarYa()}});
function leerGuardado(){try{const t=localStorage.getItem(KEY);return t?JSON.parse(t):null}catch(e){return null}}
function aplicar(o){
 if(Array.isArray(o.perfiles)&&o.perfiles.length)D.perfiles=o.perfiles;
 if(o.general&&typeof o.general==='object')D.general={...D.general,...o.general};
 if(o.ajustes)Object.keys(AJ).forEach(k=>{if(o.ajustes[k]!=null)AJ[k]=o.ajustes[k]});
 if(Array.isArray(o.usados))AJ.usados=o.usados.join(', ');
 catI=Math.min(catI,D.perfiles.length-1);
}
function copiaJSON(){const aj={...AJ};delete aj.usados;return{general:D.general,perfiles:D.perfiles,usados:usados(),ajustes:aj,contratistas:REG}}
function descargar(){const b=new Blob([JSON.stringify(copiaJSON(),null,1)],{type:'application/json'}),a=document.createElement('a');
 const d=new Date(),f=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
 a.href=URL.createObjectURL(b);a.download=`copia-contratacion-${f}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function cargarArchivo(file){const r=new FileReader();r.onload=()=>{let o;try{o=JSON.parse(r.result)}catch(e){return alert('El archivo no es un JSON válido.')}
 if(!Array.isArray(o.perfiles)||!o.perfiles.length||!o.perfiles.every(p=>p&&p.id&&p.nombre&&Array.isArray(p.obligaciones)))return alert('El archivo no parece una copia del catálogo (falta la lista de perfiles).');
 const nct=o.contratistas?Object.keys(o.contratistas).length:0;
 if(!confirm(`Se cargarán ${o.perfiles.length} perfiles${Array.isArray(o.usados)?', '+o.usados.length+' números de contrato usados':''}${o.ajustes?' y los ajustes de la entidad':''}. Reemplaza el catálogo y los ajustes que hay ahora en este navegador.${nct?`\n\nTambién trae ${nct} contratistas: se suman a los que ya hay (no se borra ninguno).`:''}\n\n¿Continuar?`))return;
 aplicar(o);if(nct)fusionarReg(o.contratistas);gViejo=false;refrescar();renderCt();buscarCedula(true);guardar()};r.readAsText(file,'utf-8')}
function refrescar(){renderAj();renderPerfilSel();renderCat();if(!D.perfiles.some(x=>x.id===S.perfil)){$('perfil').value=D.perfiles[0].id;read()}render()}
function restaurar(){if(!confirm('Se borrarán de este navegador los cambios del catálogo y los ajustes, y se volverá al catálogo original del programa. Los contratistas registrados NO se borran. Si quiere conservar los cambios, primero use "Descargar copia". ¿Continuar?'))return;
 cargando=true;clearTimeout(gT);try{localStorage.removeItem(KEY)}catch(e){}location.reload()}
function renderSave(){const st=gErr?`<b class="bad">✕ Este navegador no permite guardar.</b> Use "Descargar copia" para no perder los cambios.`
  :gUlt?`<b class="ok">✓ Cambios guardados en este navegador</b> · ${hora(gUlt)}`:`<b class="ok">✓ Se guarda solo en este navegador</b>`;
 document.querySelectorAll('[data-sb]').forEach(el=>el.innerHTML=`<div class="sbtop"><span>${st}</span>
  <span class="sbbtn"><button type="button" class="btn sm" data-a="down">Descargar copia</button><button type="button" class="btn sm" data-a="up">Cargar copia</button><button type="button" class="btn sm" data-a="reset">Volver al original</button></span></div>
  ${gViejo?`<p class="sbwarn">El catálogo del programa cambió después de sus cambios guardados; se están usando <b>sus cambios</b>. Para usar el catálogo nuevo, pulse "Volver al original".</p>`:''}
  <p class="note" style="margin:6px 0 0">Lo guardado aquí (catálogo, ajustes y contratistas) solo existe en este computador y este navegador. Descargue la copia con frecuencia como respaldo; con "Cargar copia" se pasa a otro equipo.</p>`)}
document.addEventListener('click',e=>{const a=e.target.closest('[data-sb] [data-a]')?.dataset.a;if(!a)return;
 if(a==='down')descargar();else if(a==='up')$('impfile').click();else if(a==='reset')restaurar()});
$('impfile').onchange=e=>{const f=e.target.files[0];if(f)cargarArchivo(f);e.target.value=''};

