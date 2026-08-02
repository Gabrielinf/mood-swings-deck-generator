function shuffle(a, rng=Math.random) {
  a=[...a];
  for(let i=a.length-1;i;i--){let j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

function seedHash(str) {
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
  return h>>>0;
}

function makeSeededRng(seed) {
  let a=seedHash(seed)||1;
  return function(){
    a=(a+0x6D2B79F5)|0;
    let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function createSeed() {
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out="MSW-";
  let vals=new Uint32Array(6);
  if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(vals);
  else for(let i=0;i<vals.length;i++)vals[i]=Math.floor(Math.random()*0xffffffff);
  for(let i=0;i<vals.length;i++)out+=chars[vals[i]%chars.length];
  return out;
}

function cardName(x) { return x?x.name:""; }

function colorIcon(c) {
  return {White:"⚪",Blue:"🔵",Black:"⚫",Red:"🔴",Green:"🟢"}[c];
}

function safeFileName(name) {
  return (name||"deck").trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g,"_")
    .replace(/\s+/g,"_")
    .replace(/_+/g,"_")
    .replace(/^_+|_+$/g,"")
    ||"deck";
}
