function openCustomDeck(){
  document.getElementById("decks").style.display="none";
  document.getElementById("customDeckSection").style.display="";
  document.body.classList.add("custom-mode");
  setStructuralActive("customdeck");
  const el=document.getElementById("section-customdeck");
  if(el)setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),0);
  _initCustomStickyBar();
}
function closeCustomDeck(){
  document.getElementById("decks").style.display="";
  document.getElementById("customDeckSection").style.display="none";
  document.body.classList.remove("custom-mode");
  document.getElementById("stickyCustom").style.display="none";
  document.body.classList.remove("has-sticky-bar");
  closeAddCardDrawer();
}

function _updateCustomNavBadge(){
  const badge=document.getElementById("customNavBadge");if(!badge)return;
  const n=customDeck.length;
  badge.textContent=n>0?String(n):"";
  badge.style.display=n>0?"":"none";
}

function _initCustomStickyBar(){
  const trigger=document.getElementById("customDeckCard");
  const bar=document.getElementById("stickyCustom");
  if(!bar)return;
  function onScroll(){
    if(!document.body.classList.contains("custom-mode")){bar.style.display="none";return;}
    const rect=trigger?.getBoundingClientRect();
    const visible=rect&&rect.bottom<0;
    bar.style.display=visible?"flex":"none";
    document.body.classList.toggle("has-sticky-bar",visible);
  }
  // Remove previous listener to avoid stacking
  if(bar._scrollListener)window.removeEventListener("scroll",bar._scrollListener);
  bar._scrollListener=onScroll;
  window.addEventListener("scroll",onScroll,{passive:true});
  onScroll();
}

function _updateCustomStickyBar(){
  const es=language==="es";
  const ns={C:+nC.value,U:+nU.value,R:+nR.value,M:+nM.value};
  const total=ns.C+ns.U+ns.R+ns.M;
  const count=document.getElementById("stickyCustomCount");
  const save=document.getElementById("stickyCustomSave");
  const msc=document.getElementById("stickyCustomMsc");
  if(count)count.textContent=`${customDeck.length} / ${total}`;
  if(save)save.textContent=`💾 ${T("customSave")}`;
  if(msc)msc.title=es?"Copiar código MSC":"Copy MSC code";
}

function openAddCardDrawer(rarity){
  const drawer=document.getElementById("addCardDrawer");
  const overlay=document.getElementById("drawerOverlay");
  if(!drawer)return;
  drawer.classList.add("open");
  overlay.classList.add("open");
  document.body.classList.add("drawer-open");
  const inp=document.getElementById("addCardSearch");
  if(inp){
    inp.value="";
    inp.dataset.rarityFilter=rarity||"";
    inp.placeholder=T("customSearchPlaceholder");
    setTimeout(()=>inp.focus(),60);
  }
  const title=document.getElementById("addCardDrawerTitle");
  if(title){
    const es=language==="es";
    const rarityNames={C:es?"Común":"Common",U:es?"Infrecuente":"Uncommon",R:es?"Rara":"Rare",M:es?"Mítica":"Mythic"};
    title.textContent=rarity
      ?(es?`Agregar carta — ${rarityNames[rarity]||rarity}`:`Add card — ${rarityNames[rarity]||rarity}`)
      :(es?"Agregar carta":"Add card");
  }
  renderAddCardSearch();
}
function closeAddCardDrawer(){
  const drawer=document.getElementById("addCardDrawer");
  if(!drawer)return;
  drawer.classList.remove("open");
  const co=document.getElementById("collectionDrawer").classList.contains("open");
  const ho=document.getElementById("historyDrawer").classList.contains("open");
  if(!co&&!ho){
    document.getElementById("drawerOverlay").classList.remove("open");
    document.body.classList.remove("drawer-open");
  }
}

function updateCustomDeckUI(){ renderCustomDeck(); }

const _rarityOrder={C:0,U:1,R:2,M:3};
function _sortDeck(deck){
  return [...deck].sort((a,b)=>
    (_rarityOrder[a.rarity]-_rarityOrder[b.rarity])||
    a.n-b.n||
    a.color.localeCompare(b.color)
  );
}

function customDeckCardCounts(){
  const counts={};
  customDeck.forEach(x=>counts[x.n]=(counts[x.n]||0)+1);
  return counts;
}

function customDeckMaxForCard(card){
  const mc=Math.max(1,+maxCopies.value||1);
  if(respectInv.checked)return Math.min(mc,Math.max(0,+card.qty||0));
  return mc;
}

function _persistCustomDeck(){
  Storage.saveCustomDeck(customDeck,customDeckName);
}

function customDeckAddCard(n){
  const card=cards.find(x=>x.n===+n);if(!card)return;
  if(excluded.has(card.n)){showToast(T("customExcluded"),"bad");return;}
  const counts=customDeckCardCounts();
  const current=counts[card.n]||0;
  const max=customDeckMaxForCard(card);
  if(current>=max){showToast(T("customMaxCopies"),"bad");return;}
  customDeck.push(card);
  _persistCustomDeck();
  renderCustomDeck();
  closeAddCardDrawer();
  showToast(T("customCardAdded"));
}



function customDeckSetCopies(n,val){
  const card=cards.find(x=>x.n===+n);if(!card)return;
  const max=customDeckMaxForCard(card);
  const target=Math.max(0,Math.min(+val||0,max));
  customDeck=customDeck.filter(x=>x.n!==+n);
  for(let i=0;i<target;i++)customDeck.push(card);
  _persistCustomDeck();
  renderCustomDeck();
}

function _customConfirm(message, onConfirm){
  const es=language==="es";
  const overlay=document.createElement("div");
  overlay.className="custom-confirm-overlay";
  overlay.innerHTML=`<div class="custom-confirm-box">
    <p class="custom-confirm-msg">${message}</p>
    <div class="custom-confirm-actions">
      <button type="button" class="custom-confirm-cancel secondary">${es?"Cancelar":"Cancel"}</button>
      <button type="button" class="custom-confirm-ok">${es?"Confirmar":"Confirm"}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector(".custom-confirm-cancel").onclick=()=>overlay.remove();
  overlay.querySelector(".custom-confirm-ok").onclick=()=>{overlay.remove();onConfirm();};
}
function customDeckClear(){
  if(!customDeck.length){customDeck=[];_persistCustomDeck();renderCustomDeck();return;}
  _customConfirm(T("customClearConfirm"),()=>{customDeck=[];_persistCustomDeck();renderCustomDeck();});
}

function customDeckSave(){
  if(!customDeck.length){showToast(T("customEmpty"),"bad");return;}
  const name=(document.getElementById("customDeckNameInput")?.value||"").trim()||T("customDeck");
  customDeckName=name;
  try{
    let h=getHistory();
    h.unshift({id:Date.now(),type:"custom",date:new Date().toLocaleString(),
      decks:[{name,cards:customDeck.map(x=>x.n)}]});
    setHistory(h.slice(0,50));
    showToast(T("saved")+" ✓");
  }catch(e){alert((language==="es"?"No se pudo guardar: ":"Could not save: ")+e.message)}
}

function _doUseGenerator(){
  const es=language==="es";
  try{
    newSeed();
    const config=readGeneratorConfig();
    config.count=1;
    const result=Generator.generate(config,cards,excluded,locks);
    customDeck=_sortDeck(result[0]||[]);
    _persistCustomDeck();
    renderCustomDeck();
    showToast(es?"Generado ✓":"Generated ✓");
  }catch(e){showToast(e.message,"bad");}
}
function customDeckUseGenerator(){
  const es=language==="es";
  if(customDeck.length){_customConfirm(es?"¿Reemplazar el mazo actual con uno generado? Esta acción no se puede deshacer.":"Replace the current deck with a generated one? This cannot be undone.",()=>{_doUseGenerator();});return;}
  _doUseGenerator();return;
}


// Fase 9: load into custom deck from history entry
function loadHistoryEntryToCustomDeck(entryIndex,deckIndex){
  deckIndex=deckIndex||0;
  const z=getHistory()[entryIndex];
  if(!z||!z.decks||!z.decks[deckIndex])return;
  const deckData=z.decks[deckIndex];
  const loaded=deckData.cards.map(n=>cards.find(x=>x.n===+n)).filter(Boolean);
  if(!loaded.length){showToast(language==="es"?"No se encontraron cartas.":"No cards found.","bad");return;}
  customDeck=_sortDeck(loaded);
  customDeckName=deckData.name||T("customDeck");
  _persistCustomDeck();
  renderCustomDeck();
  closeHistory();
  // Switch to custom section
  document.getElementById("decks").style.display="none";
  document.getElementById("customDeckSection").style.display="";
  document.body.classList.add("custom-mode");
  setStructuralActive("customdeck");
  Storage.saveSection("customdeck");
  setTimeout(()=>document.getElementById("section-customdeck")?.scrollIntoView({behavior:"smooth",block:"start"}),0);
  showToast(language==="es"?"Cargado en Custom ✓":"Loaded into Custom ✓");
}

// Fase 10: export custom deck as JSON
function exportCustomDeckJSON(){
  if(!customDeck.length){showToast(T("customEmpty"),"bad");return;}
  const name=(document.getElementById("customDeckNameInput")?.value||"").trim()||customDeckName||T("customDeck");
  const counts={};
  customDeck.forEach(x=>counts[x.n]=(counts[x.n]||0)+1);
  const payload={
    format:"MoodSwingsDeckGenerator",
    version:2,
    schema:"custom-deck",
    app:"Mood Swings Deck Generator",
    exportedAt:new Date().toISOString(),
    msc:customDeckMscCode(),
    decks:[{
      name,
      cards:customDeck.map(x=>({number:x.n,name:x.name,color:x.color,rarity:x.rarity}))
    }]
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=safeFileName(name)+".json";
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0);
}

// Fase 10: import custom deck from JSON
function importCustomDeckJSON(file){
  if(!file)return;
  const es=language==="es";
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(String(reader.result||""));
      if(!data||data.format!=="MoodSwingsDeckGenerator")
        throw new Error(es?"Formato no reconocido.":"Unrecognized format.");
      const deckData=Array.isArray(data.decks)&&data.decks[0];
      if(!deckData||!Array.isArray(deckData.cards))
        throw new Error(es?"El archivo no contiene un mazo.":"File contains no deck.");
      const loaded=deckData.cards.map(ref=>{
        const n=+(typeof ref==="object"?ref.number:ref);
        const card=cards.find(x=>x.n===n);
        if(!card)throw new Error((es?"Carta desconocida #":"Unknown card #")+n);
        return card;
      });
      const _applyJson=()=>{customDeck=_sortDeck(loaded);customDeckName=deckData.name||T("customDeck");_persistCustomDeck();renderCustomDeck();showToast(es?"JSON importado ✓":"JSON imported ✓");};
      if(customDeck.length){_customConfirm(es?"¿Reemplazar el mazo actual con el JSON importado?":"Replace current deck with imported JSON?",_applyJson);return;}
      _applyJson();
    }catch(e){alert((es?"No se pudo importar: ":"Could not import: ")+e.message);}
  };
  reader.readAsText(file,"UTF-8");
}

function customDeckMscCode(){
  if(!customDeck.length)return "";
  try{return MSC.encode(customDeck);}catch(e){return "";}
}

async function customDeckCopyCode(){
  const code=customDeckMscCode();
  if(!code){showToast(T("customEmpty"),"bad");return;}
  try{
    try{await navigator.clipboard.writeText(code);}
    catch(e){
      const ta=document.createElement("textarea");ta.value=code;
      document.body.appendChild(ta);ta.select();
      if(!document.execCommand("copy"))throw new Error("copy failed");
      ta.remove();
    }
    showToast(T("mscCopied"));
  }catch(e){showToast(language==="es"?"No se pudo copiar":"Could not copy","bad");}
}

function customDeckToggleMscImport(btn){
  const row=document.getElementById("mscImportRow");if(!row)return;
  const open=row.style.display==="none";
  row.style.display=open?"flex":"none";
  if(open){
    const inp=document.getElementById("mscImportInput");
    if(inp){inp.value="";inp.focus();}
    const status=document.getElementById("mscImportStatus");
    if(status)status.textContent="";
  }
}

function customDeckValidateMscInput(inp){
  const val=(inp.value||"").trim();
  const btn=document.getElementById("mscImportApplyBtn");
  const status=document.getElementById("mscImportStatus");
  if(!val){
    if(btn)btn.disabled=true;
    if(status)status.textContent="";
    return;
  }
  const valid=MSC.validate(val);
  if(btn)btn.disabled=!valid;
  if(status){
    const es=language==="es";
    status.textContent=valid?(es?"✓ Código válido":"✓ Valid code"):(es?"Código inválido":"Invalid code");
    status.className="msc-import-status "+(valid?"ok":"bad");
  }
}

function customDeckApplyMscImport(){
  const inp=document.getElementById("mscImportInput");
  const code=(inp?.value||"").trim();
  if(!code)return;
  const es=language==="es";
  try{
    const entries=MSC.decode(code);
    const newDeck=[];
    for(const {n,copies} of entries){
      const card=cards.find(x=>x.n===n);
      if(!card)throw new Error((es?"Carta desconocida #":"Unknown card #")+n);
      for(let i=0;i<copies;i++)newDeck.push(card);
    }
    // Warn if imported composition doesn't match current rarity config
    const ns={C:+nC.value,U:+nU.value,R:+nR.value,M:+nM.value};
    const rc={C:0,U:0,R:0,M:0};
    newDeck.forEach(x=>rc[x.rarity]=(rc[x.rarity]||0)+1);
    const mismatch=rarities.some(r=>rc[r]!==ns[r]);
    const _apply=()=>{customDeck=_sortDeck(newDeck);_persistCustomDeck();renderCustomDeck();showToast(mismatch?T("mscWarnMismatch"):T("mscLoaded"),mismatch?"bad":"");};
    if(customDeck.length){_customConfirm(es?"¿Reemplazar el mazo actual con el código importado?":"Replace current deck with imported code?",_apply);return;}
    _apply();return;
  }catch(e){showToast(T("mscInvalid")+" "+e.message,"bad");}
}

function _customDeckSummaryHtml(){
  const es=language==="es";
  const ns={C:+nC.value,U:+nU.value,R:+nR.value,M:+nM.value};
  const target=ns.C+ns.U+ns.R+ns.M;
  const rc={C:0,U:0,R:0,M:0},cc={White:0,Blue:0,Black:0,Red:0,Green:0};
  customDeck.forEach(x=>{rc[x.rarity]=(rc[x.rarity]||0)+1;cc[x.color]=(cc[x.color]||0)+1;});
  const errors=[];
  if(customDeck.length!==target)errors.push(`${es?"Cantidad":"Count"}: ${customDeck.length} / ${target}`);
  rarities.forEach(r=>{if(rc[r]!==ns[r])errors.push(`${r}: ${rc[r]} / ${ns[r]}`);});
  const valid=!errors.length;
  return `<div class="deck-summary">
    <span class="deck-summary-status ${valid?"valid":"invalid"}">${valid?(es?"✓ Mazo válido":"✓ Valid deck"):(es?"⚠ Revisar mazo":"⚠ Check deck")}</span>
    <span class="deck-summary-chip"><b>${customDeck.length}</b> / ${target} ${T("cardsWord")}</span>
    <span class="deck-summary-chip">C ${rc.C}/${ns.C} · U ${rc.U}/${ns.U} · R ${rc.R}/${ns.R} · M ${rc.M}/${ns.M}</span>
    <span class="deck-summary-chip">⚪ ${cc.White}</span><span class="deck-summary-chip">🔵 ${cc.Blue}</span><span class="deck-summary-chip">⚫ ${cc.Black}</span><span class="deck-summary-chip">🔴 ${cc.Red}</span><span class="deck-summary-chip">🟢 ${cc.Green}</span>
    <ul class="deck-summary-errors">${errors.map(e=>`<li>${e}</li>`).join("")}</ul>
  </div>`;
}

function _customDeckMscBarHtml(){
  const code=customDeckMscCode();
  const es=language==="es";
  const codeHtml=code
    ?`<span class="msc-code">${code}</span>
      <button type="button" class="msc-btn" onclick="customDeckCopyCode()">${T("mscCopy")}</button>`
    :`<span class="msc-code msc-code-empty">${es?"—  (mazo vacío)":"—  (empty deck)"}</span>`;
  return`<div class="msc-bar">
    <span class="msc-label">MSC</span>
    ${codeHtml}
    <button type="button" class="msc-btn secondary" onclick="customDeckToggleMscImport(this)">${T("mscImport")}</button>
  </div>
  <div class="msc-import-row" id="mscImportRow" style="display:none">
    <input type="text" id="mscImportInput" class="msc-import-input"
      placeholder="MSC2-…" autocomplete="off" spellcheck="false"
      oninput="customDeckValidateMscInput(this)"
      onkeydown="if(event.key==='Enter')customDeckApplyMscImport()">
    <button type="button" class="msc-btn" id="mscImportApplyBtn" onclick="customDeckApplyMscImport()" disabled>${es?"Cargar":"Load"}</button>
    <span class="msc-import-status" id="mscImportStatus"></span>
  </div>`;
}

function renderCustomDeck(){
  const el=document.getElementById("customDeckSection");if(!el)return;
  const es=language==="es";
  const ns={C:+nC.value,U:+nU.value,R:+nR.value,M:+nM.value};
  const total=ns.C+ns.U+ns.R+ns.M;
  const counts=customDeckCardCounts();
  const name=(customDeckName||T("customDeck")).replace(/"/g,"&quot;");
  // Preserve MSC import row state across re-renders
  const mscImportOpen=document.getElementById("mscImportRow")?.style.display==="flex";
  const mscImportVal=(document.getElementById("mscImportInput")?.value)||"";

  // Color grid
  const cc={White:0,Blue:0,Black:0,Red:0,Green:0};
  customDeck.forEach(x=>cc[x.color]=(cc[x.color]||0)+1);
  const colorGrid=colors.map(c=>`<div class="stat ${c}">${label(c)}<br><b>${cc[c]}</b></div>`).join("");

  // Table rows: filled cards (sorted by rarity then color) + empty slots per rarity
  const filledSorted=sortedRows([...customDeck],"customdeck");
  // deduplicate for display
  const seenFilled=new Set();
  const filledRows=[];
  filledSorted.forEach(x=>{
    if(seenFilled.has(x.n))return;
    seenFilled.add(x.n);
    const qty=counts[x.n]||0;
    const max=customDeckMaxForCard(x);
    filledRows.push(`<tr class="${x.color}">
      <td>${x.n}</td>
      <td>${cardNameHtml(x)}</td>
      <td>${colorIcon(x.color)} ${label(x.color)}</td>
      <td>${x.rarity}</td>
      <td><div class="qty-stepper">
        <button type="button" aria-label="−" onclick="customDeckSetCopies(${x.n},${qty-1})" ${qty<=1?"disabled":""}>−</button>
        <input type="number" min="0" max="${max}" value="${qty}" inputmode="numeric" onchange="customDeckSetCopies(${x.n},this.value)">
        <button type="button" aria-label="+" onclick="customDeckSetCopies(${x.n},${qty+1})" ${qty>=max?"disabled":""}>+</button>
      </div></td>
      <td><button class="change-btn custom-remove-btn" onclick="customDeckSetCopies(${x.n},0)">✕</button></td>
    </tr>`);
  });

  // Empty slots: one grouped row per rarity with empty count
  const emptyRows=[];
  rarities.forEach(r=>{
    const filled=customDeck.filter(x=>x.rarity===r).length;
    const empty=Math.max(0,ns[r]-filled);
    if(!empty)return;
    const rarityNames={C:es?"Común":"Common",U:es?"Infrecuente":"Uncommon",R:es?"Rara":"Rare",M:es?"Mítica":"Mythic"};
    emptyRows.push(`<tr class="custom-slot-empty">
      <td class="custom-slot-num">—</td>
      <td colspan="2"><span class="small custom-slot-label">${rarityNames[r]} · <b>${empty}</b> ${es?"vacío(s)":"empty"}</span></td>
      <td>${r}</td>
      <td colspan="2"><button class="change-btn custom-add-btn" onclick="openAddCardDrawer('${r}')">+ ${es?"Agregar":"Add"}</button></td>
    </tr>`);
  });

  el.innerHTML=`<div class="card" id="customDeckCard">
    <div class="deck-header-row">
      <h2>
        <input class="deck-title-input deck-name-input" id="customDeckNameInput"
          value="${name}" placeholder="${T("customDeckName")}">
        <span class="small">— ${customDeck.length} / ${total} ${T("cardsWord")}</span>
      </h2>
      <div class="deck-header-actions">
        <button id="customUseGeneratorBtn" class="save-deck-btn" onclick="customDeckUseGenerator()">⚡ ${T("customUseGenerator")}</button>
        <button class="secondary deck-json-btn" id="customSaveBtn" onclick="customDeckSave()">💾 ${T("customSave")}</button>
        <button class="secondary deck-json-btn" onclick="exportCustomDeckJSON()">${es?"Exportar JSON":"Export JSON"}</button>
        <button class="secondary deck-json-btn" onclick="document.getElementById('customJsonImportInput').click()">${es?"Importar JSON":"Import JSON"}</button>
        <button class="secondary deck-json-btn custom-clear-btn" id="customClearBtn" onclick="customDeckClear()">🗑 ${T("customClear")}</button>
      </div>
    </div>
    ${_customDeckMscBarHtml()}
    <div class="custom-deck-config-hint" onclick="document.getElementById('section-generator')?.scrollIntoView({behavior:'smooth',block:'start'})">
      <span class="custom-deck-config-hint-icon">⚙</span>
      <span>${es?"Estructura del mazo tomada de la configuración":"Deck structure from configuration"}: <b>C ${ns.C} · U ${ns.U} · R ${ns.R} · M ${ns.M}</b> · ${ns.C+ns.U+ns.R+ns.M} ${T("cardsWord")} ${es?"en total":"total"}</span>
      <span class="custom-deck-config-hint-link">${es?"Cambiar ↗":"Change ↗"}</span>
    </div>
    <div class="grid">${colorGrid}</div>
    ${_customDeckSummaryHtml()}
    ${customDeck.length===0?`<div class="custom-empty-state">
      <p class="custom-empty-icon">✦</p>
      <p class="custom-empty-title">${es?"Tu mazo custom está vacío":"Your custom deck is empty"}</p>
      <p class="custom-empty-sub small">${es?"Puedes empezar de tres formas:":"You can start in three ways:"}</p>
      <div class="custom-empty-options">
        <div class="custom-empty-option"><span>⚡</span><span>${es?"Usa el generador para crear un mazo base editable":"Use the generator to create an editable base deck"}</span></div>
        <div class="custom-empty-option"><span>+</span><span>${es?"Agrega cartas una por una desde los slots vacíos":"Add cards one by one from the empty slots"}</span></div>
        <div class="custom-empty-option"><span>MSC</span><span>${es?"Importa un código MSC para cargar un mazo guardado":"Import an MSC code to load a saved deck"}</span></div>
      </div>
    </div>`:""}
    <div class="table-scroll"><table>
      <tr>
        ${sortableHeader("customdeck","n","#")}
        ${sortableHeader("customdeck","name",T("card"))}
        ${sortableHeader("customdeck","color",T("color"))}
        ${sortableHeader("customdeck","rarity",T("rarity"))}
        <th>${es?"Copias":"Copies"}</th>
        <th></th>
      </tr>
      ${filledRows.join("")}
      ${emptyRows.join("")}
    </table></div>
  </div>`;

  // Restore MSC import row state
  if(mscImportOpen){
    const row=document.getElementById("mscImportRow");
    const inp=document.getElementById("mscImportInput");
    if(row)row.style.display="flex";
    if(inp&&mscImportVal){inp.value=mscImportVal;customDeckValidateMscInput(inp);}
  }

  // Name input: use onchange attribute in HTML, handled via delegation below

  _updateCustomNavBadge();
  _updateCustomStickyBar();
  if(document.body.classList.contains("custom-mode"))_initCustomStickyBar();
}

// Global delegated listeners — registered once, never stacked
document.addEventListener("change",e=>{
  const inp=e.target.closest("#customDeckNameInput");
  if(inp){customDeckName=(inp.value||"").trim()||T("customDeck");_persistCustomDeck();}
});

function renderAddCardSearch(){
  const el=document.getElementById("addCardResults");if(!el)return;
  const inp=document.getElementById("addCardSearch");
  const q=(inp?.value||"").trim().toLowerCase();
  const rarityFilter=inp?.dataset.rarityFilter||"";
  const es=language==="es";

  const counts=customDeckCardCounts();
  let results=cards.filter(x=>{
    if(rarityFilter&&x.rarity!==rarityFilter)return false;
    if(q&&!String(x.n).includes(q)&&!x.name.toLowerCase().includes(q))return false;
    return true;
  });
  if(!rarityFilter)results=results.slice(0,20);

  if(!results.length){
    el.innerHTML=`<p class="small" style="padding:10px 12px;color:#667085">${es?"Sin resultados":"No results"}</p>`;
    return;
  }
  el.innerHTML=results.map(x=>{
    const qty=counts[x.n]||0;
    const max=customDeckMaxForCard(x);
    const isExcluded=excluded.has(x.n);
    const atMax=qty>=max;
    const disabled=isExcluded||atMax;
    const reason=isExcluded?(es?"Excluida":"Excluded"):(atMax?`×${qty}/${max}`:"");
    return `<div class="custom-search-row ${x.color}${disabled?" unavailable":""}">
      <span class="custom-search-name">${cardNameHtml(x)}</span>
      <span class="custom-search-meta">${x.rarity} ${colorIcon(x.color)}</span>
      ${qty>0?`<span class="custom-search-qty">×${qty}</span>`:""}
      ${reason?`<span class="custom-search-reason small">${reason}</span>`:""}
      <button type="button" ${disabled?"disabled":""} onclick="customDeckAddCard(${x.n})">+</button>
    </div>`;
  }).join("");
}
