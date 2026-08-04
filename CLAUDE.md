# Mood Swings Deck Generator — CLAUDE.md

## What this project is

Static web app to generate and manage decks for the Mood Swings card game.
Published on GitHub Pages. No backend, no build step, no npm.
Stack: HTML + CSS + vanilla JavaScript.

## Absolute rules

### Do not break compatibility
- **localStorage keys** — never rename without implementing a migration first:
  - `msLang` — selected language
  - `msCardsV3` — user collection (quantities per card)
  - `msExcludedV3` — excluded cards
  - `msConfigV3` — generator configuration
  - `msHistoryV4` — saved deck history
- **Seed algorithm** — `seedHash` + `makeSeededRng` in `js/utils.js` must not be modified. Same seed + same config + same cards = same deck, always.
- **JSON format** — version 2 with v1→v2 migration preserved in `js/json.js`. Do not remove `normalizeDeckJSON`.

### Do not add dependencies
No React, Vue, Angular, TypeScript, npm, Vite, Webpack, or any framework.
The app must be openable directly from the filesystem or GitHub Pages.

### No big-bang rewrites
Incremental changes only. The app must work after every modification.

## Module architecture

Script load order in `index.html` (respect dependencies):

```
data/cards.js       ← card data: initial[], colors[], rarities[]
js/storage.js       ← Storage.load*/save* — single point of access to localStorage
js/utils.js         ← pure functions: shuffle, makeSeededRng, createSeed, colorIcon, safeFileName
js/state.js         ← all runtime globals declared here
js/i18n.js          ← tx table, T(k), label(c), colorOptionText(c)
js/generator.js     ← Generator.generate(config, cards, excluded, locks) — no DOM
js/collection.js    ← collection UI
js/history.js       ← history module
js/json.js          ← JSON import/export
js/cardPreview.js   ← image preview + notes modal
js/nav.js           ← structural nav + floating nav
js/app.js           ← setup, config UI, generator coordinator, swap modal, render
```

## Key functions — do not duplicate

| Function | File | What it does |
|----------|------|--------------|
| `Generator.generate(config, cards, excluded, locks)` | `generator.js` | Single source of truth for generation |
| `currentGeneratorConfigSnapshot()` | `app.js` | Reads current config from DOM → object |
| `applyConfigToUI(c, opts)` | `app.js` | Writes config to DOM — single implementation |
| `Storage.saveCollection(cards)` | `storage.js` | Saves collection to localStorage |
| `Storage.loadHistory()` / `Storage.saveHistory(h)` | `storage.js` | History |
| `loadHistoryEntryToCustomDeck(entryIndex, deckIndex)` | `customDeck.js` | Loads a history deck into the Custom Deck Editor |
| `deckMscApply(i)` | `app.js` | Imports an MSC code into deck slot `i` in the generator |

## Conventions

- Runtime globals live in `js/state.js`
- Pure functions (no DOM, no side effects) go in `js/utils.js`
- Each module accesses globals directly — no ES module system (GitHub Pages compatibility)
- Languages: Spanish (`es`) and English (`en`). Strings via `T(key)` from `i18n.js`
- `language` is the global that controls the active language

## Current status (2026-08-04)

Refactoring Phases 1–12 complete.
`app.js` went from 1217 → 391 lines.

### Features implemented (post-phase 12)
- **Max copies intra-deck:** `maxCopies` allows a card to appear N times within a single deck. The engine uses a bag model: each card is inserted `slotsFor(x)` times into the pool, shuffled, and sliced. `respectInventory` only controls cross-deck availability (1 physical copy consumed per deck that uses the card), not the intra-deck cap.
- **Load into Custom from history:** both generated and custom history entries show a "✦ Load into Custom" button. Multi-deck entries show one button per deck. `loadHistoryEntryToCustomDeck(entryIndex, deckIndex)`.
- **MSC import per deck in generator:** each deck has an "Import code" button in its MSC bar. Importing replaces only that slot without affecting other decks or their locks. Functions: `deckMscToggleImport`, `deckMscValidate`, `deckMscApply`.

### Pending
- **Phase 6:** Explicit deck model `{id, name, type, seed, cards:[{number, copies}]}`
- **Mobile testing:** pending until deployed to GitHub Pages

## Color distribution modes

The `<select id=mode>` has three values:

| Value | Behavior |
|-------|----------|
| `balanced` | Equal distribution across 5 colors. Respects priority if `priorityMode=fixed` |
| `free` | No color restriction — N cards per rarity are picked from the full pool. May produce monochromatic decks |
| `manual` | User defines exactly how many of each color per rarity |

In `free` mode: `_quota()` returns `null`; the engine uses a separate branch in `Generator.generate()`.

## Pre-change checklist

1. Does it change the seed algorithm? → Don't do it.
2. Does it change a localStorage key? → Implement migration first.
3. Does it duplicate generation logic? → Use `Generator.generate` instead.
4. Does it duplicate config-to-DOM restoration? → Use `applyConfigToUI`.
5. Does the app still work after the change? → Test before reporting done.
