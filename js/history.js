function _historyMscCode(deck){
  if(!deck||!Array.isArray(deck.cards)||!deck.cards.length)return "";
  try{
    const cardObjs=deck.cards.map(n=>cards.find(x=>x.n===+n)).filter(Boolean);
    return MSC.encode(cardObjs);
  }catch(e){return "";}
}

function openHistory(){
  const collection=document.getElementById("collectionDrawer");
  if(collection)collection.classList.remove("open");
  let hd=document.getElementById("historyDrawer"),ov=document.getElementById("drawerOverlay");
  hd.classList.add("open");ov.classList.add("open");document.body.classList.add("drawer-open");
  document.getElementById("historyDrawerTitle").textContent=T("history");
  renderHistoryList();setStructuralActive("history");
}
function closeHistory(){
  let hd=document.getElementById("historyDrawer"),ov=document.getElementById("drawerOverlay");
  hd.classList.remove("open");
  if(!document.getElementById("collectionDrawer").classList.contains("open")){ov.classList.remove("open");document.body.classList.remove("drawer-open");}
  if(!syncStructuralActiveFromUI())window.dispatchEvent(new Event("scroll"));
}
function getHistory(){
  try{
    let h=Storage.loadHistory();
    return h.map(z=>({
      ...z,
      type:z.type||"generated",
      decks:(z.decks||[]).map((d,i)=>Array.isArray(d)?{name:`${T("deck")} ${i+1}`,cards:d}:d)
    }));
  }catch(e){return []}
}
function setHistory(h){Storage.saveHistory(h)}
function renameHistoryDeck(entryIndex,deckIndex,value){
  let h=getHistory();if(!h[entryIndex]||!h[entryIndex].decks[deckIndex])return;
  h[entryIndex].decks[deckIndex].name=value.trim()||`${T("deck")} ${deckIndex+1}`;setHistory(h);showHistoryEntry(entryIndex);
}
async function copyHistorySeed(entryIndex){
  const z=getHistory()[entryIndex],seed=String(z?.seed||"");
  if(!seed)return;
  try{await navigator.clipboard.writeText(seed)}
  catch(e){
    const ta=document.createElement("textarea");ta.value=seed;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();
  }
  showToast(language==="es"?"Seed del historial copiada ✓":"History seed copied ✓");
}
function generateFromHistory(entryIndex){
  const z=getHistory()[entryIndex];if(!z?.seed)return;
  restoreHistoryConfiguration(entryIndex);
  const seedEl=document.getElementById("seedInput");
  if(seedEl)seedEl.value=String(z.seed);
  activeGenerationSeed=String(z.seed);
  generate();
  document.getElementById("section-decks")?.scrollIntoView({behavior:"smooth",block:"start"});
}
function restoreHistoryConfiguration(entryIndex){
  const z=getHistory()[entryIndex];if(!z)return;
  applyConfigToUI(z.configuration||{});
  if(z.seed){
    activeGenerationSeed=String(z.seed);
    const seedEl=document.getElementById("seedInput");
    if(seedEl)seedEl.value=activeGenerationSeed;
  }
  updatePriorityUI();
  mode.onchange();
  closeHistory();
  render();
  setSeedStatus(language==="es"?"Configuración restaurada ✓":"Configuration restored ✓");
  document.getElementById("seedInput")?.scrollIntoView({behavior:"smooth",block:"center"});
}
function historyDeckInventoryStatus(deck){
  const counts={};
  (deck?.cards||[]).forEach(n=>{counts[+n]=(counts[+n]||0)+1});
  const issues=Object.entries(counts).map(([n,need])=>{
    const card=cards.find(x=>x.n===+n),have=card?Math.max(0,+card.qty||0):0;
    return {card,need,have,missing:Math.max(0,need-have)};
  }).filter(x=>x.missing>0);
  return {valid:issues.length===0,issues,missingCopies:issues.reduce((a,x)=>a+x.missing,0)};
}
function historyGenerationInventoryStatus(entry){
  const counts={};
  (entry?.decks||[]).forEach(deck=>(deck?.cards||[]).forEach(n=>{counts[+n]=(counts[+n]||0)+1}));
  const issues=Object.entries(counts).map(([n,need])=>{
    const card=cards.find(x=>x.n===+n),have=card?Math.max(0,+card.qty||0):0;
    return {card,need,have,missing:Math.max(0,need-have)};
  }).filter(x=>x.missing>0).sort((a,b)=>b.missing-a.missing||((a.card?.n||0)-(b.card?.n||0)));
  return {valid:issues.length===0,issues,missingCopies:issues.reduce((a,x)=>a+x.missing,0)};
}
function historyGenerationInventoryBadge(entry){
  const st=historyGenerationInventoryStatus(entry),es=language==="es",multi=(entry?.decks?.length||0)>1;
  return st.valid
    ?`<span class="history-generation-badge ok">✓ ${multi?(es?"Todos construibles simultáneamente":"All simultaneously buildable"):(es?"Construible":"Buildable")}</span>`
    :`<span class="history-generation-badge bad">⚠ ${es?"Faltan":"Missing"} ${st.missingCopies} ${es?"copia(s) para el conjunto":"copy/copies for the set"}</span>`;
}
function historyGenerationIssues(entry){
  const st=historyGenerationInventoryStatus(entry),es=language==="es";
  if(st.valid)return "";
  const shown=st.issues.slice(0,6).map(x=>`#${x.card?.n||"?"} ${x.card?cardName(x.card):""}: ${es?"necesita":"needs"} ${x.need}, ${es?"tienes":"have"} ${x.have}`).join("<br>");
  const more=st.issues.length>6?`<br>… ${es?"y":"and"} ${st.issues.length-6} ${es?"más":"more"}`:"";
  return `<div class="history-generation-issues">${shown}${more}</div>`;
}
function historyInventoryBadge(deck){
  const st=historyDeckInventoryStatus(deck),es=language==="es";
  return st.valid
    ?`<span class="history-inventory-badge ok">✓ ${es?"Construible":"Buildable"}</span>`
    :`<span class="history-inventory-badge bad">⚠ ${es?"Faltan":"Missing"} ${st.missingCopies}</span>`;
}
function historyModeLabel(z){
  const m=z.configuration?.mode;
  if(!m)return "";
  const map={balanced:"balancedAuto",free:"freeColor",manual:"manualDistribution"};
  return T(map[m]||"balancedAuto");
}
function renderHistoryList(){
  let h=getHistory(),el=document.getElementById("historyList");
  const searchEl=document.getElementById("historySearch"),sortEl=document.getElementById("historySort");
  const q=(searchEl?.value||"").trim().toLocaleLowerCase(language==="es"?"es":"en");
  let rows=h.map((z,i)=>({z,i})).filter(({z})=>!q||z.decks.some(d=>(d.name||"").toLocaleLowerCase(language==="es"?"es":"en").includes(q)));
  const sort=sortEl?.value||"newest";
  if(sort==="oldest")rows.reverse();
  else if(sort==="name")rows.sort((a,b)=>(a.z.decks[0]?.name||"").localeCompare(b.z.decks[0]?.name||"",language==="es"?"es":"en",{numeric:true,sensitivity:"base"}));
  el.innerHTML=rows.length?rows.map(({z,i})=>`<div class="history-item" onclick="showHistoryEntry(${i})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showHistoryEntry(${i})}">
    ${z.decks.map((d,di)=>`<div class="history-list-deck">
      <span class="history-list-deck-name">${d.name} ${historyInventoryBadge(d)}</span>
      <button class="history-list-delete" onclick="deleteHistoryDeckFromList(event,${i},${di})">🗑 ${T("deleteDeck")}</button>
    </div>`).join("")}
    <div class="history-generation-status">${historyGenerationInventoryBadge(z)}</div>
    <div class="history-date">${z.date}</div>
    <span class="small">${z.decks.reduce((a,d)=>a+d.cards.length,0)} ${T("cardsWord")}${historyModeLabel(z)?" · "+historyModeLabel(z):""}</span>
  </div>`).join(""):`<p class="small">${q?(language==="es"?"No hay mazos que coincidan con la búsqueda.":"No decks match your search."):(language==="es"?"Todavía no hay mazos guardados.":"No saved decks yet.")}</p>`;
  if(searchEl)searchEl.placeholder=language==="es"?"Buscar mazos":"Search decks";
  if(sortEl){
    sortEl.options[0].text=language==="es"?"Más recientes":"Newest first";
    sortEl.options[1].text=language==="es"?"Más antiguos":"Oldest first";
    sortEl.options[2].text=language==="es"?"Nombre A–Z":"Name A–Z";
  }
}
function _deleteHistoryDeckShared(entryIndex,deckIndex){
  let h=getHistory();
  if(!h[entryIndex]||!h[entryIndex].decks[deckIndex])return;
  h[entryIndex].decks.splice(deckIndex,1);
  if(h[entryIndex].decks.length===0)h.splice(entryIndex,1);
  setHistory(h);
  activeHistoryIndex=null;
  renderHistoryList();
}
function deleteHistoryDeckFromList(event,entryIndex,deckIndex){
  event.stopPropagation();
  if(!confirm(T("deleteDeckConfirm")))return;
  _deleteHistoryDeckShared(entryIndex,deckIndex);
}
function deleteHistoryDeck(entryIndex,deckIndex){
  if(!confirm(T("deleteDeckConfirm")))return;
  _deleteHistoryDeckShared(entryIndex,deckIndex);
}
function historyTypeBadge(z){
  const es=language==="es";
  const isCustom=z.type==="custom";
  const label=isCustom?(es?"Personalizado":"Custom"):(es?"Generado":"Generated");
  const cls=isCustom?"history-type-badge custom":"history-type-badge generated";
  return `<span class="${cls}">${label}</span>`;
}
function showHistoryEntry(index){
  activeHistoryIndex=index;
  const z=getHistory()[index],el=document.getElementById("historyList");if(!z)return;
  const es=language==="es";
  const isGenerated=z.type!=="custom";
  const mscCode=!isGenerated&&z.decks[0]?_historyMscCode(z.decks[0]):"";
  const metaHtml=(z.seed||z.configuration||!isGenerated)?`<div class="history-generation-meta">${z.seed?`<span class="history-seed">Seed: ${z.seed}</span>`:""}${z.configuration?`<span>${es?"Tamaño":"Size"}: ${z.configuration.deckSize||"—"}</span><span>${es?"Modo":"Mode"}: ${z.configuration.mode||"—"}</span>`:""}${mscCode?`<span class="history-seed">${mscCode}</span>`:""}</div>
  <div class="history-config-actions">
    ${isGenerated&&z.seed?`<button type="button" class="secondary history-restore-btn" onclick="copyHistorySeed(${index})">${es?"Copiar seed":"Copy seed"}</button>`:""}
    ${isGenerated?`<button type="button" class="secondary history-restore-btn" onclick="restoreHistoryConfiguration(${index})">↩ ${es?"Restaurar configuración":"Restore configuration"}</button>`:""}
    ${isGenerated&&z.seed?`<button type="button" class="history-generate-btn" onclick="generateFromHistory(${index})">▶ ${es?"Generar con esta seed":"Generate with this seed"}</button>`:""}
    ${!isGenerated?`<button type="button" class="history-generate-btn" onclick="loadHistoryEntryToCustomDeck(${index})">✦ ${es?"Cargar en Custom":"Load into Custom"}</button>`:""}
  </div>`:"";
  el.innerHTML=`<button class="secondary history-back" onclick="activeHistoryIndex=null;renderHistoryList()">← ${es?"Volver al historial":"Back to history"}</button>
  <p class="small"><b>${z.date}</b> ${historyTypeBadge(z)}</p>
  <div class="history-generation-summary">${historyGenerationInventoryBadge(z)}${historyGenerationIssues(z)}</div>
  ${metaHtml}`+
  z.decks.map((deck,i)=>{
    const d=deck.cards.map(n=>cards.find(x=>x.n===+n)).filter(Boolean);
    const cc=Object.fromEntries(colors.map(c=>[c,d.filter(x=>x.color===c).length]));
    const tableId="history-"+index+"-"+i;
    return `<div class="history-detail">
      <div class="history-deck-head"><h2><input class="deck-title-input" value="${deck.name.replace(/"/g,"&quot;")}" onchange="renameHistoryDeck(${index},${i},this.value)"> <span class="small">— ${d.length} ${T("cardsWord")}</span> ${historyInventoryBadge(deck)}</h2><button class="delete-deck-btn" onclick="deleteHistoryDeck(${index},${i})">🗑 ${T("deleteDeck")}</button></div>
      <div class="grid">${colors.map(c=>`<div class="stat ${c}">${colorIcon(c)} ${label(c)}<br><b>${cc[c]}</b></div>`).join("")}</div>
      <div class="table-scroll"><table><tr>${sortableHeader(tableId,"n","#")}${sortableHeader(tableId,"name",T("card"))}${sortableHeader(tableId,"color",T("color"))}${sortableHeader(tableId,"rarity",T("rarity"))}</tr>
      ${sortedRows(d,tableId).map(x=>`<tr class="${x.color}"><td>${x.n}</td><td>${cardNameHtml(x)}</td><td>${colorIcon(x.color)} ${label(x.color)}</td><td>${x.rarity}</td></tr>`).join("")}</table></div></div>`;
  }).join("");
}
