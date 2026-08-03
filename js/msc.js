// MSC — Mood Swings Code
// v2: bitmap encoding — 1 bit per card (133 cards) + optional 4-bit copy counts.
// Result: ~27 chars for any single-copy deck, ~39 for 45 unique cards.
// v1 decode kept for backwards compatibility.

const MSC = (function(){
  const ALPHA   = "0123456789ABCDEFGHJKLMNPQRSTUVWX"; // 32 chars, no I/O
  const MAX_N   = 133;
  const GROUP   = 4;

  // --- base32 helpers ---
  function _enc32(bytes){
    let bits=0,acc=0,out="";
    for(const b of bytes){acc=(acc<<8)|b;bits+=8;while(bits>=5){bits-=5;out+=ALPHA[(acc>>>bits)&31];}}
    if(bits>0)out+=ALPHA[(acc<<(5-bits))&31];
    return out;
  }
  function _dec32(str){
    let bits=0,acc=0;const out=[];
    for(const ch of str){const v=ALPHA.indexOf(ch);if(v<0)continue;acc=(acc<<5)|v;bits+=5;if(bits>=8){bits-=8;out.push((acc>>>bits)&255);}}
    return out;
  }
  function _group(str,ver){
    const parts=[];for(let i=0;i<str.length;i+=GROUP)parts.push(str.slice(i,i+GROUP));
    return ver+"-"+parts.join("-");
  }
  function _ungroup(code){
    return code.toUpperCase().replace(/^MSC[12][-\s]*/i,"").replace(/[-\s]/g,"");
  }
  function _version(code){
    const m=code.toUpperCase().match(/^MSC([12])/);return m?+m[1]:2;
  }

  // --- v2 encode (bitmap) ---
  function _encodeV2(deck){
    const counts={};
    deck.forEach(x=>counts[x.n]=(counts[x.n]||0)+1);
    const present=Object.keys(counts).map(Number).sort((a,b)=>a-b);
    const hasMulti=present.some(n=>counts[n]>1);

    // Bitstream: [hasMulti flag 1bit][bitmap 133bits][if hasMulti: 4bits per present card]
    const bits=[];
    bits.push(hasMulti?1:0);
    for(let i=1;i<=MAX_N;i++)bits.push(counts[i]>0?1:0);
    if(hasMulti){
      for(const n of present){
        const c=Math.min(9,counts[n])-1; // 0-8 stored as 4 bits
        bits.push((c>>3)&1,(c>>2)&1,(c>>1)&1,c&1);
      }
    }
    // Pack to bytes
    const bytes=[];
    for(let i=0;i<bits.length;i+=8){
      let b=0;for(let j=0;j<8;j++)b=(b<<1)|(bits[i+j]||0);
      bytes.push(b);
    }
    return _group(_enc32(bytes),"MSC2");
  }

  // --- v2 decode ---
  function _decodeV2(code){
    const bytes=_dec32(_ungroup(code));
    if(!bytes.length)throw new Error("Empty MSC code");
    // Unpack bits
    const bits=[];
    for(const b of bytes)for(let i=7;i>=0;i--)bits.push((b>>>i)&1);
    let pos=0;
    const hasMulti=bits[pos++]===1;
    const present=[];
    for(let i=1;i<=MAX_N;i++){if(bits[pos++])present.push(i);}
    const entries=[];
    for(const n of present){
      let copies=1;
      if(hasMulti){
        copies=((bits[pos]||0)<<3|(bits[pos+1]||0)<<2|(bits[pos+2]||0)<<1|(bits[pos+3]||0))+1;
        pos+=4;
      }
      entries.push({n,copies});
    }
    return entries;
  }

  // --- v1 decode (legacy) ---
  function _decodeV1(code){
    const bytes=_dec32(_ungroup(code));
    if(!bytes.length)throw new Error("Empty MSC code");
    const count=bytes[0];
    let bitAcc=0,bitLen=0,byteIdx=1;
    function readBits(n){
      while(bitLen<n&&byteIdx<bytes.length){bitAcc=(bitAcc<<8)|bytes[byteIdx++];bitLen+=8;}
      if(bitLen<n)throw new Error("Truncated MSC code");
      bitLen-=n;return(bitAcc>>>bitLen)&((1<<n)-1);
    }
    return Array.from({length:count},()=>({n:readBits(8),copies:readBits(4)+1}));
  }

  return {
    encode(deck){return _encodeV2(deck);},

    decode(code){
      const v=_version(code);
      return v===1?_decodeV1(code):_decodeV2(code);
    },

    validate(code){try{this.decode(code);return true;}catch(e){return false;}}
  };
})();
