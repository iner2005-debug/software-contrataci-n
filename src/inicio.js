/* ============================================================
   ARRANQUE: recupera lo guardado y pinta la pantalla
   ============================================================ */
cargarReg();
const G=leerGuardado();
if(G&&G.v===1){aplicar(G);gViejo=G.base!==BASE;gUlt=new Date(G.ts)}
renderTabs();renderAj();renderPerfilSel();renderCat();renderSave();renderCt();
if(G&&G.form&&D.perfiles.some(p=>p.id===G.form.perfil)){$('perfil').value=G.form.perfil;read();set(G.form)}
else{const p0=D.perfiles.find(p=>p.id==='enfermeras')||D.perfiles[0];$('perfil').value=p0.id;read();
 set({...p0.ejemplo,consec:nextConsec(),...sugPerfil(p0)})}
buscarCedula(true);render();
cargando=false;

