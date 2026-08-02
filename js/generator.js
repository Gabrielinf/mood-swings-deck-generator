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
  // Returns: array of decks (each deck = array of card objects)
  generate(config, cardPool, excludedSet, locksMap) {
    const es = config.lang === "es";
    const rng = makeSeededRng(config.seed);
    const used = {};
    const result = [];

    for (let d = 0; d < config.count; d++) {
      const out = [];
      for (const r of rarities) {
        const q = _quota(r, config, rng);

        if (q === null) {
          // Free color mode: pick rarityCounts[r] cards ignoring color distribution.
          const need = config.rarityCounts[r];
          const locked = cardPool.filter(x =>
            locksMap[d+"-"+x.n] && x.rarity === r && !excludedSet.has(x.n));
          if (locked.length > need) {
            throw generationError(es
              ? `Mazo ${d+1}: hay demasiadas cartas bloqueadas de rareza ${r}.`
              : `Deck ${d+1}: too many locked ${r} cards.`);
          }
          for (const x of locked) {
            const limit = config.respectInventory
              ? Math.max(0, +x.qty || 0)
              : Math.max(config.maxCopies, 1);
            if ((used[x.n] || 0) >= limit) {
              throw generationError(es
                ? `Mazo ${d+1}: la carta #${x.n} ${x.name} está bloqueada, pero no quedan copias disponibles.`
                : `Deck ${d+1}: locked card #${x.n} ${x.name} has no copies left for simultaneous use.`);
            }
            out.push(x);
            used[x.n] = (used[x.n] || 0) + 1;
          }
          const remaining = need - locked.length;
          const pool = shuffle(
            cardPool.filter(x =>
              !excludedSet.has(x.n) && x.rarity === r &&
              !locksMap[d+"-"+x.n] &&
              (!config.respectInventory || x.qty > 0) &&
              (used[x.n] || 0) < (config.respectInventory ? x.qty : Math.max(config.maxCopies, 1))),
            rng
          );
          if (pool.length < remaining) {
            throw generationError(es
              ? `No se puede completar el Mazo ${d+1}: faltan ${remaining - pool.length} carta(s) de rareza ${r}. Disponibles: ${pool.length}; necesarias: ${remaining}. Revisa colección, exclusiones o máximo de copias.`
              : `Deck ${d+1} cannot be completed: ${remaining - pool.length} ${r} card(s) short. Available: ${pool.length}; needed: ${remaining}. Check collection, exclusions, or max copies.`);
          }
          for (const x of pool.slice(0, remaining)) {
            out.push(x);
            used[x.n] = (used[x.n] || 0) + 1;
          }
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
            const limit = config.respectInventory
              ? Math.max(0, +x.qty || 0)
              : Math.max(config.maxCopies, 1);
            if ((used[x.n] || 0) >= limit) {
              throw generationError(es
                ? `Mazo ${d+1}: la carta #${x.n} ${x.name} está bloqueada, pero no quedan copias disponibles.`
                : `Deck ${d+1}: locked card #${x.n} ${x.name} has no copies left for simultaneous use.`);
            }
            out.push(x);
            used[x.n] = (used[x.n] || 0) + 1;
          }
          const need = q[c] - locked.length;
          const pool = shuffle(
            cardPool.filter(x =>
              !excludedSet.has(x.n) && x.rarity === r && x.color === c &&
              !locksMap[d+"-"+x.n] &&
              (!config.respectInventory || x.qty > 0) &&
              (used[x.n] || 0) < (config.respectInventory ? x.qty : Math.max(config.maxCopies, 1))),
            rng
          );
          if (pool.length < need) {
            throw generationError(es
              ? `No se puede completar el Mazo ${d+1}: faltan ${need - pool.length} carta(s) ${r} ${c}. Disponibles: ${pool.length}; necesarias: ${need}. Revisa colección, exclusiones, bloqueos, máximo de copias o distribución.`
              : `Deck ${d+1} cannot be completed: ${need - pool.length} ${r} ${c} card(s) short. Available: ${pool.length}; needed: ${need}. Check collection, exclusions, locks, max copies, or distribution.`);
          }
          for (const x of pool.slice(0, need)) {
            out.push(x);
            used[x.n] = (used[x.n] || 0) + 1;
          }
        }
      }
      result.push(out);
    }
    return result;
  }
};
