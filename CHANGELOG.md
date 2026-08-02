# Changelog

## 2.0.0-dev — Modularization

### Bug fixes
- `cardName` was used in three error messages but never declared — added the function to prevent silent `ReferenceError` in locked-card and missing-inventory error paths
- `activeHistoryIndex` was an implicit global — declared explicitly with `let`

### Refactoring

**Data**
- Moved card data (`initial`, `colors`, `rarities`) from `app.js` into `data/cards.js`

**Modules extracted from `app.js`**

| File | Contents |
|------|----------|
| `js/storage.js` | All `localStorage` access centralized behind `Storage.load*/save*`. Keys preserved: `msLang`, `msCardsV3`, `msExcludedV3`, `msConfigV3`, `msHistoryV4` |
| `js/utils.js` | Pure utility functions: `shuffle`, `seedHash`, `makeSeededRng`, `createSeed`, `cardName`, `colorIcon`, `safeFileName` |
| `js/state.js` | All mutable globals declared in one place: `language`, `cards`, `excluded`, `decks`, `locks`, `deckNames`, `activeGenerationSeed`, `customRatio`, `activeHistoryIndex`, `swapContext`, `noteNavigationStack`, `cardImageByNumber`, `sortState`, etc. |
| `js/i18n.js` | Translation table `tx` and helper functions `T`, `label`, `colorOptionText` |
| `js/generator.js` | Pure generation engine `Generator.generate(config, cards, excluded, locks)` — no DOM dependencies. Includes `generationError`, `normalizeRatio`, `allocateByRatio`, `distributeAmong`, `ratioPresets`, `_quota` |
| `js/collection.js` | All Collection UI: `renderCollection`, `renderCollectionStats`, `openCollection`, `closeCollection`, `setCollectionQty`, `stepCollectionQty`, `clearCollectionFilters`, `openCollectionAtCard`, etc. |
| `js/history.js` | Full History module: `getHistory`, `setHistory`, `openHistory`, `closeHistory`, `renderHistoryList`, `showHistoryEntry`, `generateFromHistory`, `restoreHistoryConfiguration`, `deleteHistoryDeck`, inventory badges, etc. |
| `js/json.js` | JSON import/export: `exportDeckJSON`, `importDeckJSON`, `normalizeDeckJSON` (v1→v2 migration preserved), `simultaneousDeckInventoryIssues`, `simultaneousDeckInventoryMessage`, `prepareDeckJSONImport` |
| `js/cardPreview.js` | Card image preview, note modal, referenced-card inline preview: `loadCardImageData`, `loadCardRulesData`, `showCardPreview`, `openNoteModal`, `showReferencedCard`, `safeMoodHtml`, `renderMoodDiceNotation`, all related event listeners |
| `js/nav.js` | Structural nav: `updateStructuralNavigationLanguage`, `setStructuralActive`, `lockStructuralNav`, `syncStructuralActiveFromUI`, click handler, floating nav IIFE |

**Deduplication**
- `exportDeckJSON` now calls `currentGeneratorConfigSnapshot()` instead of rebuilding the config object manually
- Config restore logic (20 lines repeated in `importDeckJSON` and `restoreHistoryConfiguration`) extracted to `applyConfigToUI(c, opts)` in `app.js`

### Architecture

Script load order in `index.html`:
```
data/cards.js       ← card data
js/storage.js       ← localStorage API
js/utils.js         ← pure utilities
js/state.js         ← runtime globals
js/i18n.js          ← translations
js/generator.js     ← pure generation engine
js/collection.js    ← collection UI
js/history.js       ← history module
js/json.js          ← import/export
js/cardPreview.js   ← card preview + note modal
js/nav.js           ← navigation
js/app.js           ← setup, config UI, generator coordinator, swap modal, render
```

`app.js` went from **1217 lines** to **391 lines**.

### Compatibility
- All `localStorage` keys unchanged (`msLang`, `msCardsV3`, `msExcludedV3`, `msConfigV3`, `msHistoryV4`)
- JSON export format unchanged (version 2, v1→v2 migration preserved)
- Seed algorithm unchanged — same seed + same config produces the same deck
- No frameworks, no build step, GitHub Pages compatible
