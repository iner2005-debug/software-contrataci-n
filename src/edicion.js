/* ============================================================
   FORMULARIO Y DOCUMENTO A LA VEZ + "✎ EDITAR" EN CADA DATO
   - Al entrar a una casilla, el documento cambia a la hoja donde
     sale ese dato, se desplaza hasta él y lo resalta.
   - Al tocar o pasar el mouse por un dato resaltado del documento,
     aparece "✎ Editar", que lleva a la casilla de donde sale
     (formulario, Catálogo o Ajustes).
   - En pantallas angostas (celular) se alterna Formulario / Documento.
   ============================================================ */
let campoActivo='',editF='';
const angosta=()=>matchMedia('(max-width:900px)').matches;
/* qué marcas del documento corresponden a una casilla del formulario */
const marcasDe=k=>['meses','vdias','vini','vfin','vigt'].includes(k)?['plazo']:['ncuotas','pagos','pagot'].includes(k)?['pago']:k==='valor'?['valor','pago']:[k];
const docTiene=(d,fs)=>{const c=compute();return JSON.stringify(bloques(d,c)).match(new RegExp(fs.map(f=>`"f":"${f}"`).join('|')))};

function vista(v){const app=document.querySelector('#v-nuevo .app');app.classList.toggle('ver-doc',v==='doc');
 document.querySelectorAll('#vista [data-vista]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.vista===v));
 if(v==='doc'&&campoActivo)setTimeout(()=>seguir(campoActivo,false),50)}
document.querySelectorAll('#vista [data-vista]').forEach(b=>b.onclick=()=>{vista(b.dataset.vista);window.scrollTo({top:document.querySelector('#v-nuevo').offsetTop})});

function brillo(el){el.classList.remove('brillo');void el.offsetWidth;el.classList.add('brillo');setTimeout(()=>el.classList.remove('brillo'),1600)}

/* lleva el documento hasta el dato que se está llenando */
function seguir(k,cambiarHoja){
 const fs=marcasDe(k),sel=fs.map(f=>`#paper mark[data-f="${f}"]`).join(',');
 let L=[...document.querySelectorAll(sel)];
 if(!L.length&&cambiarHoja){const d=DOCLIST.find(([d])=>docTiene(d,fs));if(d&&d[0]!==doc){doc=d[0];renderTabs();render();L=[...document.querySelectorAll(sel)]}}
 if(!L.length||(angosta()&&!document.querySelector('#v-nuevo .app').classList.contains('ver-doc')))return;
 const desk=document.querySelector('.desk'),m=L[0];
 if(!angosta()){const r=m.getBoundingClientRect(),dr=desk.getBoundingClientRect();
  if(r.top<dr.top+90||r.bottom>dr.bottom-40)desk.scrollTo({top:desk.scrollTop+r.top-dr.top-dr.height/3,behavior:'smooth'})}
 else m.scrollIntoView({block:'center',behavior:'smooth'});
 L.forEach(brillo);
}
$('f').addEventListener('focusin',e=>{const k=e.target.classList.contains('pagoIn')?'pagos':e.target.id;if(!F.includes(k)||k==='perfil')return;campoActivo=k;seguir(k,true)});
$('f').addEventListener('input',e=>{const k=e.target.classList.contains('pagoIn')?'pagos':e.target.id;if(!F.includes(k)||k==='perfil')return;campoActivo=k;
 requestAnimationFrame(()=>{const L=document.querySelectorAll(marcasDe(k).map(f=>`#paper mark[data-f="${f}"]`).join(','));L.forEach(m=>m.classList.add('vivo'))})});

/* botón "✎ Editar" sobre el dato */
const eb=$('editbtn');
function mostrarEditar(m){editF=m.dataset.f;const desk=document.querySelector('.desk'),r=m.getClientRects()[0]||m.getBoundingClientRect(),dr=desk.getBoundingClientRect();
 eb.innerHTML=`✎ Editar <span>${esc(m.dataset.l||'')}</span>`;eb.hidden=false;
 const w=eb.offsetWidth;let left=r.left-dr.left+desk.scrollLeft;left=Math.max(6,Math.min(left,desk.clientWidth-w-6));
 eb.style.left=left+'px';eb.style.top=(r.top-dr.top+desk.scrollTop-eb.offsetHeight-4)+'px';
 document.querySelectorAll('#paper mark.sel').forEach(x=>x.classList.remove('sel'));
 document.querySelectorAll(`#paper mark[data-f="${editF}"]`).forEach(x=>x.classList.add('sel'))}
function ocultarEditar(){eb.hidden=true;document.querySelectorAll('#paper mark.sel').forEach(x=>x.classList.remove('sel'))}
$('paper').addEventListener('mouseover',e=>{const m=e.target.closest('mark[data-f]');if(m&&matchMedia('(hover:hover)').matches)mostrarEditar(m)});
$('paper').addEventListener('click',e=>{const m=e.target.closest('mark[data-f]');if(m)mostrarEditar(m);else ocultarEditar()});
document.querySelector('.desk').addEventListener('mouseleave',ocultarEditar);
eb.addEventListener('click',()=>{const f=editF;ocultarEditar();irCampo(f)});
const _render=render;render=function(){_render();if(!eb.hidden)ocultarEditar()};

/* abre la casilla de donde sale el dato */
function irCampo(f){
 if(f==='plazo')f={meses:'meses',dias:'meses',fechas:'vini',texto:'vigt'}[vModo()];
 if(f==='pago'){const m=pModo();if(m==='varios'){if(angosta())vista('form');const el=document.querySelector('#pagosUI .pagoIn')||$('addPago');el.scrollIntoView({block:'center'});el.focus();brillo(el);return}f={iguales:'ncuotas',unico:'valor',texto:'pagot'}[m]}
 if(f.startsWith('cat:')){const k=f.slice(4);irA('catalogo');catI=Math.max(0,D.perfiles.findIndex(p=>p.id===S.perfil));$('catsel').value=catI;renderCat();
  const el=$('c-'+k);if(el){el.scrollIntoView({block:'center'});el.focus({preventScroll:true});brillo(el)}return}
 if(f.startsWith('aj:')){const k=f.slice(3);irA('ajustes');const el=$('aj-'+k);if(el){el.scrollIntoView({block:'center'});el.focus({preventScroll:true});brillo(el)}return}
 if(angosta())vista('form');
 const el=$(f);if(!el)return;const det=el.closest('details');if(det)det.open=true;
 el.scrollIntoView({block:'center',behavior:'smooth'});el.focus({preventScroll:true});brillo(el);
}
