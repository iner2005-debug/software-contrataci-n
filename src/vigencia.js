/* ============================================================
   VIGENCIA Y FORMA DE PAGO
   El usuario elige con botones cómo es la vigencia (meses, meses y
   días, entre dos fechas u otro texto) y cómo se paga (cuotas
   iguales, un solo pago, pagos diferentes u otro texto). El software
   redacta el texto que va en los documentos y revisa que cuadre.
   Campos del formulario: vmodo, meses, vdias, vini, vfin, vigt,
   pmodo, ncuotas, pagos (lista en JSON), pagot.
   ============================================================ */
const dd2=n=>String(n).padStart(2,'0');
const numL=n=>ap(letras(n)).toUpperCase()+' ('+dd2(n)+')';
const cantL=(n,sing,plur)=>n===1?'un (01) '+sing:ap(letras(n))+' ('+dd2(n)+') '+plur;
const enLetras=n=>pesos(Math.round(n)).replace(' M/CTE.','').toLowerCase()+' m/cte. ('+money(n)+')';
const ORD=['primer','segundo','tercer','cuarto','quinto','sexto','séptimo','octavo','noveno','décimo','undécimo','duodécimo'];
const ordL=i=>ORD[i]||`${i+1}.º`;
const vModo=()=>S.vmodo||(String(S.vigt||'').trim()?'texto':'meses');
const pModo=()=>S.pmodo||(String(S.pagot||'').trim()?'texto':'iguales');
const listaPagos=()=>{try{return(JSON.parse(S.pagos||'[]')||[]).map(v=>Number(String(v).replace(/\D/g,''))||0)}catch(e){return[]}};
const unirY=L=>L.length<2?L.join(''):L.slice(0,-1).join(', ')+' y '+L[L.length-1];

function vigencia(){
 const modo=vModo(),m=Number(S.meses)||0,d=Number(S.vdias)||0;
 if(modo==='meses')return{modo,texto:m?plazo(m):'',meses:m,falta:!m&&'Meses de vigencia'};
 if(modo==='dias'){const t=[m?(m===1?'UN (01) MES':numL(m)+' MESES'):'',d?(d===1?'UN (01) DÍA':numL(d)+' DÍAS'):''].filter(Boolean).join(' Y ');
  return{modo,texto:t,meses:m+(d?1:0),falta:!t&&'Meses y días de vigencia'}}
 if(modo==='fechas'){const a=pd(S.vini),b=pd(S.vfin);if(!a||!b)return{modo,texto:'',meses:0,falta:'Fechas de la vigencia (desde y hasta)'};
  const dias=Math.round((Date.UTC(b.y,b.m-1,b.d)-Date.UTC(a.y,a.m-1,a.d))/864e5)+1;
  const f=(z,anio)=>`EL ${dd2(z.d)} DE ${MES[z.m-1].toUpperCase()}${anio?' DE '+z.y:''}`;
  return{modo,texto:`DESDE ${f(a,a.y!==b.y)} HASTA ${f(b,true)}`,meses:Math.max(1,(b.y*12+b.m)-(a.y*12+a.m)+1),dias,
   error:dias<1?'La fecha "Hasta" debe ser después de la fecha "Desde"':''}}
 const t=String(S.vigt||'').trim().toUpperCase();
 return{modo:'texto',texto:t,meses:m,falta:!t&&'Texto de la vigencia'};
}

function formaPago(val,v){
 const modo=pModo();
 if(modo==='iguales'){const n=Number(S.ncuotas)||v.meses||0,cuota=n?val/n:0;
  if(!n)return{modo,n,texto:'',falta:'Número de cuotas'};
  const exacto=val%n===0;
  return{modo,n,cuota,exacto,texto:!val?'':n===1?`un (01) único pago por valor de ${enLetras(val)}`:`${cantL(n,'cuota','cuotas')} mensuales iguales por valor de ${enLetras(Math.round(cuota))} cada una`,
   error:val&&!exacto?`${money(val)} no se divide exacto en ${n} cuotas (daría ${money(cuota)}).`:''}}
 if(modo==='unico')return{modo,n:1,texto:val?`un (01) único pago por valor de ${enLetras(val)}`:''};
 if(modo==='varios'){const L=listaPagos().filter(Boolean),suma=L.reduce((a,b)=>a+b,0);
  if(!L.length)return{modo,n:0,texto:'',falta:'Valor de los pagos'};
  const dif=val-suma;
  return{modo,n:L.length,suma,texto:L.length===1?`un (01) único pago por valor de ${enLetras(L[0])}`:`${cantL(L.length,'pago','pagos')} así: `+unirY(L.map((p,i)=>`un ${ordL(i)} pago por valor de ${enLetras(p)}`)),
   error:val&&dif?`Los pagos suman ${money(suma)}: ${dif>0?'faltan':'sobran'} ${money(Math.abs(dif))} para llegar a ${money(val)}.`:''}}
 const t=String(S.pagot||'').trim();
 return{modo:'texto',n:0,texto:t,falta:!t&&'Texto de la forma de pago'};
}

/* ---- pantalla ---- */
function syncModos(){const vm=vModo(),pm=pModo();
 document.querySelectorAll('[data-seg]').forEach(g=>{const cur=g.dataset.seg==='vmodo'?vm:pm;g.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-checked',b.dataset.v===cur))});
 document.querySelectorAll('#f [data-show]').forEach(el=>{el.hidden=!el.dataset.show.split(' ').some(s=>{const[k,v]=s.split(':');return(k==='vmodo'?vm:pm)===v})});
}
function filasPagos(){const L=listaPagos();
 $('pagosUI').innerHTML=L.map((p,i)=>`<div class="pago"><span>${ordL(i).replace(/^./,c=>c.toUpperCase())}</span><input class="pagoIn" data-i="${i}" inputmode="numeric" aria-label="Valor del ${ordL(i)} pago" value="${p||''}" placeholder="$"><button type="button" data-quitar="${i}" aria-label="Quitar este pago">×</button></div>`).join('')}
function ponerPagos(L){$('pagos').value=JSON.stringify(L);read();filasPagos();render();guardar()}
/* reparte el valor en n pagos: iguales y el último con el ajuste */
function repartir(val,n){if(!n)return[];const q=val>=n*1000?Math.floor(val/n/1000)*1000:Math.floor(val/n);return[...Array(n-1).fill(q),val-q*(n-1)]}

function ecos(){const c=compute(),v=c.vig,pg=c.pg;
 $('ecoValor').innerHTML=c.val?`<b>${esc(pesos(c.val))}</b>`:'';
 const ev=$('ecoVig');ev.className='eco'+(v.error?' mal':v.texto?' bien':'');
 ev.innerHTML=v.error?esc(v.error):v.texto?`Así queda en el documento: <b>${esc(v.texto)}</b>${v.dias>0?` <span class="note">(${v.dias} días)</span>`:''}`:'';
 const ep=$('ecoPago');ep.className='eco'+(pg.error?' mal':pg.texto?' bien':'');
 ep.innerHTML=pg.error?esc(pg.error)+(pg.modo==='iguales'&&pg.n>1?`<br><button type="button" class="btn sm" id="ajustarCuotas">Usar ${pg.n-1} cuotas de ${esc(money(repartir(c.val,pg.n)[0]))} y una última de ${esc(money(repartir(c.val,pg.n).at(-1)))}</button>`:pg.modo==='varios'&&pg.suma<c.val?`<br><button type="button" class="btn sm" id="completarPago">Agregar un pago de ${esc(money(c.val-pg.suma))}</button>`:'')
  :pg.texto?`Así queda en el documento: <b>${esc(pg.texto)}</b>`:'';
 if(pg.modo==='iguales')$('ncuotas').placeholder=v.meses?`${v.meses} (una por mes)`:'';
 const L=listaPagos(),ui=[...document.querySelectorAll('#pagosUI .pagoIn')];
 if(!ui.includes(document.activeElement)&&(ui.length!==L.length||ui.some((el,i)=>(Number(el.value.replace(/\D/g,''))||0)!==L[i])))filasPagos();
 syncModos();
}
const _renderV=render;render=function(){_renderV();ecos()};

document.querySelectorAll('[data-seg]').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b)return;const k=g.dataset.seg;
 $(k).value=b.dataset.v;read();
 if(k==='pmodo'&&b.dataset.v==='varios'&&!listaPagos().filter(Boolean).length){const c=compute();ponerPagos(c.val?repartir(c.val,Math.max(2,c.vig.meses||2)):['',''])}
 render();guardar();
 const foco={meses:'meses',dias:'meses',fechas:'vini',texto:k==='vmodo'?'vigt':'pagot',iguales:'ncuotas',varios:null}[b.dataset.v];
 if(foco)$(foco).focus();else if(b.dataset.v==='varios')document.querySelector('#pagosUI .pagoIn')?.focus()}));
$('pagosUI').addEventListener('input',e=>{if(!e.target.classList.contains('pagoIn'))return;
 const L=[...document.querySelectorAll('#pagosUI .pagoIn')].map(el=>Number(el.value.replace(/\D/g,''))||0);$('pagos').value=JSON.stringify(L);read();render();guardar()});
$('pagosUI').addEventListener('click',e=>{const q=e.target.closest('[data-quitar]');if(!q)return;const L=listaPagos();L.splice(+q.dataset.quitar,1);ponerPagos(L)});
$('addPago').onclick=()=>{const c=compute(),L=listaPagos(),falta=c.val-L.reduce((a,b)=>a+b,0);ponerPagos([...L,falta>0?falta:0]);const ins=document.querySelectorAll('#pagosUI .pagoIn');ins[ins.length-1]?.focus()};
document.addEventListener('click',e=>{
 if(e.target.id==='ajustarCuotas'){const c=compute();$('pmodo').value='varios';read();ponerPagos(repartir(c.val,c.pg.n))}
 if(e.target.id==='completarPago'){const c=compute();ponerPagos([...listaPagos().filter(Boolean),c.val-c.pg.suma])}
});

/* valores sugeridos del perfil (catálogo) */
function sugPerfil(p){return{vmodo:p.vigTexto?'texto':'meses',meses:p.mesesSug,vdias:'',vini:'',vfin:'',vigt:p.vigTexto||'',
 pmodo:p.pagoTexto?'texto':'iguales',ncuotas:'',pagos:'[]',pagot:p.pagoTexto||'',valor:p.valorSug,...(p.vigSug||{}),...(p.pagoSug?{...p.pagoSug,pagos:JSON.stringify(p.pagoSug.pagos||[])}:{})}}
