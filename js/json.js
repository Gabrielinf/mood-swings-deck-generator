function exportDeckJSON(deckIndex=null){
  if(!decks || !decks.length){
    alert(language==="es"?"Primero genera un mazo.":"Generate a deck first.");
    return;
  }
  const config=currentGeneratorConfigSnapshot();
  const selectedIndexes=deckIndex===null?decks.map((_,i)=>i):[deckIndex];
  const payload={
    format:"MoodSwingsDeckGenerator",
    version:2,
    schema:"deck-state",
    app:"Mood Swings Deck Generator",
    exportedAt:new Date().toISOString(),
    seed:activeGenerationSeed || (document.getElementById("seedInput")?.value||"").trim(),
    sourceDeckIndex:deckIndex,
    sourceDeckCount:decks.length,
    configuration:config,
    excludedCards:[...excluded],
    decks:selectedIndexes.map(i=>({
      name:deckNames[i]||`${T("deck")} ${i+1}`,
      cards:decks[i].map(x=>({number:x.n,name:x.name,color:x.color,rarity:x.rarity}))
    }))
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  const exportName=deckIndex===null?(decks.length===1?(deckNames[0]||`${T("deck")} 1`):"Mood_Swings_Decks"):(deckNames[deckIndex]||`${T("deck")} ${deckIndex+1}`);
  a.download=safeFileName(exportName)+".json";
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0);
}
function simultaneousDeckInventoryIssues(deckSet){
  const used={};
  (deckSet||[]).forEach(d=>(d||[]).forEach(x=>{used[x.n]=(used[x.n]||0)+1}));
  return Object.entries(used).map(([n,need])=>{
    const card=cards.find(x=>x.n===+n),have=card?Math.max(0,+card.qty||0):0;
    return {card,need,have,missing:Math.max(0,need-have)};
  }).filter(x=>x.missing>0).sort((a,b)=>b.missing-a.missing||((a.card?.n||0)-(b.card?.n||0)));
}
function simultaneousDeckInventoryMessage(issues){
  const es=language==="es",shown=issues.slice(0,8);
  const lines=shown.map(x=>`#${x.card?.n||"?"} ${x.card?cardName(x.card):""}: ${es?"necesitas":"need"} ${x.need}, ${es?"tienes":"have"} ${x.have}`);
  if(issues.length>shown.length)lines.push(es?`… y ${issues.length-shown.length} carta(s) más.`:`… and ${issues.length-shown.length} more card(s).`);
  return lines.join("\n");
}
function prepareDeckJSONImport(deckIndex){
  pendingJSONImportDeckIndex=deckIndex;
  document.getElementById("jsonImportInput").click();
}
function normalizeDeckJSON(data){
  if(!data || data.format!=="MoodSwingsDeckGenerator")throw new Error(language==="es"?"Formato JSON no reconocido.":"Unrecognized JSON format.");
  const version=Number(data.version||1);
  if(version>2)throw new Error(language==="es"?`Este JSON usa una versión más nueva (${version}) que esta aplicación no reconoce.`:`This JSON uses a newer version (${version}) that this app does not recognize.`);
  if(version<1)throw new Error(language==="es"?"Versión JSON no válida.":"Invalid JSON version.");
  if(!Array.isArray(data.decks)||!data.decks.length)throw new Error(language==="es"?"El JSON no contiene mazos.":"JSON contains no decks.");

  // v1 -> v2 migration is intentionally non-destructive: v1 already contains
  // the deck state/configuration we need, so only metadata defaults are added.
  const normalized={...data,version:2,schema:data.schema||"deck-state"};
  normalized.configuration={...(data.configuration||{})};
  if(normalized.configuration.deckCount==null)normalized.configuration.deckCount=data.sourceDeckCount||data.decks.length;
  normalized.decks=data.decks.map((d,i)=>({
    name:d?.name||`${T("deck")} ${i+1}`,
    cards:Array.isArray(d?.cards)?d.cards:[]
  }));
  normalized.excludedCards=Array.isArray(data.excludedCards)?data.excludedCards:[];
  return normalized;
}
function importDeckJSON(file,targetDeckIndex=null){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const rawData=JSON.parse(String(reader.result||""));
      const data=normalizeDeckJSON(rawData);

      // Validate every referenced card before changing current state.
      const restoredDecks=data.decks.map(d=>{
        if(!d || !Array.isArray(d.cards))throw new Error(language==="es"?"Un mazo no contiene una lista de cartas válida.":"A deck has an invalid card list.");
        return d.cards.map(ref=>{
          const n=+(typeof ref==="object"?ref.number:ref);
          const card=cards.find(x=>x.n===n);
          if(!card)throw new Error((language==="es"?"Carta desconocida #":"Unknown card #")+n);
          return card;
        });
      });

      // Validate the resulting simultaneous set against the physical collection.
      // A single-deck import replaces only the clicked slot for this check.
      let candidateDecks;
      if(targetDeckIndex!==null && restoredDecks.length===1 && decks[targetDeckIndex]){
        candidateDecks=decks.map((d,i)=>i===targetDeckIndex?restoredDecks[0]:d);
      }else{
        candidateDecks=restoredDecks;
      }
      if(respectInv.checked){
        const inventoryIssues=simultaneousDeckInventoryIssues(candidateDecks);
        if(inventoryIssues.length){
          throw new Error((language==="es"
            ?"La importación haría que los mazos no puedan construirse simultáneamente con tu colección:\n"
            :"The import would make the decks impossible to build simultaneously with your collection:\n")
            +simultaneousDeckInventoryMessage(inventoryIssues));
        }
      }

      applyConfigToUI(data.configuration||{},{deckCountOnlyIfTarget:true,targetDeckIndex});

      // Restore seed and exact deck state; do NOT call generate().
      activeGenerationSeed=String(data.seed||"").trim();
      const seedEl=document.getElementById("seedInput");
      if(seedEl)seedEl.value=activeGenerationSeed;

      if(targetDeckIndex!==null && restoredDecks.length===1 && decks[targetDeckIndex]){
        decks[targetDeckIndex]=restoredDecks[0];
        deckNames[targetDeckIndex]=data.decks[0].name||`${T("deck")} ${targetDeckIndex+1}`;
        Object.keys(locks).filter(k=>k.startsWith(targetDeckIndex+"-")).forEach(k=>delete locks[k]);
      }else{
        decks=restoredDecks;
        deckNames=data.decks.map((d,i)=>d.name||`${T("deck")} ${i+1}`);
        deckCount.value=decks.length;
        locks={};
      }

      if(Array.isArray(data.excludedCards)){
        excluded=new Set(data.excludedCards.map(Number));
        Storage.saveExcluded(excluded);
      }

      // Refresh dependent UI after all values are restored.
      updatePriorityUI();
      mode.onchange();
      render();
      const migrated=Number(rawData.version||1)<2;
      showToast((targetDeckIndex!==null&&restoredDecks.length===1?(language==="es"?"JSON importado ✓":"JSON imported ✓"):(language==="es"?"Mazos importados ✓":"Decks imported ✓"))+(migrated?(language==="es"?" · archivo actualizado":" · file migrated"):""));

    }catch(e){
      alert((language==="es"?"No se pudo importar el JSON. ":"Could not import JSON. ")+e.message);
    }
  };
  reader.readAsText(file,"UTF-8");
}
