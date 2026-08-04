// Pure generation engine — no DOM dependencies.
// All inputs arrive via config; returns deck arrays or throws generationError.

const ratioPresets = {
  base:          {C:23, U:14, R:6, M:2},
  commonHeavy:   {C:60, U:25, R:10, M:5},
  balancedRarity:{C:40, U:30, R:20, M:10},
  rareHeavy:     {C:35, U:30, R:25, M:10}
};

function generationError(message) {
  const e = new Error(message);
  e.isGenerationError = true;
  return e;
}

function normalizeRatio(r) {
  const total = r.C + r.U + r.R + r.M;
  return total ? {C:r.C/total, U:r.U/total, R:r.R/total, M:r.M/total} : {C:1, U:0, R:0, M:0};
}

function allocateByRatio(total, ratio) {
  const exact = rarities.map(r => ({r, exact: ratio[r] * total}));
  const vals = Object.fromEntries(exact.map(x => [x.r, Math.floor(x.exact)]));
  let remain = total - Object.values(vals).reduce((a,b) => a+b, 0);
  exact.sort((a,b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)));
  for (let i = 0; i < remain; i++) vals[exact[i % exact.length].r]++;
  return vals;
}

function distributeAmong(n, active, ordered=true) {
  const q = Object.fromEntries(colors.map(c => [c, 0]));
  if (!active.length) return q;
  const base = Math.floor(n / active.length), extra = n % active.length;
  active.forEach(c => q[c] = base);
  const order = ordered ? active : shuffle(active);
  order.slice(0, extra).forEach(c => q[c]++);
  return q;
}

function _quota(r, config, rng) {
  if (config.colorMode === "free") return null;
  if (config.colorMode === "manual") {
    return Object.fromEntries(colors.map(c => [c, Math.max(0, ((config.manualDistribution[r]) || {})[c] || 0)]));
  }
  const n = config.rarityCounts[r];
  const q = Object.fromEntries(colors.map(c => [c, Math.floor(n / 5)]));
  const extra = n % 5;
  const order = config.priorityMode === "fixed" ? [...config.priority] : shuffle([...colors], rng);
  order.slice(0, extra).forEach(c => q[c]++);
  return q;
}

const Generator = {
  // config: { count, maxCopies, respectInventory, seed, rarityCounts:{C,U,R,M},
  //           colorMode, priorityMode, priority:[...], manualDistribution:{r:{c:n}},
  //           lang }
  // Returns: array of decks (each deck = array of card objects, duplicates allowed up to maxCopies)
  generate(config, cardPool, excludedSet, locksMap) {
    const es = config.lang === "es";
    const rng = makeSeededRng(config.seed);
    const mc = config.maxCopies;
    // crossUsed[n] = number of OTHER decks that already use card n (1 per deck, not per copy).
    const crossUsed = {};
    const result = [];

    for (let d = 0; d < config.count; d++) {
      const out = [];
      // deckUsed[n] = copies of card n already placed in this deck.
      const deckUsed = {};

      // Available intra-deck slots remaining for card x.
      // respectInventory: needs at least 1 physical copy not consumed by other decks.
      // maxCopies always caps how many times a card can appear inside one deck.
      function slotsFor(x) {
        if (config.respectInventory) {
          const physicalLeft = Math.max(0, (+x.qty || 0) - (crossUsed[x.n] || 0));
          if (physicalLeft < 1) return 0;
        }
        return Math.max(0, mc - (deckUsed[x.n] || 0));
      }

      function addCard(x) {
        out.push(x);
        deckUsed[x.n] = (deckUsed[x.n] || 0) + 1;
      }

      // Pick `need` cards from eligible subset, allowing up to mc copies of each.
      // Builds a bag where each card appears slotsFor(x) times, shuffles it,
      // then slices — duplicates arise naturally from the random draw.
      // Returns { ok, cards } or { ok: false, available }.
      function pick(baseFilter, need) {
        const bag = shuffle(
          cardPool
            .filter(x => baseFilter(x) && slotsFor(x) > 0)
            .flatMap(x => Array(slotsFor(x)).fill(x)),
          rng
        );
        if (bag.length < need) return { ok: false, available: bag.length };
        return { ok: true, cards: bag.slice(0, need) };
      }

      for (const r of rarities) {
        const q = _quota(r, config, rng);

        if (q === null) {
          // Free color mode
          const need = config.rarityCounts[r];
          const locked = cardPool.filter(x =>
            locksMap[d+"-"+x.n] && x.rarity === r && !excludedSet.has(x.n));
          if (locked.length > need) {
            throw generationError(es
              ? `Mazo ${d+1}: hay demasiadas cartas bloqueadas de rareza ${r}.`
              : `Deck ${d+1}: too many locked ${r} cards.`);
          }
          for (const x of locked) {
            if (slotsFor(x) < 1) {
              throw generationError(es
                ? `Mazo ${d+1}: la carta #${x.n} ${x.name} está bloqueada, pero no quedan copias disponibles.`
                : `Deck ${d+1}: locked card #${x.n} ${x.name} has no copies left.`);
            }
            addCard(x);
          }
          const remaining = need - locked.length;
          const res = pick(x =>
            !excludedSet.has(x.n) && x.rarity === r &&
            !locksMap[d+"-"+x.n] &&
            (!config.respectInventory || (+x.qty || 0) > 0),
            remaining
          );
          if (!res.ok) {
            throw generationError(es
              ? `No se puede completar el Mazo ${d+1}: faltan ${remaining - res.available} carta(s) de rareza ${r}. Disponibles: ${res.available}; necesarias: ${remaining}. Revisa colección, exclusiones o máximo de copias.`
              : `Deck ${d+1} cannot be completed: ${remaining - res.available} ${r} card(s) short. Available: ${res.available}; needed: ${remaining}. Check collection, exclusions, or max copies.`);
          }
          for (const x of res.cards) addCard(x);
          continue;
        }

        const qTotal = Object.values(q).reduce((a,b) => a+b, 0);
        if (qTotal !== config.rarityCounts[r]) {
          throw generationError(es
            ? `${r}: la distribución manual debe sumar ${config.rarityCounts[r]}.`
            : `${r}: manual distribution must total ${config.rarityCounts[r]}.`);
        }
        for (const c of colors) {
          const locked = cardPool.filter(x =>
            locksMap[d+"-"+x.n] && x.rarity === r && x.color === c && !excludedSet.has(x.n));
          if (locked.length > q[c]) {
            throw generationError(es
              ? `Mazo ${d+1}: hay demasiadas cartas bloqueadas de ${r} ${c}.`
              : `Deck ${d+1}: too many locked ${r} ${c} cards.`);
          }
          for (const x of locked) {
            if (slotsFor(x) < 1) {
              throw generationError(es
                ? `Mazo ${d+1}: la carta #${x.n} ${x.name} está bloqueada, pero no quedan copias disponibles.`
                : `Deck ${d+1}: locked card #${x.n} ${x.name} has no copies left.`);
            }
            addCard(x);
          }
          const need = q[c] - locked.length;
          const res = pick(x =>
            !excludedSet.has(x.n) && x.rarity === r && x.color === c &&
            !locksMap[d+"-"+x.n] &&
            (!config.respectInventory || (+x.qty || 0) > 0),
            need
          );
          if (!res.ok) {
            throw generationError(es
              ? `No se puede completar el Mazo ${d+1}: faltan ${need - res.available} carta(s) ${r} ${c}. Disponibles: ${res.available}; necesarias: ${need}. Revisa colección, exclusiones, bloqueos, máximo de copias o distribución.`
              : `Deck ${d+1} cannot be completed: ${need - res.available} ${r} ${c} card(s) short. Available: ${res.available}; needed: ${need}. Check collection, exclusions, locks, max copies, or distribution.`);
          }
          for (const x of res.cards) addCard(x);
        }
      }

      if (config.respectInventory) {
        // 1 physical copy consumed per deck per card, regardless of intra-deck duplicates.
        for (const n of Object.keys(deckUsed))
          crossUsed[n] = (crossUsed[n] || 0) + 1;
      }

      result.push(out);
    }
    return result;
  }
};
