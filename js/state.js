// Runtime state — all mutable globals live here.
// app.js reads and writes these directly; future modules will access them via this file.

// Persistent state (hydrated from localStorage on load)
let language  = Storage.loadLanguage() || "es";
let cards     = Storage.loadCollection() || JSON.parse(JSON.stringify(initial));
let excluded  = new Set(Storage.loadExcluded());

// Active session state
let decks     = [];
let locks     = {};
let deckNames = [];

// Custom deck state (single deck, own section) — persisted in localStorage
const _savedCustomDeck=Storage.loadCustomDeck();
const _cardMap=Object.fromEntries(cards.map(x=>[x.n,x]));
let customDeck     = _savedCustomDeck&&Array.isArray(_savedCustomDeck.cards)
  ? _savedCustomDeck.cards.map(n=>_cardMap[n]).filter(Boolean)
  : [];
let customDeckName = _savedCustomDeck?.name||"";

// Generator state
let activeGenerationSeed = "";
let activeGenerationRng  = Math.random;
let customRatio          = null;

// History UI state
let activeHistoryIndex = null;

// Swap modal state
let swapContext = null;

// Note modal state
let noteNavigationStack = [];

// Card data cache (fetched from remote on demand)
let cardImageByNumber   = {};
let cardImageDataLoaded = false;
let cardRulesByName     = {};
let cardRulesDataLoaded = false;

// Sort state per table
const sortState = {};

// UI flags and timers
let deckCollectionStatusDirty  = false;
let structuralNavLockUntil     = 0;
let appToastTimer               = null;
let configAutosaveTimer         = null;
let pendingJSONImportDeckIndex  = null;
