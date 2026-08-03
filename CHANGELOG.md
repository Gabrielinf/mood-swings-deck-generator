# Changelog

## 2.2.0 — Design & UX Polish, Generator Improvements

### New features

**How to Use modal (`js/howToUse.js`)**
- `?` button in header (next to lang picker) opens a modal with 5 bilingual tabs: Generator, Custom Deck, Collection, History, MSC Code
- Fade-in via `visibility`+`opacity` transition

**Configuration accordion**
- Rarities and Colors sections are now collapsible accordions with `⌄` icon
- Summary shown in collapsed title: `23C · 14U · 6R · 2M` for Rarities; `Auto · 5 colors` / priority order for Colors
- Default open on first visit; remembers state per section independently
- Settings header promoted to prominent title (16px bold)
- "Deck/Mazo" subsection added below Settings

**Deck color accents**
- Each generated deck gets a unique left border color cycling through 10 colors (amber, orange, pink, teal, brown, fuchsia, lime, cyan, ochre, crimson)
- Header row shows a matching gradient background
- Custom Deck has a distinct violet `#7c3aed` accent on both the deck card and the config card (in custom-mode)

**Generator without inventory**
- When `respectInventory` is off, each deck draws independently from the full card pool (no shared `used` map)
- Maximum simultaneous decks reduced to 10; `deckCountHelp` explains the new behavior

**MSC in generated decks**
- MSC bar added below each generated deck's summary, with a safe copy button (no inline JS)
- MSC shown in history list and detail for all entry types (generated + custom), as copiable chips

**Custom Deck improvements**
- Hint banner (blue, clickable) replaces the small grey text — shows C/U/R/M breakdown and scrolls to Configuration on click
- Action buttons expanded: Export JSON, Import JSON, and Clear are now individual buttons (no dropdown)
- `⚡ Use generator` always generates a fresh seed; confirms before replacing existing cards
- Import MSC inline panel with real-time validation; warns if composition doesn't match rarity config
- Deck sorted on load/import: C→U→R→M → number → color

**History improvements**
- Seed + all MSC codes shown in list view as copiable chips (max 2 rows height)
- Seed + all MSC codes shown in detail view as full copiable chips
- Cards not found in current pool filtered from missing-card calculations (no `#undefined` entries)
- Delete confirmation uses inline modal (no `confirm()`)

### Improvements

- `mode` select option renamed: "Free colors" → "Random colors" (both languages)
- `preset` "5 colors balanced / with priority" now also populates the manual distribution table
- "Colores ordenados por prioridad" correctly hides when "No fixed priority" is selected
- Nav consolidated from 5 to 4 buttons: Generator + Decks merged into "Deck Generator"
- Nav floating bar shows labels (not icons-only) — font scaled to fit 4 buttons
- `customDeckSection` restores at page top (same as Generator) on section restore
- Section state persists only for page sections (generator, customdeck); drawers (collection, history) are always closed on load
- `maxCopies` input capped at `max=9` (aligned with MSC v2 encoder limit)

### Bug fixes

- **XSS** — seed and MSC values in history chips and deck MSC bar now use `data-*` attributes + event delegation instead of inline `onclick` with interpolated values
- **`hasVisited` collapse bug** — each collapsible section now checks its own storage key independently; one section's state no longer affected the other
- **`#undefined` in history issues** — missing-card list filters out card numbers not found in the current pool
- **`priority-compact` always visible** — `display:grid!important` in CSS was overriding JS `display:none`; removed `!important`
- **Overflow fade on drawers** — `drawer-overlay` and `how-to-use-overlay` now use `visibility`+`opacity`+`transition` for real fade (previously `display:none/block` skipped the animation)
- **Custom deck name listener stacking** — name change handler and dropdown close listener moved to global delegation (registered once), not inside `renderCustomDeck()`
- **`historyDrawer` outside `.wrap`** — moved inside `.wrap` for consistent CSS scoping
- **Deck summary chip inconsistency** — generated decks now show `X/Y` format matching custom deck

### Removed

- Dropdown `⋯` menu in Custom Deck header — replaced with individual buttons
- Dead CSS: `.custom-more-menu`, `.custom-more-dropdown`, `.custom-more-danger` and related rules

### Compatibility
- New `localStorage` keys: `msCustomDeckV1`, `msSection`
- `msConfigV3` gains `customDeckSort`, `configSectionRarities_open`, `configSectionColors_open` (ignored by older versions)
- All existing keys unchanged
- No new dependencies, no build step

---

## 2.1.0 — Custom Deck Editor, MSC Codes, UX Polish

### New features

**Fase 7 — Custom Deck Editor (`js/customDeck.js`)**
- New "Custom" section in the nav — inline page section, not a drawer
- Table with pre-filled slots based on generator rarity config (C/U/R/M); empty slots show rarity name + count and a `+ Add` button
- Filled card rows show name, color, rarity, and a `[−][n][+]` qty stepper; typing `0` removes the card
- `⚡ Use generator` — runs `Generator.generate()` and loads the result as an editable starting point (confirms before replacing existing cards)
- `💾 Save deck` — saves to history with `type:"custom"`
- `Export JSON` / `Import JSON` — same `MoodSwingsDeckGenerator v2` format with `schema:"custom-deck"` and an `msc` field
- Add-card drawer — opens on `+ Add`, pre-filtered by rarity, closes after a card is added
- Hint below header explains that empty slots reflect the generator's C/U/R/M config
- Sort by #, name, color, rarity — sort state persisted across refreshes
- Custom deck persisted to `localStorage` (`msCustomDeckV1`) — survives page refresh
- Custom mode hides seed section, Generate/Reroll buttons, toolbar actions, and sticky bar so the UI is focused
- Badge on the "Custom" nav button shows card count when deck is non-empty
- Sticky bar at the bottom when scrolled past the header: card count, `💾 Save`, `MSC` copy button

**Fase 8 — MSC Codes (`js/msc.js`)**
- `MSC.encode(deck)` → compact portable string `MSC2-XXXX-XXXX-…`
- `MSC.decode(code)` → `[{n, copies}]`; v1 codes decoded for backwards compatibility
- Bitmap encoding: 1 bit per card (133 cards) + optional 4-bit copy counts → ~27 base32 chars for single-copy decks, regardless of card count
- MSC bar in the custom deck card: shows live code, `Copy code` button, `Import code` toggle
- Import panel expands inline — validates on input, enables Load button only when code is valid, warns if composition doesn't match current rarity config
- MSC code shown in history detail for `type:"custom"` entries

**Fase 9 — History for custom decks**
- `✦ Load into Custom` button in history detail for `type:"custom"` entries
- Loads cards, sets name, navigates to Custom section, and persists

**Fase 10 — JSON for custom decks**
- `exportCustomDeckJSON()` — exports with `schema:"custom-deck"` and embedded `msc` field
- `importCustomDeckJSON(file)` — validates card numbers, loads into editor

**Navigation & persistence**
- Active section saved to `localStorage` (`msSection`) on every nav change — restored on page refresh without animation
- Custom deck sort state saved inside `msConfigV3` under `customDeckSort`

**Errata fix (`js/cardPreview.js`)**
- `errata` field from the remote JSON can be an object `{fields, note}` or a string; both are now handled — previously rendered as `[object Object]` for Creativity (#32)

### Improvements

- `js/nav.js` — floating nav shows only icons (no labels) to prevent truncation with 5 buttons; scroll detection respects `custom-mode` body class so Custom stays highlighted when scrolling
- `js/history.js` — `deleteHistoryDeckFromList` and `deleteHistoryDeck` unified into `_deleteHistoryDeckShared`; both now reset `activeHistoryIndex`, fixing a stale index bug when deleting from the list view
- `js/history.js` — card lookup in `showHistoryEntry` now casts with `+n` to handle string IDs from old history data
- `js/storage.js` — added `loadSection`/`saveSection`, `loadCustomDeck`/`saveCustomDeck`/`clearCustomDeck`
- `js/state.js` — `customDeck` and `customDeckName` hydrated from `localStorage` at startup using `cards` (collection state, with correct `qty` values)
- `js/app.js` — `cycleSort` routes `"customdeck"` to `renderCustomDeck()`; `loadConfig` restores custom deck sort state

### Bug fixes

- Custom deck qty stepper input had `min="1"` but `customDeckSetCopies` accepted `0` — changed to `min="0"` for consistency
- MSC copy toast fired unconditionally even if the clipboard API failed — now only fires on success; shows error toast on failure
- MSC import row state (open + typed value) was lost on every `renderCustomDeck()` call — preserved across re-renders
- Removed dead function `customDeckRemoveCopy` (never called; UI used `customDeckSetCopies` exclusively)
- Removed dead wrapper `customDeckFocusSearch` — inlined `openAddCardDrawer` call at the callsite

### Compatibility
- New `localStorage` keys: `msCustomDeckV1`, `msSection`
- `msConfigV3` gains `customDeckSort` field (ignored by older versions)
- All existing keys unchanged (`msLang`, `msCardsV3`, `msExcludedV3`, `msConfigV3`, `msHistoryV4`)
- History entries gain optional `type:"custom"` and `msc` fields (ignored by older versions)
- JSON export gains optional `schema` and `msc` fields (v2 format, backwards compatible)
- Seed algorithm unchanged
- No new dependencies, no build step

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
