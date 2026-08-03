async function loadCardImageData(){
  if(cardImageDataLoaded)return;
  try{
    let response=await fetch("https://moodswingsdata.github.io/msw/printings.json");
    if(!response.ok)throw new Error("HTTP "+response.status);
    let printings=await response.json();
    printings.forEach(p=>{if(p.collector_number!=null&&p.card_image_url)cardImageByNumber[String(p.collector_number)]=p.card_image_url});
    cardImageDataLoaded=true;
  }catch(e){console.warn("Mood Swings card previews unavailable:",e)}
}

async function loadCardRulesData(){
  if(cardRulesDataLoaded)return;
  try{
    let response=await fetch("https://moodswingsdata.github.io/msw/cards.json");
    if(!response.ok)throw new Error("HTTP "+response.status);
    let data=await response.json();
    data.forEach(c=>{if(c.name)cardRulesByName[c.name.toLowerCase()]=c});
    cardRulesDataLoaded=true;
  }catch(e){console.warn("Mood Swings card rules unavailable:",e)}
}
function diceDisplay(c){
  if(!c)return "";
  let base=c.dice_value!=null?c.dice_value:"";
  let secondary=c.secondary_dice_value!=null?` → ${c.secondary_dice_value}`:"";
  return base!==""?`🎲 ${base}${secondary}`:"";
}
function cardNameHtml(x){return `<span class="card-name-wrap"><span class="card-name-preview" data-card-number="${x.n}">${x.name}</span><button type="button" class="card-note-btn" data-note-card="${x.n}" title="${language==="es"?"Ver información y notas":"View information and notes"}">ⓘ</button></span>`}

function decodeMoodHtml(text){
  let el=document.createElement("textarea");el.innerHTML=text||"";return el.value;
}
function stripMoodHtml(text){
  let el=document.createElement("div");el.innerHTML=decodeMoodHtml(renderMoodDiceNotation(text||""));return el.textContent||el.innerText||"";
}

function renderMoodDiceNotation(text){
  if(!text)return "";
  // Consecutive bracketed integers represent dice/value components.
  // Example: [6][1] => 7, [3] => 3.
  return String(text).replace(/(?:\[\d+\])+/g, token=>{
    const nums=[...token.matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1]));
    return String(nums.reduce((sum,n)=>sum+n,0));
  });
}
function safeMoodHtml(text){
  let raw=decodeMoodHtml(renderMoodDiceNotation(text||""));
  let tpl=document.createElement("template");tpl.innerHTML=raw;
  tpl.content.querySelectorAll("*").forEach(el=>{
    if(!["STRONG","B","EM","I","BR"].includes(el.tagName))el.replaceWith(document.createTextNode(el.textContent||""));
    else [...el.attributes].forEach(a=>el.removeAttribute(a.name));
  });
  let html=tpl.innerHTML;
  // Turn references to other Mood Swings cards into hover/tap previews.
  if(typeof cards!=="undefined"){
    const currentNames=[...cards].sort((a,b)=>b.name.length-a.name.length);
    for(const c of currentNames){
      const escaped=c.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      const re=new RegExp("(^|[^A-Za-z])("+escaped+")(?=$|[^A-Za-z])","gi");
      html=html.replace(re,(m,prefix,name)=>`${prefix}<span class="card-ref-preview" data-ref-card="${c.n}">${name}</span>`);
    }
  }
  return html;
}
async function showCardPreview(number,event){
  await Promise.all([loadCardImageData(),loadCardRulesData()]);
  let card=cards.find(x=>x.n===+number),url=cardImageByNumber[String(number)];if(!card)return;
  let info=cardRulesByName[card.name.toLowerCase()]||null;
  let box=document.getElementById("cardPreview"),img=document.getElementById("cardPreviewImg");
  if(url){img.style.opacity="0";img.src=url;img.alt=card.name;img.style.display="block";img.onload=()=>{img.style.transition="opacity .15s";img.style.opacity="1"};}else{img.removeAttribute("src");img.style.display="none"}
  document.getElementById("cardPreviewCaption").textContent=`#${card.n} · ${card.name} · ${label(card.color)} · ${card.rarity}`;
  let meta=[];
  if(info&&info.color&&info.color.length)meta.push(info.color.join(" / "));
  if(info){let d=diceDisplay(info);if(d)meta.push(d)}
  if(info&&info.timing&&info.timing.length)meta.push(info.timing.map(t=>t.replaceAll("_"," ")).join(" · "));
  document.getElementById("cardPreviewMeta").textContent=meta.join("  ·  ");
  box.classList.add("open");box.setAttribute("aria-hidden","false");
  if(window.innerWidth>700)positionCardPreview(event);
}
function positionCardPreview(event){
  let box=document.getElementById("cardPreview"),gap=16,w=235,h=350,x=event.clientX+gap,y=event.clientY+gap;
  if(x+w>window.innerWidth-8)x=event.clientX-w-gap;
  if(y+h>window.innerHeight-8)y=Math.max(8,window.innerHeight-h-8);
  box.style.left=Math.max(8,x)+"px";box.style.top=Math.max(8,y)+"px";
}
function hideCardPreview(){let b=document.getElementById("cardPreview");b.classList.remove("open");b.setAttribute("aria-hidden","true")}
document.addEventListener("mouseover",e=>{let n=e.target.closest(".card-name-preview");if(n&&window.innerWidth>700)showCardPreview(n.dataset.cardNumber,e)});
document.addEventListener("mousemove",e=>{if(window.innerWidth>700&&document.getElementById("cardPreview").classList.contains("open"))positionCardPreview(e)});
document.addEventListener("mouseout",e=>{let n=e.target.closest(".card-name-preview");if(n&&window.innerWidth>700)hideCardPreview()});
document.addEventListener("click",e=>{
 let n=e.target.closest(".card-name-preview");
 if(window.innerWidth<=700&&n){e.stopPropagation();showCardPreview(n.dataset.cardNumber,e);return}
 if(window.innerWidth<=700&&!e.target.closest("#cardPreview"))hideCardPreview();
});
loadCardImageData();loadCardRulesData();


async function translateMoodText(text){
  return text || "";
}
function updateNoteNavigationUI(){
 let back=document.getElementById("noteBackBtn"),hint=document.getElementById("noteRefHint");
 if(!back)return;
 back.classList.toggle("show",noteNavigationStack.length>0);
 back.textContent=language==="es"?"← Volver":"← Back";
 hint.textContent=language==="es"?"Puedes abrir las cartas mencionadas en el texto.":"You can open cards referenced in the text.";
}
function currentNoteCardNumber(){
 let title=document.getElementById("noteTitle")?.textContent||"";
 let m=title.match(/^#(\d+)/);return m?+m[1]:null;
}
async function openReferencedCardInfo(number){
 let current=currentNoteCardNumber();
 if(current!=null&&current!==+number)noteNavigationStack.push(current);
 hideReferencedCard();
 await openNoteModal(+number);
 updateNoteNavigationUI();
}
async function noteNavigateBack(){
 if(!noteNavigationStack.length)return;
 let previous=noteNavigationStack.pop();
 await openNoteModal(previous);
 updateNoteNavigationUI();
}
async function openNoteModal(number){
  await loadCardRulesData();
  let card=cards.find(x=>x.n===+number);if(!card)return;
  let info=cardRulesByName[card.name.toLowerCase()]||{};
  let rules=info.rules_text||"", notes=Array.isArray(info.notes)?info.notes:[];
  let errataRaw=info.errata||"";
  let errata=errataRaw&&typeof errataRaw==="object"?(errataRaw.note||""):errataRaw;
  document.getElementById("noteTitle").textContent=`#${card.n} · ${card.name}`;
  let body=document.getElementById("noteBody");
  body.innerHTML=`<p class="small">${label(card.color)} · ${card.rarity}${diceDisplay(info)?" · "+diceDisplay(info):""}</p><p class="small">${"Loading…"}</p>`;
  document.getElementById("noteOverlay").classList.add("open");
  let trRules=await translateMoodText(stripMoodHtml(rules));
  let trNotes=await Promise.all(notes.map(translateMoodText));
  let trErrata=await translateMoodText(errata);
  let html="";
  if(rules)html+=`<div class="note-section"><h3>${language==="es"?"Texto de la carta":"Card text"}</h3><p>${safeMoodHtml(rules)}</p></div>`;
  if(notes.length)html+=`<div class="note-section"><h3>${language==="es"?"Notas":"Notes"}</h3><ul>${notes.map(n=>`<li>${safeMoodHtml(n)}</li>`).join("")}</ul></div>`;
  if(errata)html+=`<div class="note-section"><h3>${language==="es"?"Errata":"Errata"}</h3><p>${safeMoodHtml(errata)}</p></div>`;
  if(!html)html=`<p class="small">${language==="es"?"Esta carta no tiene notas adicionales.":"This card has no additional notes."}</p>`;
  body.innerHTML=html;
}
function closeNoteModal(){document.getElementById("noteOverlay").classList.remove("open");noteNavigationStack=[];updateNoteNavigationUI()}
document.addEventListener("click",e=>{
  let b=e.target.closest(".card-note-btn");
  if(b){e.preventDefault();e.stopPropagation();noteNavigationStack=[];openNoteModal(b.dataset.noteCard).then(updateNoteNavigationUI)}
});


async function showReferencedCard(number,event){
  await loadCardImageData();
  let card=cards.find(x=>x.n===+number),url=cardImageByNumber[String(number)];
  if(!card||!url)return;
  let box=document.getElementById("refCardPreview"),img=document.getElementById("refCardPreviewImg");
  img.src=url;img.alt=card.name;
  document.getElementById("refCardPreviewCaption").textContent=`#${card.n} · ${card.name} · ${label(card.color)} · ${card.rarity}`;
  box.classList.add("open");box.setAttribute("aria-hidden","false");
  if(window.innerWidth>700)positionReferencedCard(event);
}
function positionReferencedCard(event){
  let box=document.getElementById("refCardPreview"),gap=14,w=220,h=320,x=event.clientX+gap,y=event.clientY+gap;
  if(x+w>window.innerWidth-8)x=event.clientX-w-gap;
  if(y+h>window.innerHeight-8)y=Math.max(8,window.innerHeight-h-8);
  box.style.left=Math.max(8,x)+"px";box.style.top=Math.max(8,y)+"px";
}
function hideReferencedCard(){
  let b=document.getElementById("refCardPreview");b.classList.remove("open");b.setAttribute("aria-hidden","true");
}
document.addEventListener("mouseover",e=>{
  let ref=e.target.closest(".card-ref-preview");
  if(ref&&window.innerWidth>700)showReferencedCard(ref.dataset.refCard,e);
});
document.addEventListener("mousemove",e=>{
  if(window.innerWidth>700&&document.getElementById("refCardPreview").classList.contains("open"))positionReferencedCard(e);
});
document.addEventListener("mouseout",e=>{
  let ref=e.target.closest(".card-ref-preview");
  if(ref&&window.innerWidth>700)hideReferencedCard();
});
document.addEventListener("click",e=>{
  let ref=e.target.closest(".card-ref-preview");
  if(ref){e.preventDefault();e.stopPropagation();openReferencedCardInfo(ref.dataset.refCard);return}
  if(window.innerWidth<=700&&!e.target.closest("#refCardPreview"))hideReferencedCard();
});

