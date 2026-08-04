# Mood Swings Deck Generator

A configurable deck generator for the [Mood Swings](https://boardgamegeek.com/boardgame/221765/mood-swings) card game. Build balanced decks with color distribution, inventory tracking, locks, and history — all in a static web app with no dependencies.

## Features

- **Deck Generator** — generate one or multiple decks at once with full control over size, rarity ratios, and color distribution
- **Color modes** — Auto-balanced (5 colors), Random (no color restriction), or Manual (define exact counts per rarity per color)
- **Max copies per card** — allow a card to appear up to N times within a single deck (bag model: duplicates arise naturally from random draw)
- **Inventory mode** — restrict generation to cards you own; the app tracks how many physical copies each deck consumes across simultaneous decks
- **Locks** — lock cards you want to keep and reroll the rest
- **Seed system** — every deck is reproducible: same seed + same config = same deck, always
- **Custom Deck Editor** — build a deck by hand, use the generator as a starting point, or import via MSC code
- **MSC codes** — compact portable codes (`MSC2-XXXX-…`) to share and restore any deck; import directly into the generator or custom editor
- **Collection** — track how many copies of each card you own; export/import as JSON
- **History** — save generated and custom decks; restore configuration, regenerate with the original seed, or load any saved deck into the Custom Editor
- **Bilingual** — full Spanish and English UI

## Usage

Open `index.html` directly in a browser — no server, no build step required. Also deployable to GitHub Pages as-is.

## Stack

Plain HTML + CSS + vanilla JavaScript. No frameworks, no npm, no build tooling.

## Project structure

```
index.html          ← single page app entry point
css/main.css        ← all styles
data/cards.js       ← card data (133 cards: name, color, rarity)
js/
  storage.js        ← localStorage API (single access point)
  utils.js          ← pure functions: shuffle, seed, icons
  state.js          ← all runtime globals
  i18n.js           ← translations (es/en)
  generator.js      ← pure deck generation engine (no DOM)
  msc.js            ← MSC encode/decode (v1 + v2)
  customDeck.js     ← Custom Deck Editor
  collection.js     ← Collection UI
  history.js        ← History module
  json.js           ← JSON import/export
  cardPreview.js    ← card image preview + notes modal
  howToUse.js       ← How to Use modal
  nav.js            ← navigation
  app.js            ← coordinator: config UI, generation, render
```

## localStorage keys

| Key | Contents |
|-----|----------|
| `msLang` | Selected language |
| `msCardsV3` | User collection (quantities per card) |
| `msExcludedV3` | Excluded card numbers |
| `msConfigV3` | Generator configuration |
| `msHistoryV4` | Saved deck history |
| `msCustomDeckV1` | Current custom deck |
| `msSection` | Last active section |

## Data attribution

Card data and images are fetched at runtime from [moodswingsdata.github.io](https://moodswingsdata.github.io) and are not bundled in this repository.
Mood Swings Data is unofficial fan content not approved or endorsed by Wizards of the Coast.
Portions of the materials are property of Wizards of the Coast LLC.

## License

Copyright (c) 2026 Gabriel Salazar. All rights reserved.
