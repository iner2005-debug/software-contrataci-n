/* ============================================================
   SALIDAS: vista previa (HTML), Word (.docx) y PDF
   Word: se toma la plantilla del hospital (assets/rotulo.docx) con
   su encabezado, marca de agua y pie, y se le reemplaza el cuerpo.
   PDF: cada página lleva de fondo la imagen del mismo membrete.
   ============================================================ */

/* Normaliza el contenido de un bloque a una lista de piezas {s,b,v,m} */
const runs=c=>{const o=[];const f=z=>{if(z==null||z==='')return;if(Array.isArray(z))z.forEach(f);else if(typeof z==='object'&&z.s!==undefined){if(z.s!=='')o.push(z)}else o.push({s:String(z)})};f(c);
 /* une piezas vecinas con el mismo formato */
 return o.reduce((a,r)=>{const l=a[a.length-1];if(l&&!!l.b===!!r.b&&!!l.v===!!r.v&&!!l.m===!!r.m&&(l.f||'')===(r.f||''))l.s+=r.s;else a.push({...r});return a},[])};
const celda=cell=>cell&&!Array.isArray(cell)&&typeof cell==='object'&&cell.c!==undefined?{r:runs(cell.c),span:cell.span,alto:cell.alto}:{r:runs(cell)};
const MEM=ASSETS.membrete;
const MARGEN={top:Math.ceil(MEM.encabezadoHasta+16),bottom:Math.ceil(MEM.alto-MEM.pieDesde+16),side:MEM.margenIzq};

/* ---------- vista previa ---------- */
const hRuns=rs=>rs.map(r=>{let t=esc(r.s);if(r.b)t=`<b>${t}</b>`;const d=r.f?` data-f="${esc(r.f)}" data-l="${esc(r.l||'')}"`:'';return r.m?`<mark class="miss"${d}>${t}</mark>`:r.v?`<mark${d}>${t}</mark>`:t}).join('');
function aHTML(bl){return bl.map(k=>{switch(k.k){
 case 'tit':return`<h2>${hRuns(runs(k.c))}</h2>`;
 case 'sec':return`<h3>${hRuns(runs(k.c))}</h3>`;
 case 'p':return`<p class="${k.al==='c'?'c':k.al==='l'?'l':''}${k.small?' small':''}">${hRuns(runs(k.c))}</p>`;
 case 'ul':return`<ul>${k.items.map(i=>`<li>${hRuns(runs(i))}</li>`).join('')}</ul>`;
 case 'tbl':{const n=k.w.length;return`<table><colgroup>${k.w.map(w=>`<col style="width:${w}%">`).join('')}</colgroup>${k.rows.map((row,ri)=>`<tr${k.head&&ri===0?' class="th"':''}>${row.map((cell,ci)=>{const z=celda(cell);return`<td${z.span?` colspan="${n}" class="span"`:''}${(k.center||[]).includes(ci)?' style="text-align:center"':''}${z.alto?' style="height:52px"':''}>${hRuns(z.r)}</td>`}).join('')}</tr>`).join('')}</table>`}
 case 'fir':return`<div class="sign">${k.cols.map(col=>`<div><span class="line"></span>${col.map(l=>hRuns(runs(l))).join('<br>')}</div>`).join('')}</div>`;
}}).join('')}

/* ---------- Word ---------- */
const xe=s=>String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FUENTE='Arial Narrow',TAM=21; /* 10,5 pt */
const wr=(r,sz)=>`<w:r><w:rPr><w:rFonts w:ascii="${FUENTE}" w:hAnsi="${FUENTE}" w:eastAsia="${FUENTE}" w:cs="Arial"/>${r.b?'<w:b/><w:bCs/>':''}<w:sz w:val="${sz||TAM}"/><w:szCs w:val="${sz||TAM}"/>${r.m?'<w:highlight w:val="red"/>':''}<w:lang w:val="es-CO"/></w:rPr><w:t xml:space="preserve">${xe(r.s)}</w:t></w:r>`;
function wp(rs,o={}){return`<w:p><w:pPr>${o.pb?'<w:pageBreakBefore/>':''}${o.keep?'<w:keepNext/>':''}<w:spacing w:before="${o.before||0}" w:after="${o.after??120}" w:line="252" w:lineRule="auto"/>${o.ind||''}<w:jc w:val="${o.al||'both'}"/></w:pPr>${rs.map(r=>wr(r,o.sz)).join('')}</w:p>`}
const AL={c:'center',l:'left'};
function aWord(bl,pb,ancho){return bl.map((k,i)=>{const p0=pb&&i===0,antesFirma=bl[i+1]&&bl[i+1].k==='fir';switch(k.k){
 case 'tit':return wp(runs(k.c).map(r=>({...r,b:1})),{al:'center',after:240,sz:24,pb:p0,keep:1});
 case 'sec':return wp(runs(k.c).map(r=>({...r,b:1})),{al:'left',before:120,after:80,keep:1,pb:p0});
 case 'p':return wp(runs(k.c),{al:AL[k.al]||'both',sz:k.small?16:0,pb:p0,before:k.small?240:0,keep:antesFirma});
 case 'ul':return k.items.map((it,j)=>wp([{s:'•\t'},...runs(it)],{ind:'<w:ind w:left="426" w:hanging="284"/>',after:60,pb:p0&&j===0})).join('');
 case 'tbl':{const n=k.w.length,tw=k.w.map(w=>Math.round(w/100*ancho));
  const filas=k.rows.map((row,ri)=>{const head=k.head&&ri===0;const cells=row.map((cell,ci)=>{const z=celda(cell),w=z.span?ancho:tw[ci];
   return`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${z.span?`<w:gridSpan w:val="${n}"/>`:''}${head||z.span?'<w:shd w:val="clear" w:color="auto" w:fill="E2EFD9"/>':''}<w:vAlign w:val="center"/></w:tcPr>${wp(z.r,{al:(k.center||[]).includes(ci)||head?'center':'left',after:0})}</w:tc>`}).join('');
   const alto=row.some(c=>celda(c).alto);
   return`<w:tr><w:trPr><w:cantSplit/>${head?'<w:tblHeader/>':''}${alto?'<w:trHeight w:val="700"/>':''}</w:trPr>${cells}</w:tr>`}).join('');
  const bd=['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('');
  return(p0?wp([],{pb:1,after:0}):'')+`<w:tbl><w:tblPr><w:tblW w:w="${ancho}" w:type="dxa"/><w:tblBorders>${bd}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${tw.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${filas}</w:tbl>`+wp([],{after:120})}
 case 'fir':{const n=k.cols.length,w=Math.round(ancho/(n===1?2:n)),tot=w*n;
  const cells=k.cols.map(col=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr>${wp([],{after:0,keep:1})}${wp([],{after:0,keep:1})}${wp([{s:'_______________________________'}],{al:'center',after:0,keep:1})}${col.map(l=>wp(runs(l),{al:'center',after:0,keep:1})).join('')}</w:tc>`).join('');
  return`<w:tbl><w:tblPr><w:tblW w:w="${tot}" w:type="dxa"/><w:jc w:val="${n===1?'left':'center'}"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${k.cols.map(()=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid><w:tr><w:trPr><w:cantSplit/></w:trPr>${cells}</w:tr></w:tbl>`+wp([],{after:0})}
}}).join('')}

async function hacerWord(docs,titulo){
 const zip=await JSZip.loadAsync(ASSETS.rotulo,{base64:true});
 let xml=await zip.file('word/document.xml').async('string');
 const ini=xml.indexOf('>',xml.indexOf('<w:body'))+1,s0=xml.lastIndexOf('<w:sectPr'),fin=xml.lastIndexOf('</w:body>');
 let sect=xml.slice(s0,fin);
 const tw=a=>Number((sect.match(new RegExp('w:'+a+'="(\\d+)"'))||[])[1]||0);
 sect=sect.replace(/(<w:pgMar[^>]*?)w:top="\d+"/,`$1w:top="${MARGEN.top*20}"`).replace(/(<w:pgMar[^>]*?)w:bottom="\d+"/,`$1w:bottom="${MARGEN.bottom*20}"`);
 const ancho=(Number((sect.match(/<w:pgSz[^>]*w:w="(\d+)"/)||[])[1])||12240)-tw('left')-tw('right');
 const cuerpo=docs.map((bl,i)=>aWord(bl,i>0,ancho)).join('');
 zip.file('word/document.xml',xml.slice(0,ini)+cuerpo+sect+xml.slice(fin));
 const core=zip.file('docProps/core.xml');
 if(core){let c=await core.async('string');c=c.replace(/<dc:title>[\s\S]*?<\/dc:title>/,'').replace(/(<cp:coreProperties[^>]*>)/,`$1<dc:title>${xe(titulo)}</dc:title>`);zip.file('docProps/core.xml',c)}
 return zip.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

/* ---------- PDF ---------- */
const pRuns=rs=>rs.map(r=>r.m?{text:r.s,bold:!!r.b,background:'#ffd3cf',color:'#8b1a12'}:{text:r.s,bold:!!r.b});
const ANCHO_PDF=MEM.ancho-2*MARGEN.side;
function aPDF(bl,pb){return bl.map((k,i)=>{let o;switch(k.k){
 case 'tit':o={text:pRuns(runs(k.c)),bold:true,alignment:'center',fontSize:12,margin:[0,0,0,12]};break;
 case 'sec':o={text:pRuns(runs(k.c)),bold:true,margin:[0,6,0,4],headlineLevel:1};break;
 case 'p':o={text:pRuns(runs(k.c)),alignment:k.al==='c'?'center':k.al==='l'?'left':'justify',margin:[0,k.small?14:0,0,6],...(k.small?{fontSize:8}:{})};break;
 case 'ul':o={ul:k.items.map(it=>({text:pRuns(runs(it)),alignment:'justify',margin:[0,0,0,3]})),margin:[4,0,0,6]};break;
 case 'tbl':{const n=k.w.length,disp=ANCHO_PDF-n*8.6;
  o={table:{headerRows:k.head?1:0,keepWithHeaderRows:k.head?1:0,dontBreakRows:true,widths:k.w.map(w=>w/100*disp),body:k.rows.map((row,ri)=>{const head=k.head&&ri===0;
   if(row.length===1&&celda(row[0]).span){const z=celda(row[0]);return[{text:pRuns(z.r),colSpan:n,fillColor:'#E2EFD9'},...Array(n-1).fill({})]}
   return row.map((cell,ci)=>{const z=celda(cell);return{text:pRuns(z.r),alignment:head||(k.center||[]).includes(ci)?'center':'left',...(head?{fillColor:'#E2EFD9'}:{}),...(z.alto?{margin:[0,14,0,14]}:{})}})})},
   layout:{hLineWidth:()=>.6,vLineWidth:()=>.6,paddingLeft:()=>4,paddingRight:()=>4,paddingTop:()=>2.5,paddingBottom:()=>2.5},margin:[0,2,0,10],fontSize:9.5};break}
 case 'fir':o={unbreakable:true,margin:[0,26,0,0],columns:k.cols.map(col=>({width:k.cols.length===1?ANCHO_PDF/2:'*',alignment:'center',stack:[{text:'_______________________________',margin:[0,0,0,2]},...col.map(l=>({text:pRuns(runs(l))}))]}))};break;
 }
 if(pb&&i===0)o.pageBreak='before';return o})
 /* el párrafo anterior a las firmas va en la misma hoja que ellas */
 .reduce((a,o,i)=>{if(bl[i].k==='fir'&&i>0&&bl[i-1].k==='p'){const prev=a.pop();a.push({stack:[prev,o],unbreakable:true,...(prev.pageBreak?{pageBreak:prev.pageBreak}:{})});delete prev.pageBreak}else a.push(o);return a},[])}

let fuentesPDF=null;
function hacerPDF(docs,titulo){
 const dd={pageSize:{width:MEM.ancho,height:MEM.alto},pageMargins:[MARGEN.side,MARGEN.top,MARGEN.side,MARGEN.bottom],
  info:{title:titulo,author:AJ.entidad,creator:'Generador de expedientes de contratación'},
  background:()=>({image:'membrete',width:MEM.ancho,height:MEM.alto}),images:{membrete:'data:image/jpeg;base64,'+ASSETS.fondo},
  defaultStyle:{font:'LS',fontSize:10,lineHeight:1.12},
  pageBreakBefore:(nodo,siguientes)=>nodo.headlineLevel===1&&siguientes.length===0,
  content:docs.flatMap((bl,i)=>aPDF(bl,i>0))};
 fuentesPDF=fuentesPDF||{LS:{normal:'LS-R.ttf',bold:'LS-B.ttf',italics:'LS-R.ttf',bolditalics:'LS-B.ttf'}};
 return new Promise((ok,mal)=>{try{pdfMake.createPdf(dd,null,fuentesPDF,{'LS-R.ttf':ASSETS.fuenteR,'LS-B.ttf':ASSETS.fuenteB}).getBlob(ok)}catch(e){mal(e)}});
}

/* ---------- descargar / imprimir ---------- */
function bajar(blob,nombre){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nombre;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000)}
function imprimirPDF(blob){
 const u=URL.createObjectURL(blob),f=document.createElement('iframe');
 f.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';f.src=u;document.body.appendChild(f);
 f.onload=()=>setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){window.open(u,'_blank')}},300);
 setTimeout(()=>{f.remove();URL.revokeObjectURL(u)},30*60000);
}
const limpioNombre=s=>String(s).replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim().slice(0,120);
