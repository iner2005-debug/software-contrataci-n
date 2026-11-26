/* Revisa que cada dato del formulario aparezca en los documentos donde debe ir,
   en los 28 perfiles, y genera un Word y un PDF de muestra.
   Uso:  python3 build.py && node tools/verificar_documentos.js dist/index.html /tmp/salida
   Requiere Node y Playwright con Chromium. */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(process.argv[2])+'#prueba');fs.mkdirSync(process.argv[3]||'.',{recursive:true});
const r=await p.evaluate(()=>{const {D,read,set,compute,bloques,aHTML,DOCLIST,sugPerfil,pesos}=__app;const S=new Proxy({},{get:(t,k)=>__app.S[k]});
 const out={perfiles:[],problemas:[]};
 const txt=bl=>JSON.stringify(bl);
 const plano=k=>{const c=compute();return aHTML(bloques(k,c)).replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&[a-z#0-9]+;/g,' ').replace(/\s+/g,' ')};
 for(const pf of D.perfiles){
  document.getElementById('perfil').value=pf.id;read();
  set({...sugPerfil(pf),nombre:'ZULEMA PRUEBA QUINTERO',ndoc:'1047123456',tdoc:'C.C.',sexo:'f',cdp:'2026.CEN.01.000777',rp:'2026.CEN.01.000888',consec:'55',fnec:'2026-09-10',fcdp:'2026-09-12',fsus:'2026-09-15'});
  const c=compute(),T={};DOCLIST.forEach(([k])=>T[k]=plano(k));
  const pill=document.getElementById('pill').textContent;
  // qué debe aparecer y dónde
  const exp={
   'nombre':[S.nombre,['ido','des','con','act']],
   'cédula':['1.047.123.456',['ido','des','con','act']],
   'No. contrato':[c.num,['des','not','con','act']],
   'CDP':['2026.CEN.01.000777',['est','con','act']],
   'fecha CDP':['12 de septiembre de 2026',['est','con']],
   'RP':['2026.CEN.01.000888',['act']],
   'fecha necesidad':['diez (10) del mes de septiembre',['nec']],
   'fecha suscripción':['quince (15) del mes de septiembre',['est','ido','des','not','con','act']],
   'valor en letras':[pesos(c.val),['est','con','act']],
   'vigencia':[c.plazoL,['est','con','act']],
   'forma de pago':[c.pagoTxt,['est','con']],
   'objeto':[pf.objeto.slice(0,60),['nec','est','ido','des','con','act']],
   'rubro':[pf.rubro,['est','con']],
   'nombre rubro':[pf.rubroNombre,['est','con']],
   'supervisor (nombre)':[c.sup.n,['des','not','act']],
   'supervisor (cargo)':[c.sup.c,['est','des','not','con','act']],
   'trato señora':['la señora',['ido','con','act']],
   'identificada':['identificada',['ido','des','con','act']],
  };
  pf.obligaciones.forEach((o,i)=>{exp['obligación '+(i+1)]=[o.slice(0,50),['est','con']]});
  pf.alcances.forEach((o,i)=>{exp['alcance '+(i+1)]=[o.slice(0,50),['est','con']]});
  pf.necesidad.forEach((o,i)=>{exp['necesidad '+(i+1)]=[o.slice(0,50),['est']]});
  const fallas=[];
  for(const[nom,[val,docs]] of Object.entries(exp)){if(!val){fallas.push(nom+': vacío');continue}
   const norm=s=>s.replace(/\s+/g,' ').trim();
   docs.forEach(d=>{if(!T[d].includes(norm(val)))fallas.push(`${nom} no aparece en ${d}`)})}
  DOCLIST.forEach(([k])=>{const m=T[k].match(/falta:|undefined|NaN|\[object|null\b|\$0\b/g);if(m)fallas.push(k+': '+[...new Set(m)].join(','))});
  // el masculino no debe colarse
  DOCLIST.forEach(([k])=>{if(/el señor ZULEMA|identificado con|el \(la\) señor/.test(T[k]))fallas.push(k+': género mal')});
  out.perfiles.push([pf.id,pill,c.num,fallas]);
 }
 return out});
let tot=0;for(const[id,pill,num,f] of r.perfiles){tot+=f.length;if(f.length||!/Listo/.test(pill))console.log('✗',id,pill,f.slice(0,8))}
console.log('Perfiles revisados:',r.perfiles.length,'| fallas:',tot);
// Word y PDF reales del primero y de vacunadoras
for(const id of ['abogado','vacunadoras']){
 const files=await p.evaluate(async id=>{const {D,read,set,compute,bloques,DOCLIST,sugPerfil,hacerWord,hacerPDF}=__app;document.getElementById('perfil').value=id;read();const pf=D.perfiles.find(x=>x.id===id);
  set({...sugPerfil(pf),nombre:'ZULEMA PRUEBA QUINTERO',ndoc:'1047123456',sexo:'f',cdp:'2026.CEN.01.000777',rp:'2026.CEN.01.000888',consec:'55',fnec:'2026-09-10',fcdp:'2026-09-12',fsus:'2026-09-15'});
  const c=compute(),bl=DOCLIST.map(([k])=>bloques(k,c));const toB64=async bb=>{const a=new Uint8Array(await bb.arrayBuffer());let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s)};
  return{w:await toB64(await hacerWord(bl,'x')),p:await toB64(await hacerPDF(bl,'x')),num:c.num,pago:c.pagoTxt,vig:c.plazoL}},id);
 fs.writeFileSync(`${process.argv[3]}/${id}.docx`,Buffer.from(files.w,'base64'));fs.writeFileSync(`${process.argv[3]}/${id}.pdf`,Buffer.from(files.p,'base64'));
 fs.writeFileSync(`${process.argv[3]}/${id}.json`,JSON.stringify(files,(k,v)=>k==='w'||k==='p'?undefined:v));
}
console.log('errores JS:',errs);await b.close();process.exit(tot||errs.length?1:0)})()
