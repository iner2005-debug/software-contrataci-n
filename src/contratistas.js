/* ============================================================
   REGISTRO DE CONTRATISTAS
   Cada vez que se genera un expediente, se guardan los datos de la
   persona y del contrato. Al digitar una cédula ya registrada, el
   formulario se llena solo y se muestran sus contratos anteriores.
   Se guarda en este navegador (aparte del catálogo: "Volver al
   original" no lo borra) y viaja en "Descargar copia".
   ============================================================ */
const KC='contratacion-hlmlb-contratistas-v1';
const PERS=['nombre','tdoc','sexo','tel','correo','dir','exped'];
const CONTR=['perfil','meses','valor','vigt','pagot','cdp','rp','consec','fnec','fcdp','fsus'];
let REG={},regErr=false,fichaK='',ctSel='';
const ced=s=>String(s||'').replace(/\D/g,'');
function cargarReg(){try{REG=JSON.parse(localStorage.getItem(KC)||'{}')||{}}catch(e){REG={}}}
function guardarReg(){try{localStorage.setItem(KC,JSON.stringify(REG));regErr=false}catch(e){regErr=true}}
const contratosDe=p=>[...(p.contratos||[])].sort((a,b)=>String(b.fsus||'').localeCompare(String(a.fsus||''))||b.ts-a.ts);
const perfilNombre=id=>(D.perfiles.find(p=>p.id===id)||{}).nombre;
const esReimpresion=num=>!!(REG[ced(S.ndoc)]?.contratos||[]).some(z=>z.num===num);

function registrarContrato(c){
 const k=ced(S.ndoc);if(!k)return;
 const p=REG[k]||{ndoc:k,contratos:[],creado:Date.now()};
 PERS.forEach(f=>p[f]=String(S[f]??'').trim());
 p.actualizado=Date.now();
 const rec={num:c.num,perfilNombre:c.p.nombre,objeto:c.p.objeto,valorNum:c.val,ts:Date.now()};
 CONTR.forEach(f=>rec[f]=S[f]??'');
 const i=p.contratos.findIndex(z=>z.num===c.num);
 if(i>=0)p.contratos[i]=rec;else p.contratos.push(rec);
 REG[k]=p;guardarReg();renderCt();
}
function fusionarReg(otro){let n=0;Object.values(otro||{}).forEach(p=>{const k=ced(p.ndoc);if(!k)return;n++;
 const a=REG[k];if(!a){REG[k]={...p,ndoc:k,contratos:[...(p.contratos||[])]};return}
 if((p.actualizado||0)>(a.actualizado||0))PERS.forEach(f=>a[f]=p[f]??a[f]);
 (p.contratos||[]).forEach(z=>{if(!a.contratos.some(y=>y.num===z.num))a.contratos.push(z)})});
 guardarReg();return n}

/* --- ficha que aparece debajo de la cédula --- */
function tablaContratos(p,donde){const L=contratosDe(p);if(!L.length)return'<p class="note">Todavía no tiene contratos generados.</p>';
 return`<div class="scroll"><table class="ptab mini"><thead><tr><th>Contrato</th><th>Perfil</th><th>Firmado</th><th class="n">Valor</th><th></th></tr></thead><tbody>${L.map(z=>`<tr><td data-l="Contrato"><b>${esc(z.num)}</b></td><td data-l="Perfil">${esc(perfilNombre(z.perfil)||z.perfilNombre||'')}</td><td data-l="Firmado">${esc(fechaC(z.fsus)||'')}</td><td class="n" data-l="Valor">${esc(money(z.valorNum||0))}</td><td><button type="button" class="btn sm" data-cargar="${esc(p.ndoc)}|${esc(z.num)}" data-donde="${donde}">Abrir</button></td></tr>`).join('')}</tbody></table></div>`}
function datosPersona(p){const d=[[p.tdoc||'C.C.',cc(p.ndoc)],['Trato',p.sexo==='f'?'la señora':p.sexo==='m'?'el señor':'sin definir'],['Expedida en',p.exped],['Teléfono',p.tel],['Correo',p.correo],['Dirección',p.dir]].filter(z=>z[1]);
 return`<dl class="dl">${d.map(([a,v])=>`<div><dt>${esc(a)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`}

function buscarCedula(forzar){
 const k=ced(S.ndoc),el=$('ficha');
 if(k.length<5){el.className='ficha';el.innerHTML='';fichaK='';return}
 const p=REG[k];
 if(!p){fichaK='';el.className='ficha on nuevo';el.innerHTML=`<b>Cédula nueva.</b> Los datos de esta persona se guardarán al generar el expediente.`;return}
 if(fichaK!==k||forzar){fichaK=k;
  const o={};PERS.forEach(f=>{if(p[f]!==undefined&&p[f]!=='')o[f]=p[f]});
  Object.entries(o).forEach(([f,v])=>{if($(f))$(f).value=v});read();
  const L=contratosDe(p),u=L[0];
  el.className='ficha on';
  el.innerHTML=`<div class="fhead"><span><b>✓ ${esc(p.nombre)}</b><br><span class="note">Contratista registrado · ${L.length} contrato${L.length===1?'':'s'} · datos cargados en el formulario</span></span>
   ${u?`<button type="button" class="btn sm" id="repetir" title="Usa el mismo perfil, valor, plazo y forma de pago del último contrato">Repetir último contrato</button>`:''}</div>
   ${datosPersona(p)}${tablaContratos(p,'form')}`;
  if(u)$('repetir').onclick=()=>{if(!D.perfiles.some(z=>z.id===u.perfil))return alert('El perfil de ese contrato ya no existe en el catálogo.');
   $('perfil').value=u.perfil;read();set({meses:u.meses,valor:u.valor,vigt:u.vigt,pagot:u.pagot,cdp:'',rp:'',consec:nextConsec(),fnec:'',fcdp:'',fsus:''});
   $('cdp').focus()};
  render();
 }
}
function abrirContrato(k,num){const p=REG[k],z=p&&p.contratos.find(y=>y.num===num);if(!z)return;
 if(!D.perfiles.some(y=>y.id===z.perfil))return alert('El perfil de ese contrato ya no existe en el catálogo; no se puede abrir.');
 const o={ndoc:p.ndoc};PERS.forEach(f=>o[f]=p[f]??'');CONTR.forEach(f=>o[f]=z[f]??'');
 $('perfil').value=z.perfil;fichaK='';set(o);buscarCedula(true);
 irA('nuevo');window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-cargar]');if(!t)return;const[k,num]=t.dataset.cargar.split('|');abrirContrato(k,num)});

/* --- pestaña Contratistas --- */
function renderCt(){if(!$('ctlist'))return;
 const q=($('ctq').value||'').trim().toLowerCase(),qd=ced(q);
 const L=Object.values(REG).filter(p=>!q||(p.nombre||'').toLowerCase().includes(q)||(qd&&p.ndoc.includes(qd))).sort((a,b)=>(b.actualizado||0)-(a.actualizado||0));
 const tot=Object.keys(REG).length,nc=Object.values(REG).reduce((s,p)=>s+(p.contratos||[]).length,0);
 $('ctres').textContent=`${tot} contratista${tot===1?'':'s'} · ${nc} contrato${nc===1?'':'s'} generados`+(q?` · ${L.length} coinciden con la búsqueda`:'');
 $('ctlist').innerHTML=L.length?`<thead><tr><th>Contratista</th><th>Contratos</th><th>Último</th></tr></thead><tbody>${L.map(p=>{const u=contratosDe(p)[0];return`<tr data-k="${esc(p.ndoc)}"${p.ndoc===ctSel?' class="sel"':''}><td data-l="Contratista"><b>${esc(p.nombre)}</b><br><span class="note">${esc(p.tdoc||'C.C.')} ${esc(cc(p.ndoc))}</span></td><td class="n" data-l="Contratos">${(p.contratos||[]).length}</td><td data-l="Último">${u?esc(u.num)+'<br><span class="note">'+esc(perfilNombre(u.perfil)||u.perfilNombre||'')+'</span>':'—'}</td></tr>`}).join('')}</tbody>`
  :`<tbody><tr><td class="note" style="cursor:default">${tot?'Ningún contratista coincide con la búsqueda.':'Todavía no hay contratistas. Se registran solos al generar un expediente.'}</td></tr></tbody>`;
 renderCtDet();
}
function renderCtDet(){const p=REG[ctSel],el=$('ctdet');
 if(!p){el.innerHTML='<div class="card note">Elija un contratista de la lista para ver y editar sus datos y sus contratos.</div>';return}
 const inp=(f,l,t='text')=>`<div><label for="ct-${f}">${l}</label><input id="ct-${f}" data-f="${f}" type="${t}" value="${esc(p[f]||'')}"></div>`;
 el.innerHTML=`<div class="card"><h3 style="margin:0 0 2px">${esc(p.nombre)}</h3><p class="note" style="margin:0 0 8px">${esc(p.tdoc||'C.C.')} ${esc(cc(p.ndoc))} · registrado el ${esc(new Date(p.creado||Date.now()).toLocaleDateString('es-CO'))}</p>
  ${inp('nombre','Nombre completo')}
  <div class="row"><div><label for="ct-tdoc">Documento</label><select id="ct-tdoc" data-f="tdoc">${['C.C.','NIT','C.E.'].map(t=>`<option${p.tdoc===t?' selected':''}>${t}</option>`).join('')}</select></div>
  <div><label for="ct-sexo">Trato</label><select id="ct-sexo" data-f="sexo"><option value="">sin definir</option><option value="m"${p.sexo==='m'?' selected':''}>el señor</option><option value="f"${p.sexo==='f'?' selected':''}>la señora</option></select></div></div>
  <div class="row">${inp('exped','Expedida en')}${inp('tel','Teléfono','tel')}</div>
  <div class="row">${inp('correo','Correo','email')}${inp('dir','Dirección')}</div>
  <div class="presets" style="margin:14px 0 6px"><button type="button" class="btn sm" id="ctnuevo">Nuevo contrato para esta persona</button><button type="button" class="btn sm" id="ctborrar">Eliminar contratista</button></div>
  <h3 style="margin:14px 0 6px;font-size:16px">Contratos</h3>${tablaContratos(p,'ct')}</div>`;
 $('ctnuevo').onclick=()=>{const o={ndoc:p.ndoc,cdp:'',rp:'',consec:nextConsec(),fnec:'',fcdp:'',fsus:''};PERS.forEach(f=>o[f]=p[f]??'');fichaK='';set(o);buscarCedula(true);irA('nuevo');window.scrollTo({top:0})};
 $('ctborrar').onclick=()=>{if(!confirm(`¿Eliminar a ${p.nombre} y su historial de ${(p.contratos||[]).length} contrato(s) de este navegador? Los números de contrato siguen marcados como usados.`))return;delete REG[ctSel];ctSel='';guardarReg();renderCt();buscarCedula(true)};
}
$('ctq').addEventListener('input',renderCt);
$('ctlist').addEventListener('click',e=>{const r=e.target.closest('tr[data-k]');if(!r)return;ctSel=r.dataset.k;renderCt();if(innerWidth<900)$('ctdet').scrollIntoView({block:'start'})});
$('ctdet').addEventListener('input',e=>{const f=e.target.dataset.f,p=REG[ctSel];if(!f||!p)return;p[f]=e.target.value;p.actualizado=Date.now();guardarReg();
 if(ced(S.ndoc)===ctSel){fichaK=''}
 const tr=$('ctlist').querySelector(`tr[data-k="${ctSel}"] b`);if(tr&&f==='nombre')tr.textContent=p.nombre});
$('ctdet').addEventListener('change',e=>{if(e.target.tagName==='SELECT')e.target.dispatchEvent(new Event('input',{bubbles:true}))});
