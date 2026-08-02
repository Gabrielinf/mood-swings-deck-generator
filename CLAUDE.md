# Mood Swings Deck Generator — CLAUDE.md

## Qué es este proyecto

Aplicación web estática para generar y administrar mazos del juego de cartas Mood Swings.
Publicada en GitHub Pages. Sin backend, sin build step, sin npm.
Stack: HTML + CSS + JavaScript vanilla.

## Reglas absolutas

### No romper compatibilidad
- **localStorage keys** — nunca renombrar sin implementar migración primero:
  - `msLang` — idioma seleccionado
  - `msCardsV3` — colección del usuario (cantidades por carta)
  - `msExcludedV3` — cartas excluidas
  - `msConfigV3` — configuración del generador
  - `msHistoryV4` — historial de mazos guardados
- **Seed algorithm** — `seedHash` + `makeSeededRng` en `js/utils.js` no deben modificarse. Misma seed + misma config + mismas cartas = mismo mazo siempre.
- **JSON format** — versión 2 con migración v1→v2 preservada en `js/json.js`. No eliminar `normalizeDeckJSON`.

### No agregar dependencias
Sin React, Vue, Angular, TypeScript, npm, Vite, Webpack ni ningún framework.
La app debe poder abrirse directamente desde el filesystem o GitHub Pages.

### No hacer big-bang rewrites
Cambios incrementales. La app debe funcionar después de cada modificación.

## Arquitectura de módulos

Orden de carga en `index.html` (respetar dependencias):

```
data/cards.js       ← datos de cartas: initial[], colors[], rarities[]
js/storage.js       ← Storage.load*/save* — único punto de acceso a localStorage
js/utils.js         ← funciones puras: shuffle, makeSeededRng, createSeed, colorIcon, safeFileName
js/state.js         ← todos los globals de runtime declarados aquí
js/i18n.js          ← tabla tx, T(k), label(c), colorOptionText(c)
js/generator.js     ← Generator.generate(config, cards, excluded, locks) — sin DOM
js/collection.js    ← UI de colección
js/history.js       ← módulo historial
js/json.js          ← import/export JSON
js/cardPreview.js   ← preview de imágenes + modal de notas
js/nav.js           ← navegación estructural + nav flotante
js/app.js           ← setup, config UI, generador coordinador, swap modal, render
```

## Funciones clave — no duplicar

| Función | Archivo | Qué hace |
|---------|---------|----------|
| `Generator.generate(config, cards, excluded, locks)` | `generator.js` | Única fuente de verdad para generación |
| `currentGeneratorConfigSnapshot()` | `app.js` | Lee la config actual del DOM → objeto |
| `applyConfigToUI(c, opts)` | `app.js` | Escribe config al DOM — única implementación |
| `Storage.saveCollection(cards)` | `storage.js` | Guarda colección en localStorage |
| `Storage.loadHistory()` / `Storage.saveHistory(h)` | `storage.js` | Historial |

## Convenciones

- Variables globales de runtime viven en `js/state.js`
- Funciones puras (sin DOM, sin side effects) van en `js/utils.js`
- Cada módulo accede a globals directamente — no hay sistema de módulos ES (compatibilidad GitHub Pages)
- Idiomas: español (`es`) e inglés (`en`). Textos via `T(key)` de `i18n.js`
- `language` es el global que controla el idioma activo

## Estado actual (2026-08-01)

Refactorización Fase 1–12 completada.
`app.js` pasó de 1217 → 391 líneas.

### Fases pendientes
- **Fase 6:** Modelo de deck explícito `{id, name, type, seed, cards:[{number, copies}]}`
- **Fase 7:** Custom Deck Editor — reutiliza `Generator.generate`, no crea motor paralelo
- **Fase 8:** Códigos MSC portables (`MSC.encode` / `MSC.decode`) para custom decks
- **Prueba mobile:** pendiente para cuando se suba a GitHub Pages

## Modos de distribución de colores

El `<select id=mode>` tiene tres valores:

| Valor | Comportamiento |
|-------|---------------|
| `balanced` | Distribución equitativa entre 5 colores. Respeta prioridad si `priorityMode=fixed` |
| `free` | Sin restricción de color — las N cartas de cada rareza se eligen del pool completo. Puede producir mazos monocromáticos |
| `manual` | El usuario define exactamente cuántas de cada color por rareza |

En modo `free`: `_quota()` devuelve `null`, el motor usa una rama separada en `Generator.generate()`.

## Checklist antes de un cambio

1. ¿Cambia el algoritmo de seed? → No hacerlo.
2. ¿Cambia una localStorage key? → Implementar migración primero.
3. ¿Duplica lógica de generación? → Usar `Generator.generate` en su lugar.
4. ¿Duplica la restauración de config al DOM? → Usar `applyConfigToUI`.
5. ¿La app sigue funcionando después del cambio? → Probar antes de reportar listo.
