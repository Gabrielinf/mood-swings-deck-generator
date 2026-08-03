const Storage = {
  loadLanguage()       { return localStorage.getItem("msLang"); },
  saveLanguage(v)      { localStorage.setItem("msLang", v); },

  loadCollection()     { const r=localStorage.getItem("msCardsV3"); return r?JSON.parse(r):null; },
  saveCollection(c)    { localStorage.setItem("msCardsV3", JSON.stringify(c)); },

  loadExcluded()       { const r=localStorage.getItem("msExcludedV3"); return r?JSON.parse(r):[]; },
  saveExcluded(s)      { localStorage.setItem("msExcludedV3", JSON.stringify([...s])); },

  loadConfig()         { const r=localStorage.getItem("msConfigV3"); return r?JSON.parse(r):{}; },
  saveConfig(o)        { localStorage.setItem("msConfigV3", JSON.stringify(o)); },

  loadHistory()        { const r=localStorage.getItem("msHistoryV4"); return r?JSON.parse(r):[]; },
  saveHistory(h)       { localStorage.setItem("msHistoryV4", JSON.stringify(h)); },

  loadSection()        { return localStorage.getItem("msSection")||"generator"; },
  saveSection(s)       { localStorage.setItem("msSection", s); },

  loadCustomDeck()     { const r=localStorage.getItem("msCustomDeckV1"); return r?JSON.parse(r):null; },
  saveCustomDeck(d,n)  { localStorage.setItem("msCustomDeckV1", JSON.stringify({name:n||"",cards:(d||[]).map(x=>x.n)})); },
  clearCustomDeck()    { localStorage.removeItem("msCustomDeckV1"); }
};
