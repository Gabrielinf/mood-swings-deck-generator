function updateStructuralNavigationLanguage(){
 const es=(typeof language!=="undefined"&&language==="es");
 document.querySelectorAll("[data-nav-en]").forEach(el=>el.textContent=es?el.dataset.navEs:el.dataset.navEn);
}
function setStructuralActive(target){
 document.querySelectorAll(".section-nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.sectionTarget===target));
}
function lockStructuralNav(ms=650){structuralNavLockUntil=Date.now()+ms;}
function syncStructuralActiveFromUI(){
 const collectionOpen=document.getElementById("collectionDrawer")?.classList.contains("open");
 const historyOpen=document.getElementById("historyDrawer")?.classList.contains("open");
 if(historyOpen){setStructuralActive("history");return "history";}
 if(collectionOpen){setStructuralActive("collection");return "collection";}
 return null;
}
document.addEventListener("click",e=>{
 const b=e.target.closest(".section-nav-btn"); if(!b)return;
 const target=b.dataset.sectionTarget;
 if(target==="collection"){
   openCollection();return;
 }
 if(target==="history"){
   openHistory();return;
 }
 // Generator and Decks are page sections: close any open drawer before navigating.
 if(target==="generator"||target==="decks"){
   const collection=document.getElementById("collectionDrawer");
   const history=document.getElementById("historyDrawer");
   const overlay=document.getElementById("drawerOverlay");
   if(collection)collection.classList.remove("open");
   if(history)history.classList.remove("open");
   if(overlay)overlay.classList.remove("open");
   document.body.classList.remove("drawer-open");
   const el=document.getElementById(target==="generator"?"section-generator":"section-decks");
   setStructuralActive(target);lockStructuralNav();
   if(el)setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),0);
   return;
 }
});
setTimeout(updateStructuralNavigationLanguage,0);

(function(){
  function initFloatingSectionNav(){
    const nav=document.querySelector(".app-section-nav");
    if(!nav || nav.dataset.floatingInit==="1")return;
    nav.dataset.floatingInit="1";
    const placeholder=document.createElement("div");
    placeholder.className="app-section-nav-placeholder";
    nav.parentNode.insertBefore(placeholder,nav.nextSibling);

    let triggerY=0;
    function measure(){
      const wasFloating=nav.classList.contains("nav-floating");
      if(wasFloating)nav.classList.remove("nav-floating");
      placeholder.classList.remove("active");
      const r=nav.getBoundingClientRect();
      triggerY=r.top+window.scrollY-6;
      placeholder.style.height=r.height+"px";
      if(wasFloating)update();
    }
    function updateActiveSection(){
      if(syncStructuralActiveFromUI())return;
      if(Date.now()<structuralNavLockUntil)return;
      const line=nav.classList.contains("nav-floating")?nav.getBoundingClientRect().bottom+14:90;
      const decksEl=document.getElementById("decks");
      const section=(decksEl&&decksEl.children.length&&decksEl.getBoundingClientRect().top<=line)?"decks":"generator";
      setStructuralActive(section);
    }
    function update(){
      if(window.scrollY>triggerY){
        const parentRect=nav.parentElement.getBoundingClientRect();
        const wrap=document.querySelector(".wrap")?.getBoundingClientRect();
        const left=wrap?wrap.left:parentRect.left;
        const maxWidth=wrap?wrap.width:parentRect.width;
        placeholder.style.height=nav.offsetHeight+"px";
        placeholder.classList.add("active");
        nav.classList.add("nav-floating");
        nav.style.left=left+"px";
        nav.style.width=Math.min(maxWidth,window.innerWidth-left-8)+"px";
      }else{
        nav.classList.remove("nav-floating");
        placeholder.classList.remove("active");
        nav.style.left="";
        nav.style.width="";
      }
      updateActiveSection();
    }
    window.addEventListener("scroll",update,{passive:true});
    window.addEventListener("resize",()=>{measure();update()});
    requestAnimationFrame(()=>{measure();update()});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initFloatingSectionNav);
  else initFloatingSectionNav();
})();
