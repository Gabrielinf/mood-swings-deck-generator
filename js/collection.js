function renderCollectionStats(){
  const el=document.getElementById("collectionStats");if(!el)return;
  const total=cards.length,owned=cards.filter(x=>(+x.qty||0)>0).length;
  const missing=total-owned,copies=cards.reduce((n,x)=>n+(+x.qty||0),0);
  const duplicates=cards.reduce((n,x)=>n+Math.max(0,(+x.qty||0)-1),0);
  const singles=cards.filter(x=>(+x.qty||0)===1).length;
  const pct=total?Math.round(owned*1000/total)/10:0,es=language==="es";
  const rt=r=>cards.filter(x=>x.rarity===r).length,ro=r=>cards.filter(x=>x.rarity===r&&(+x.qty||0)>0).length;
  const ct=c=>cards.filter(x=>x.color===c).length,co=c=>cards.filter(x=>x.color===c&&(+x.qty||0)>0).length;
  el.innerHTML=`<div class="collection-stats-grid">
    <div class="collection-stat-card"><strong>${owned}/${total}</strong><span>${es?"Cartas diferentes":"Unique cards"}</span><div class="collection-progress"><span style="width:${pct}%"></span></div></div>
    <div class="collection-stat-card"><strong>${pct}%</strong><span>${es?"Colección completa":"Collection complete"}</span></div>
    <button type="button" class="collection-stat-card collection-stat-button" onclick="showMissingCollection()"><strong>${missing}</strong><span>${es?"Faltantes":"Missing"}</span></button>
    <div class="collection-stat-card"><strong>${copies}</strong><span>${es?"Copias totales":"Total copies"}</span></div>
    <div class="collection-stat-card"><strong>${duplicates}</strong><span>${es?"Copias repetidas":"Duplicate copies"}</span></div>
    <div class="collection-stat-card"><strong>${singles}</strong><span>${es?"Con una copia":"Single-copy cards"}</span></div>
  </div><div class="collection-rarity-stats">
    ${rarities.map(r=>{const totalR=rt(r),ownedR=ro(r),pctR=totalR?Math.round(ownedR*100/totalR):0;return `<span><b>${r==="U"&&es?"I":r} ${ownedR}/${totalR}</b><small>${pctR}%</small></span>`}).join("")}
  </div><div class="collection-color-progress">
    ${colors.map(c=>`<div class="collection-color-pill"><strong>${colorIcon(c)} ${co(c)}/${ct(c)}</strong><span>${label(c)}</span></div>`).join("")}
  </div>`;
}

function markDeckCollectionStatusDirty(){
  deckCollectionStatusDirty=true;
}
function refreshDeckCollectionStatus(){
  if(!deckCollectionStatusDirty)return;
  deckCollectionStatusDirty=false;
  render();
}

function openCollection(){
  const history=document.getElementById("historyDrawer");
  if(history)history.classList.remove("open");
  document.getElementById("collectionDrawer").classList.add("open");
  document.getElementById("drawerOverlay").classList.add("open");
  document.body.classList.add("drawer-open");
  drawerTitle.textContent=T("collectionTitle");
  collectionSearch.placeholder=T("search");
  const expBtn=document.getElementById("collectionExportBtn");
  const impBtn=document.getElementById("collectionImportBtn");
  const rstBtn=document.getElementById("collectionResetBtn");
  if(expBtn)expBtn.textContent=T("collectionExport");
  if(impBtn)impBtn.textContent=T("collectionImport");
  if(rstBtn)rstBtn.textContent=T("collectionReset");
  updateCollectionFilterLanguage();
  renderCollectionStats();
  renderCollection();
  setStructuralActive("collection");
}
function closeCollection(){
  document.getElementById("collectionDrawer").classList.remove("open");
  if(!document.getElementById("historyDrawer").classList.contains("open")){
    document.getElementById("drawerOverlay").classList.remove("open");
    document.body.classList.remove("drawer-open");
  }
  refreshDeckCollectionStatus();
  if(!syncStructuralActiveFromUI())window.dispatchEvent(new Event("scroll"));
}
function closeAllDrawers(){closeCollection();closeHistory();}

function clearCollectionFilters(){
  let a=document.getElementById("collectionOwnershipFilter"),b=document.getElementById("collectionColorFilter"),c=document.getElementById("collectionRarityFilter");
  if(a)a.value="all";if(b)b.value="all";if(c)c.value="all";
  renderCollection();
}
function updateCollectionFilterLanguage(){
  const es=language==="es";
  const own=document.getElementById("collectionOwnershipFilter");
  const col=document.getElementById("collectionColorFilter");
  const rar=document.getElementById("collectionRarityFilter");
  const clr=document.getElementById("collectionClearFilters");
  if(own){own.options[0].text=es?"Todas":"All";own.options[1].text=es?"Tengo":"Owned";own.options[2].text=es?"Faltantes":"Missing"}
  if(col){
    col.options[0].text=es?"Todos los colores":"All colors";
    ["White","Blue","Black","Red","Green"].forEach((v,i)=>col.options[i+1].text=label(v));
  }
  if(rar){
    rar.options[0].text=es?"Todas las rarezas":"All rarities";
    rar.options[1].text=es?"Común":"Common";
    rar.options[2].text=es?"Infrecuente":"Uncommon";
    rar.options[3].text=es?"Rara":"Rare";
    rar.options[4].text=es?"Mítica":"Mythic";
  }
  if(clr)clr.textContent=es?"Limpiar":"Clear";
  const mb=document.getElementById("collectionMissingBtn");
  if(mb)mb.textContent=es?"Faltantes":"Missing";
}
function showMissingCollection(){
  let e=document.getElementById("collectionOwnershipFilter");
  if(e)e.value="missing";
  renderCollection();
}
function setCollectionQty(index,value){
  const n=Math.max(0,Math.floor(Number(value)||0));
  cards[index].qty=n;
  Storage.saveCollection(cards);
  renderCollectionStats();
  markDeckCollectionStatusDirty();
}
function stepCollectionQty(index,delta){
  setCollectionQty(index,(+cards[index].qty||0)+delta);
  renderCollection();
}
function renderCollection(){
  let q=(collectionSearch?.value||"").trim().toLowerCase();
  let ownership=document.getElementById("collectionOwnershipFilter")?.value||"all";
  let colorFilter=document.getElementById("collectionColorFilter")?.value||"all";
  let rarityFilter=document.getElementById("collectionRarityFilter")?.value||"all";
  let filtered=cards.filter(x=>{
    if(q && !String(x.n).includes(q) && !x.name.toLowerCase().includes(q))return false;
    if(ownership==="owned" && !(+x.qty>0))return false;
    if(ownership==="missing" && +x.qty>0)return false;
    if(colorFilter!=="all" && x.color!==colorFilter)return false;
    if(rarityFilter!=="all" && x.rarity!==rarityFilter)return false;
    return true;
  });
  let rows=sortedRows(filtered,"collection");
  collection.innerHTML=`<p class=small>${language==="es"?"Haz clic en un encabezado para ordenar: ascendente → descendente → orden base.":"Click a header to sort: ascending → descending → base order."}</p>
  <div class="table-scroll"><table><tr>${sortableHeader("collection","n","#")}${sortableHeader("collection","name",T("card"))}${sortableHeader("collection","color",T("color"))}${sortableHeader("collection","rarity",T("rarity"))}${sortableHeader("collection","qty",T("qty"))}<th>${T("exclude")}</th></tr>
  ${rows.map(x=>{let i=cards.findIndex(c=>c.n===x.n);return `<tr class=${x.color}><td>${x.n}</td><td>${cardNameHtml(x)}</td><td>${colorIcon(x.color)} ${label(x.color)}</td><td>${x.rarity}</td><td><div class="qty-stepper"><button type="button" aria-label="${language==="es"?"Restar copia":"Remove copy"}" onclick="stepCollectionQty(${i},-1)">−</button><input type="number" min="0" inputmode="numeric" value="${x.qty}" onchange="setCollectionQty(${i},this.value);this.value=cards[${i}].qty"><button type="button" aria-label="${language==="es"?"Agregar copia":"Add copy"}" onclick="stepCollectionQty(${i},1)">+</button></div></td><td><input type=checkbox ${excluded.has(x.n)?"checked":""} onchange="this.checked?excluded.add(${x.n}):excluded.delete(${x.n});Storage.saveExcluded(excluded)"></td></tr>`}).join("")}</table></div>`;
}
function openCollectionAtCard(cardNumber){
  const search=document.getElementById("collectionSearch");
  const own=document.getElementById("collectionOwnershipFilter");
  const col=document.getElementById("collectionColorFilter");
  const rar=document.getElementById("collectionRarityFilter");
  if(search)search.value=String(cardNumber);
  if(own)own.value="all";
  if(col)col.value="all";
  if(rar)rar.value="all";
  openCollection();
  setTimeout(()=>{
    const row=[...document.querySelectorAll("#collection tbody tr,#collection table tr")].find(tr=>{
      const first=tr.querySelector("td");return first&&first.textContent.trim()===String(cardNumber);
    });
    if(row)row.scrollIntoView({block:"center",behavior:"smooth"});
  },120);
}

function resetCollection(){
  if(!confirm(T("collectionResetConfirm")))return;
  cards.forEach(x=>x.qty=0);
  Storage.saveCollection(cards);
  renderCollectionStats();
  renderCollection();
  markDeckCollectionStatusDirty();
  showToast(language==="es"?"Colección reseteada ✓":"Collection reset ✓");
}
function exportCollection(){
  const payload={
    format:"MoodSwingsCollection",
    version:1,
    exportedAt:new Date().toISOString(),
    cards:cards.map(x=>({n:x.n,qty:+x.qty||0}))
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="MoodSwings_Collection.json";
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0);
}

function importCollection(file){
  if(!file)return;
  const es=language==="es";
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(String(reader.result||""));
      if(!data||data.format!=="MoodSwingsCollection")
        throw new Error(es?"Formato no reconocido.":"Unrecognized format.");
      if(!Array.isArray(data.cards))
        throw new Error(es?"El archivo no contiene cartas.":"File contains no cards.");

      // Ask replace or merge
      const isMerge=confirm(
        es
          ?"¿Combinar con tu colección actual?\n\n[Aceptar] Combinar — mantiene el mayor valor entre ambas.\n[Cancelar] Reemplazar — sobreescribe todo."
          :"Merge with your current collection?\n\n[OK] Merge — keeps the higher quantity of each card.\n[Cancel] Replace — overwrites everything."
      );

      const incoming=Object.fromEntries(data.cards.map(x=>[+x.n,Math.max(0,+x.qty||0)]));
      let changed=0;
      cards.forEach(x=>{
        const inQty=incoming[x.n]??0;
        const newQty=isMerge?Math.max(+x.qty||0,inQty):inQty;
        if(newQty!==(+x.qty||0)){x.qty=newQty;changed++;}
      });

      Storage.saveCollection(cards);
      renderCollectionStats();
      renderCollection();
      markDeckCollectionStatusDirty();
      showToast(es
        ?`Colección ${isMerge?"combinada":"reemplazada"} ✓ (${changed} carta${changed===1?"":"s"} actualizada${changed===1?"":"s"})`
        :`Collection ${isMerge?"merged":"replaced"} ✓ (${changed} card${changed===1?"":"s"} updated)`
      );
    }catch(e){
      alert((es?"No se pudo importar la colección: ":"Could not import collection: ")+e.message);
    }
  };
  reader.readAsText(file,"UTF-8");
}
