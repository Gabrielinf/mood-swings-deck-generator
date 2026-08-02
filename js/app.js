
function toggleLangMenu(){let m=document.getElementById("langMenu");m.style.display=m.style.display==="none"?"block":"none"}
function closeLangMenu(){document.getElementById("langMenu").style.display="none"}
document.addEventListener("click",e=>{let p=document.querySelector(".lang-picker");if(p&&!p.contains(e.target))closeLangMenu()});



function setup(){
["nC","nU","nR","nM"].forEach(id=>document.getElementById(id).addEventListener("change",()=>{syncDeckSizeFromRarities()}));["prio1","prio2","prio3","prio4","prio5"].forEach((id,i)=>{let e=document.getElementById(id);e.onchange=()=>enforceUniquePriority(e);e.innerHTML=colors.map(c=>`<option value="${c}">${colorOptionText(c)}</option>`).join("");e.value=colors[i]});rarities.forEach(r=>{document.getElementById("manualBody").innerHTML+=`<tr><th>${r}</th>${colors.map(c=>`<td><input id="q${r}${c}" type=number min=0 value=0></td>`).join("")}</tr>`});document.getElementById("mode").onchange=()=>{const v=document.getElementById("mode").value;document.getElementById("manual").style.display=v==="manual"?"block":"none";document.getElementById("priorityControls").style.display=(v==="balanced"&&document.getElementById("priorityMode").value==="fixed")?"flex":"none";};loadConfig();setLang(language)}
function setLang(v){language=v;document.documentElement.lang=v;Storage.saveLanguage(v);
let lb=document.getElementById("langButton");if(lb)lb.innerHTML=v==="es"?'<span class="flag-svg flag-es"></span><span>Español</span>':'<span class="flag-svg flag-gb"></span><span>English</span>';document.documentElement.lang=v;for(const [id,k] of [["tTitle","title"],["tSub","sub"],["tConfig","config"],["tDeckSize","deckSize"],["tRatioPreset","ratioPreset"],["tC","C"],["tU","U"],["tR","R"],["tM","M"],["tCopies","copies"],["tDecks","decks"],["tMode","mode"],["tPreset","preset"],["tInventory","inventory"],["tInventoryHelp","inventoryHelp"],["tPriorityMode","priorityMode"],["tManual","manual"],["tGenerate","generate"],["tReroll","reroll"],["generateHelp","generateHelp"]])document.getElementById(id).textContent=T(k);mode.options[0].text=T("balancedAuto");mode.options[1].text=T("freeColor");mode.options[2].text=T("manualDistribution");priorityMode.options[0].text=T("randomPriority");priorityMode.options[1].text=T("fixedPriority");
ratioPreset.options[0].text=T("ratioBase");ratioPreset.options[1].text=T("ratioCommon");ratioPreset.options[2].text=T("ratioBalanced");ratioPreset.options[3].text=T("ratioRare");ratioPreset.options[4].text=T("ratioCustom");
preset.options[1].text=T("presetStandard");preset.options[2].text=T("presetPriority");preset.options[3].text=T("presetTwo");preset.options[4].text=T("presetThree");preset.options[5].text=T("presetManual");["prio1","prio2","prio3","prio4","prio5"].forEach(id=>{let e=document.getElementById(id);[...e.options].forEach(o=>o.text=colorOptionText(o.value))});if(collectionDrawer&&document.getElementById("collectionDrawer").classList.contains("open")){drawerTitle.textContent=T("collectionTitle");collectionSearch.placeholder=T("search");renderCollection();}if(historyDrawer&&document.getElementById("historyDrawer").classList.contains("open")){document.getElementById("historyDrawerTitle").textContent=T("history");renderHistoryList();}if(typeof decks!=="undefined"&&decks.length)render();let cd=document.getElementById("collectionDrawer");if(cd&&cd.classList.contains("open"))renderCollection();let hd=document.getElementById("historyDrawer");if(hd&&hd.classList.contains("open")){if(typeof activeHistoryIndex!=="undefined"&&activeHistoryIndex!==null)showHistoryEntry(activeHistoryIndex);else renderHistoryList();}}
function needs(){return {C:+nC.value,U:+nU.value,R:+nR.value,M:+nM.value}}
function rarityTotal(){let n=needs();return n.C+n.U+n.R+n.M}
function activeRatio(){
  if(ratioPreset.value==="custom"){
    if(!customRatio)customRatio=normalizeRatio(needs());
    return customRatio;
  }
  return normalizeRatio(ratioPresets[ratioPreset.value]||ratioPresets.base);
}
function applyRatioPreset(v){
  if(v==="custom"){customRatio=normalizeRatio(needs());return}
  customRatio=null;syncRaritiesToDeckSize();
}
function syncDeckSizeFromRarities(){
  deckSize.value=rarityTotal();
  ratioPreset.value="custom";
  customRatio=normalizeRatio(needs());
  if(mode.value==="manual"&&preset.value)syncManualToRarityCounts();
}
function syncRaritiesToDeckSize(){
  let total=Math.max(1,+deckSize.value||45);
  let vals=allocateByRatio(total,activeRatio());
  nC.value=vals.C;nU.value=vals.U;nR.value=vals.R;nM.value=vals.M;
  if(mode.value==="manual"&&preset.value)syncManualToRarityCounts();
}
function applyPreset(v){
  if(!v)return;
  if(v==="standard"){mode.value="balanced";priorityMode.value="random";updatePriorityUI();}
  else if(v==="priority"){mode.value="balanced";priorityMode.value="fixed";updatePriorityUI();}
  else if(v==="twoColor"){mode.value="manual";setPresetManual(2);}
  else if(v==="threeColor"){mode.value="manual";setPresetManual(3);}
  else if(v==="manual"){mode.value="manual";}
  mode.onchange();
}
function setPresetManual(k){
  let active=getPriority().slice(0,k), ns=needs();
  rarities.forEach(r=>{
    let q=distributeAmong(ns[r],active,true);
    colors.forEach(c=>document.getElementById(`q${r}${c}`).value=q[c]);
  });
}
function syncManualToRarityCounts(){
  if(mode.value!=="manual")return;
  // Preserve which colors are active, but recalculate totals whenever rarity counts change.
  rarities.forEach(r=>{
    let active=colors.filter(c=>(+document.getElementById(`q${r}${c}`).value||0)>0);
    if(!active.length)active=getPriority();
    let q=distributeAmong(needs()[r],active,true);
    colors.forEach(c=>document.getElementById(`q${r}${c}`).value=q[c]);
  });
}

function enforceUniquePriority(changed){
  let sels=["prio1","prio2","prio3","prio4","prio5"].map(id=>document.getElementById(id));
  let old=changed.dataset.prev||"";
  let duplicate=sels.find(x=>x!==changed&&x.value===changed.value);
  if(duplicate){
    if(old && !sels.some(x=>x!==changed&&x!==duplicate&&x.value===old)) duplicate.value=old;
    else {
      let used=new Set(sels.filter(x=>x!==duplicate).map(x=>x.value));
      duplicate.value=colors.find(c=>!used.has(c))||duplicate.value;
    }
  }
  sels.forEach(x=>x.dataset.prev=x.value);
}
function initPriorityPrevious(){["prio1","prio2","prio3","prio4","prio5"].forEach(id=>{let e=document.getElementById(id);e.dataset.prev=e.value})}

function getPriority(){let a=[prio1.value,prio2.value,prio3.value,prio4.value,prio5.value];if(new Set(a).size!==5)throw Error(language==="es"?"Cada color debe aparecer una sola vez en la prioridad.":"Each color must appear exactly once in the priority.");return a}
function updatePriorityUI(){priorityControls.style.display=priorityMode.value==="fixed"?"flex":"none"}
function newSeed(){
  let el=document.getElementById("seedInput");
  if(el)el.value=createSeed();
  setSeedStatus("");
}
function showToast(message,type="ok"){
 const el=document.getElementById("appToast");if(!el)return;
 el.textContent=message;el.className=`app-toast show ${type}`;
 clearTimeout(appToastTimer);appToastTimer=setTimeout(()=>el.className="app-toast",2200);
}
function setSeedStatus(msg){
  let el=document.getElementById("seedStatus");
  if(el)el.textContent=msg;
}
async function copySeed(){
  let el=document.getElementById("seedInput");if(!el)return;
  if(!el.value.trim())newSeed();
  const value=el.value.trim();
  try{
    await navigator.clipboard.writeText(value);
    setSeedStatus(language==="es"?"Copiada ✓":"Copied ✓");showToast(language==="es"?"Seed copiada ✓":"Seed copied ✓");
  }catch(e){
    el.focus();el.select();
    try{document.execCommand("copy");setSeedStatus(language==="es"?"Copiada ✓":"Copied ✓")}
    catch(_){setSeedStatus(language==="es"?"Seed seleccionada":"Seed selected")}
  }
}
async function pasteSeed(){
  let el=document.getElementById("seedInput");if(!el)return;
  try{
    const value=(await navigator.clipboard.readText()).trim();
    if(value){el.value=value;setSeedStatus(language==="es"?"Cargada ✓":"Loaded ✓")}
  }catch(e){
    el.focus();
    setSeedStatus(language==="es"?"Pega la seed en el campo":"Paste seed in the field");
  }
}
function getGenerationSeed(){
  let el=document.getElementById("seedInput");
  let value=(el?.value||"").trim();
  if(!value){value=createSeed();if(el)el.value=value}
  return value;
}
function generateNew(){
  locks={};deckNames=[];
  newSeed();
  return generate();
}
function generateWithSeed(){
  locks={};deckNames=[];
  return generate();
}
function updateGenerationActionHints(){
  const rr=document.getElementById("tReroll"),gn=document.getElementById("tGenerate"),gs=document.getElementById("generateSeedBtn");
  if(rr)rr.title=language==="es"?"Genera otra variante con una seed nueva y conserva las cartas bloqueadas.":"Generate another variant with a new seed while keeping locked cards.";
  if(gn)gn.title=language==="es"?"Genera desde cero con una seed nueva y elimina los bloqueos actuales.":"Generate from scratch with a new seed and clear current locks.";
  if(gs)gs.title=language==="es"?"Genera desde cero con la seed escrita y elimina los bloqueos actuales.":"Generate from scratch with the entered seed and clear current locks.";
}
function reroll(){
  newSeed();
  return generate();
}

function readGeneratorConfig(){
  const es=language==="es";
  const count=Math.max(1,+deckCount.value||1);
  const mc=+maxCopies.value;
  if(!Number.isInteger(mc)||mc<1)throw generationError(es?"Máx. copias por carta debe ser un entero de al menos 1.":"Max copies per card must be an integer of at least 1.");
  const ns=needs();
  const target=Math.max(1,+deckSize.value||1);
  for(const r of rarities){
    if(!Number.isInteger(ns[r])||ns[r]<0)throw generationError(es?`La cantidad de rareza ${r} debe ser un entero mayor o igual a 0.`:`Rarity ${r} must be a non-negative integer.`);
  }
  if(rarityTotal()!==target)throw generationError(es?`La suma de rarezas (${rarityTotal()}) debe coincidir con Cartas por mazo (${target}).`:`Rarity total (${rarityTotal()}) must match Cards per deck (${target}).`);
  const colorMode=mode.value;
  const manualDistribution=Object.fromEntries(rarities.map(r=>[r,Object.fromEntries(colors.map(c=>[c,Math.max(0,Math.floor(+document.getElementById(`q${r}${c}`).value||0))]))]));
  if(colorMode==="manual"){
    for(const r of rarities){
      const vals=colors.map(c=>manualDistribution[r][c]);
      if(vals.some(v=>!Number.isInteger(v)||v<0))throw generationError(es?`${r}: la distribución manual por color debe usar números enteros mayores o iguales a 0.`:`${r}: manual color distribution must use non-negative integers.`);
      const sum=vals.reduce((a,b)=>a+b,0);
      if(sum!==ns[r])throw generationError(es?`${r}: la distribución manual por color suma ${sum}, pero debe sumar ${ns[r]}.`:`${r}: manual color distribution totals ${sum}, but must total ${ns[r]}.`);
    }
  }
  const pMode=colorMode==="free"?"random":priorityMode.value;
  const priority=pMode==="fixed"?getPriority():[...colors];
  return {count,maxCopies:mc,respectInventory:respectInv.checked,seed:getGenerationSeed(),
    rarityCounts:ns,colorMode,priorityMode:pMode,priority,manualDistribution,lang:language};
}
function generate(){try{
  const config=readGeneratorConfig();
  activeGenerationSeed=config.seed;
  activeGenerationRng=makeSeededRng(config.seed);
  while(deckNames.length<config.count)deckNames.push("");
  deckNames=deckNames.slice(0,config.count);
  decks=Generator.generate(config,cards,excluded,locks);
  let statusEl=document.getElementById("status");if(statusEl){statusEl.style.display="none";statusEl.innerHTML=""}
  render();
}catch(e){
  let statusEl=document.getElementById("status");statusEl.className="card generation-error";statusEl.style.display="block";statusEl.innerHTML=`<strong>${language==="es"?"No se pudo generar el mazo":"Deck generation failed"}</strong><br><span class=bad>${e.message}</span>`;
}}

function sortIndicator(tableId,col){
  let st=sortState[tableId];
  if(!st||st.col!==col||st.dir==="base") return " ↕";
  return st.dir==="asc"?" ↑":" ↓";
}
function cycleSort(tableId,col){
  let st=sortState[tableId]||{col:null,dir:"base"};
  if(st.col!==col) st={col:col,dir:"asc"};
  else if(st.dir==="asc") st.dir="desc";
  else if(st.dir==="desc") st.dir="base";
  else st.dir="asc";
  sortState[tableId]=st;
  if(tableId==="collection"){renderCollection();}
  else if(tableId.startsWith("history-") && activeHistoryIndex!==null){showHistoryEntry(activeHistoryIndex);}
  else render();
}
function sortedRows(rows,tableId){
  let st=sortState[tableId];
  if(!st||st.dir==="base"||!st.col) return [...rows];
  let a=[...rows], col=st.col, mul=st.dir==="asc"?1:-1;
  a.sort((x,y)=>{
    let xv=x[col], yv=y[col];
    if(typeof xv==="number"&&typeof yv==="number") return (xv-yv)*mul;
    return String(xv).localeCompare(String(yv),language==="es"?"es":"en",{numeric:true,sensitivity:"base"})*mul;
  });
  return a;
}
function sortableHeader(tableId,col,text){return `<th class="sortable" onclick="cycleSort('${tableId}','${col}')">${text}${sortIndicator(tableId,col)}</th>`}


function inventoryUsed(exceptDeckIndex=null,exceptCardNumber=null){
  let used={};
  decks.forEach((d,di)=>d.forEach(x=>{
    if(di===exceptDeckIndex && x.n===exceptCardNumber)return;
    used[x.n]=(used[x.n]||0)+1;
  }));
  return used;
}
function swapCandidateState(x,current,deckIndex,cardNumber,used,inDeck){
  let reasons=[];
  if(x.n===cardNumber)reasons.push(language==="es"?"Es la carta actual.":"This is the current card.");
  if(x.rarity!==current.rarity)reasons.push(language==="es"?"Rareza diferente.":"Different rarity.");
  if(excluded.has(x.n))reasons.push(language==="es"?"Carta excluida.":"Card is excluded.");
  if(inDeck.has(x.n))reasons.push(language==="es"?"Ya está en este mazo.":"Already in this deck.");
  let usedQty=used[x.n]||0;
  let limit=respectInv.checked?Math.max(0,+x.qty||0):Math.max(1,+maxCopies.value||1);
  let available=Math.max(0,limit-usedQty);
  if(respectInv.checked && x.qty<=0)reasons.push(language==="es"?"No tienes copias en la colección.":"No copies in collection.");
  else if(available<=0)reasons.push(respectInv.checked?(language==="es"?"Todas las copias disponibles están siendo usadas.":"All available copies are already in use."):(language==="es"?"Se alcanzó el máximo de copias permitido.":"Maximum allowed copies reached."));
  return {valid:reasons.length===0,reasons,available,usedQty};
}

function swapOptionHtml(x,state){
  let available=state.available;
  let avText=language==="es"?`${available} disponible${available===1?"":"s"}`:`${available} available`;
  return `<div class="swap-option ${state.valid?"":"unavailable"}"><span><b>#${x.n} ${cardNameHtml(x)}</b><span class="availability ${available<=0?"zero":""}">${avText}</span><br><span class=small>${colorIcon(x.color)} ${label(x.color)} · ${x.rarity} · ${language==="es"?"Colección":"Collection"} ×${x.qty}</span>${state.reasons.length?`<span class="reason">${state.reasons.join(" ")}</span>`:""}</span><button ${state.valid?"":'disabled'} onclick="replaceDeckCard(${x.n})">${T("changeCard")}</button></div>`;
}
function openSwapModal(deckIndex,cardNumber){
  let current=decks[deckIndex]?.find(x=>x.n===cardNumber);if(!current)return;
  swapContext={deckIndex,cardNumber};
  let used=inventoryUsed(deckIndex,cardNumber);
  let inDeck=new Set(decks[deckIndex].filter(x=>x.n!==cardNumber).map(x=>x.n));
  let candidates=cards.filter(x=>x.n!==cardNumber&&x.rarity===current.rarity);
  let entries=candidates.map(x=>({card:x,state:swapCandidateState(x,current,deckIndex,cardNumber,used,inDeck)}));
  let validCount=entries.filter(e=>e.state.valid).length;
  let same=entries.filter(e=>e.card.color===current.color).sort((a,b)=>a.card.n-b.card.n);
  let otherGroups=colors.filter(c=>c!==current.color).map(c=>({
    color:c,entries:entries.filter(e=>e.card.color===c).sort((a,b)=>a.card.n-b.card.n)
  })).filter(g=>g.entries.length);

  document.getElementById("swapTitle").textContent=`${T("replaceCard")}: ${current.name}`;
  let sameHtml=`<h3>${colorIcon(current.color)} ${T("sameColor")} — ${label(current.color)}</h3>`+
    (same.length?same.map(e=>swapOptionHtml(e.card,e.state)).join(""):`<p class=small>${language==="es"?"No hay cartas de esta rareza y color.":"No cards with this rarity and color."}</p>`);
  let otherHtml=`<hr><h3>${T("otherColors")}</h3><p class="small">⚠️ ${T("colorRuleWarning")}</p>`+
    (otherGroups.length?otherGroups.map(g=>`<h3>${colorIcon(g.color)} ${label(g.color)}</h3>${g.entries.map(e=>swapOptionHtml(e.card,e.state)).join("")}`).join("")
    :`<p class=small>${language==="es"?"No hay cartas de otros colores con esta rareza.":"No other-color cards with this rarity."}</p>`);

  document.getElementById("swapBody").innerHTML=
    `<p class="small">${colorIcon(current.color)} ${label(current.color)} · ${current.rarity} — ${T("availableReplacements")}: ${validCount}</p>`+
    sameHtml+otherHtml;
  document.getElementById("swapOverlay").classList.add("open");
}
function closeSwapModal(){document.getElementById("swapOverlay").classList.remove("open");swapContext=null}
function replaceDeckCard(newNumber){
  if(!swapContext)return;
  let {deckIndex,cardNumber}=swapContext,newCard=cards.find(x=>x.n===newNumber),d=decks[deckIndex];if(!newCard||!d)return;
  let idx=d.findIndex(x=>x.n===cardNumber);if(idx<0)return;
  let wasLocked=!!locks[deckIndex+"-"+cardNumber];
  delete locks[deckIndex+"-"+cardNumber];
  d[idx]=newCard;
  if(wasLocked)locks[deckIndex+"-"+newNumber]=true;
  closeSwapModal();render();
}




function deckSummaryHtml(d){
 let rc={C:0,U:0,R:0,M:0},cc={White:0,Blue:0,Black:0,Red:0,Green:0};
 d.forEach(x=>{if(rc[x.rarity]!==undefined)rc[x.rarity]++;if(cc[x.color]!==undefined)cc[x.color]++});
 let target={C:+nC.value,U:+nU.value,R:+nR.value,M:+nM.value},errors=[];
 let expected=target.C+target.U+target.R+target.M;
 if(d.length!==expected)errors.push((language==="es"?"Cantidad de cartas":"Card count")+`: ${d.length} / ${expected}`);
 ["C","U","R","M"].forEach(r=>{if(rc[r]!==target[r])errors.push(`${r}: ${rc[r]} / ${target[r]}`)});
 let nums=d.map(x=>x.n),dups=[...new Set(nums.filter((n,i)=>nums.indexOf(n)!==i))];
 if(dups.length)errors.push((language==="es"?"Cartas repetidas":"Duplicate cards")+": "+dups.join(", "));
 let valid=!errors.length;
 return `<div class="deck-summary">
 <span class="deck-summary-status ${valid?"valid":"invalid"}">${valid?(language==="es"?"✓ Mazo válido":"✓ Valid deck"):(language==="es"?"⚠ Revisar mazo":"⚠ Check deck")}</span>
 <span class="deck-summary-chip"><b>${d.length}</b> ${T("cardsWord")}</span>
 <span class="deck-summary-chip">C ${rc.C} · U ${rc.U} · R ${rc.R} · M ${rc.M}</span>
 <span class="deck-summary-chip">⚪ ${cc.White}</span><span class="deck-summary-chip">🔵 ${cc.Blue}</span><span class="deck-summary-chip">⚫ ${cc.Black}</span><span class="deck-summary-chip">🔴 ${cc.Red}</span><span class="deck-summary-chip">🟢 ${cc.Green}</span>
 <ul class="deck-summary-errors">${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
}
function deckCollectionStatusHtml(deck){
  const required={};
  deck.forEach(x=>required[x.n]=(required[x.n]||0)+1);
  const missing=[];
  Object.entries(required).forEach(([n,need])=>{
    const card=cards.find(x=>x.n===+n);
    const have=card?(+card.qty||0):0;
    if(have<need)missing.push({card,need,have,missing:need-have});
  });
  const es=language==="es";
  if(!missing.length)return `<div class="deck-collection-check ok">✓ ${es?"Puedes construir este mazo con tu colección.":"You can build this deck from your collection."}</div>`;
  const missingCopies=missing.reduce((n,x)=>n+x.missing,0);
  return `<details class="deck-collection-check bad"><summary>⚠ ${es?`Te faltan ${missingCopies} copia${missingCopies===1?"":"s"} de ${missing.length} carta${missing.length===1?"":"s"}.`:`Missing ${missingCopies} cop${missingCopies===1?"y":"ies"} across ${missing.length} card${missing.length===1?"":"s"}.`}</summary>
    <ul class="deck-missing-list">${missing.map(x=>`<li>${x.card?`<button type="button" class="missing-card-link" onclick="openCollectionAtCard(${x.card.n})">${cardNameHtml(x.card)}</button>`:"#"+x.card?.n}: ${es?"necesitas":"need"} ${x.need}, ${es?"tienes":"have"} ${x.have} → <b>${es?"faltan":"missing"} ${x.missing}</b></li>`).join("")}</ul>
  </details>`;
}
function updateDeckCountHelp(){let e=document.getElementById("deckCountHelp");if(!e)return;e.textContent=respectInv.checked?(language==="es"?"Las copias disponibles de tu colección se reparten entre todos los mazos para que puedan usarse simultáneamente.":"Available copies in your collection are shared across all decks so they can be used simultaneously."):"";document.querySelectorAll(".config-section-title").forEach(x=>x.textContent=language==="es"?x.dataset.es:x.dataset.en);}
function render(){updateDeckCountHelp();updateGenerationActionHints();updateStructuralNavigationLanguage();let ns=document.getElementById("newSeedBtn"),cs=document.getElementById("copySeedBtn"),ps=document.getElementById("pasteSeedBtn");if(ns)ns.textContent=language==="es"?"↻ Nueva seed":"↻ New seed";if(cs)cs.textContent=language==="es"?"⧉ Copiar":"⧉ Copy";if(ps)ps.textContent=language==="es"?"▣ Pegar":"▣ Paste";let gs=document.getElementById("generateSeedBtn");if(gs)gs.textContent=language==="es"?"Generar con seed":"Generate with seed";let statusEl=document.getElementById("status");statusEl.style.display="none";statusEl.innerHTML="";decksDiv=document.getElementById("decks");decksDiv.innerHTML=decks.map((d,i)=>`<div class=card><div class="deck-header-row"><h2><input class="deck-title-input" value="${(deckNames[i]||`${T("deck")} ${i+1}`).replace(/"/g,"&quot;")}" onchange="deckNames[${i}]=this.value.trim()||('${T("deck")} '+(${i}+1));render()"> <span class="small">— ${d.length} / ${deckSize.value} ${T("cardsWord")}</span></h2><div class="deck-header-actions"><button class="save-deck-btn" onclick="saveDeck(${i})">💾 ${T("saveDeck")}</button><button class="secondary deck-json-btn" onclick="exportDeckJSON(${i})">${language==="es"?"Exportar JSON":"Export JSON"}</button><button class="secondary deck-json-btn" onclick="prepareDeckJSONImport(${i})">${language==="es"?"Importar JSON":"Import JSON"}</button></div></div><div class=grid>${colors.map(c=>`<div class="stat ${c}">${label(c)}<br><b>${d.filter(x=>x.color===c).length}</b></div>`).join("")}</div>${deckSummaryHtml(d)}${deckCollectionStatusHtml(d)}<div class="table-scroll"><table><tr><th>🔒</th>${sortableHeader("deck"+i,"n","#")}${sortableHeader("deck"+i,"name",T("card"))}${sortableHeader("deck"+i,"color",T("color"))}${sortableHeader("deck"+i,"rarity",T("rarity"))}<th>${T("changeCard")}</th></tr>${sortedRows(d,"deck"+i).map(x=>`<tr class=${x.color}><td><input type=checkbox ${locks[i+"-"+x.n]?"checked":""} onchange="locks['${i+"-"+x.n}']=this.checked"></td><td>${x.n}</td><td>${cardNameHtml(x)}</td><td>${colorIcon(x.color)} ${label(x.color)}</td><td>${x.rarity}</td><td><button class="change-btn" onclick="openSwapModal(${i},${x.n})">↔ ${T("changeCard")}</button></td></tr>`).join("")}</table></div>`).join("")}
function applyConfigToUI(c, opts){
  opts=opts||{};
  if(c.deckSize!=null)deckSize.value=c.deckSize;
  if(c.ratioPreset!=null)ratioPreset.value=c.ratioPreset;
  if(c.rarityCounts){
    if(c.rarityCounts.C!=null)nC.value=c.rarityCounts.C;
    if(c.rarityCounts.U!=null)nU.value=c.rarityCounts.U;
    if(c.rarityCounts.R!=null)nR.value=c.rarityCounts.R;
    if(c.rarityCounts.M!=null)nM.value=c.rarityCounts.M;
  }
  if(c.maxCopies!=null)maxCopies.value=c.maxCopies;
  if(c.deckCount!=null){
    if(!opts.deckCountOnlyIfTarget||opts.targetDeckIndex!=null)
      deckCount.value=Math.max(1,+c.deckCount||1);
  }
  if(c.mode!=null)mode.value=c.mode;
  if(c.preset!=null)preset.value=c.preset;
  if(c.respectInventory!=null)respectInv.checked=!!c.respectInventory;
  if(c.priorityMode!=null)priorityMode.value=c.priorityMode;
  if(Array.isArray(c.priority)){
    [prio1,prio2,prio3,prio4,prio5].forEach((el,i)=>{if(c.priority[i]!=null)el.value=c.priority[i]});
  }
  if(c.manualDistribution){
    rarities.forEach(r=>colors.forEach(col=>{
      const el=document.getElementById(`q${r}${col}`);
      if(el&&c.manualDistribution[r]&&c.manualDistribution[r][col]!=null)el.value=c.manualDistribution[r][col];
    }));
  }
}
function currentGeneratorConfigSnapshot(){
  return {
    deckSize:+deckSize.value,
    ratioPreset:ratioPreset.value,
    rarityCounts:{C:+nC.value,U:+nU.value,R:+nR.value,M:+nM.value},
    maxCopies:+maxCopies.value,
    deckCount:+deckCount.value,
    mode:mode.value,
    preset:preset.value,
    respectInventory:respectInv.checked,
    priorityMode:priorityMode.value,
    priority:[prio1.value,prio2.value,prio3.value,prio4.value,prio5.value],
    manualDistribution:Object.fromEntries(rarities.map(r=>[r,Object.fromEntries(colors.map(c=>[c,+document.getElementById(`q${r}${c}`).value||0]))]))
  };
}
function saveDeck(index){
 if(!decks||!decks[index])return;
 try{
  let h=getHistory(),name=deckNames[index]||`${T("deck")} ${index+1}`;
  h.unshift({id:Date.now(),type:"generated",date:new Date().toLocaleString(),seed:activeGenerationSeed||(document.getElementById("seedInput")?.value||"").trim(),configuration:currentGeneratorConfigSnapshot(),decks:[{name,cards:decks[index].map(x=>x.n)}]});
  setHistory(h.slice(0,50));
  if(document.getElementById("historyDrawer").classList.contains("open"))renderHistoryList();
  showToast(T("saved")+" ✓");
 }catch(e){alert((language==="es"?"No se pudo guardar el historial: ":"Could not save history: ")+e.message)}
}



function saveConfigAuto(){
 try{
  const o={deckSize:deckSize.value,ratioPreset:ratioPreset.value,nC:nC.value,nU:nU.value,nR:nR.value,nM:nM.value,maxCopies:maxCopies.value,deckCount:deckCount.value,mode:mode.value,preset:preset.value,respectInv:respectInv.checked,priorityMode:priorityMode.value,prio1:prio1.value,prio2:prio2.value,prio3:prio3.value,prio4:prio4.value,prio5:prio5.value};
  rarities.forEach(r=>colors.forEach(c=>{const e=document.getElementById("q"+r+c);if(e)o["q"+r+c]=e.value}));
  Storage.saveConfig(o);
 }catch(e){}
}
function scheduleConfigAutosave(){clearTimeout(configAutosaveTimer);configAutosaveTimer=setTimeout(saveConfigAuto,120)}
function initConfigAutosave(){
 const ids=["deckSize","ratioPreset","nC","nU","nR","nM","maxCopies","deckCount","mode","preset","respectInv","priorityMode","prio1","prio2","prio3","prio4","prio5",...rarities.flatMap(r=>colors.map(c=>"q"+r+c))];
 ids.forEach(id=>{const e=document.getElementById(id);if(!e)return;e.addEventListener("change",scheduleConfigAutosave);e.addEventListener("input",scheduleConfigAutosave)});
}
function loadConfig(){let o=Storage.loadConfig();for(const k in o){let e=document.getElementById(k);if(e)e.type==="checkbox"?e.checked=o[k]:e.value=o[k]}if(!o.deckSize)deckSize.value=rarityTotal();if(!o.ratioPreset)ratioPreset.value="base";if(ratioPreset.value==="custom")customRatio=normalizeRatio(needs());mode.onchange();updatePriorityUI()}
setup();initPriorityPrevious();updatePriorityUI();initConfigAutosave();generate();

setTimeout(()=>{let e=document.getElementById("seedInput");if(e&&!e.value)newSeed()},0);


