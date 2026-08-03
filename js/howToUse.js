const _howToUseTabs={
  es:[
    {id:"generator",label:"Generador",icon:"⚙"},
    {id:"custom",label:"Mazo Custom",icon:"✦"},
    {id:"collection",label:"Colección",icon:"◫"},
    {id:"history",label:"Historial",icon:"◷"},
    {id:"msc",label:"Código MSC",icon:"⌗"},
  ],
  en:[
    {id:"generator",label:"Generator",icon:"⚙"},
    {id:"custom",label:"Custom Deck",icon:"✦"},
    {id:"collection",label:"Collection",icon:"◫"},
    {id:"history",label:"History",icon:"◷"},
    {id:"msc",label:"MSC Code",icon:"⌗"},
  ]
};

const _howToUseContent={
  es:{
    generator:`
      <h3>Generador de Mazos</h3>
      <p>El generador crea mazos aleatorios pero reproducibles usando una <b>seed</b>.</p>
      <h4>Configuration</h4>
      <ul>
        <li><b>Cards per deck</b> — cuántas cartas tendrá cada mazo.</li>
        <li><b>Máx. copias por carta</b> — cuántas veces puede aparecer la misma carta en el conjunto de mazos.</li>
        <li><b>Mazos simultáneos</b> — cuántos mazos generar al mismo tiempo.</li>
        <li><b>Usar solo cartas de mi colección</b> — si está activado, solo usa las cartas que tienes en tu colección y respeta las cantidades disponibles.</li>
      </ul>
      <h4>Rarezas</h4>
      <p>Define cuántas cartas Comunes (C), Infrecuentes (U), Raras (R) y Míticas (M) tendrá cada mazo. Usa los presets o personaliza.</p>
      <h4>Colores</h4>
      <ul>
        <li><b>Equilibrado automático</b> — distribuye los colores equitativamente.</li>
        <li><b>Colores aleatorios</b> — elige cartas sin restricción de color.</li>
        <li><b>Distribución manual</b> — tú decides cuántas cartas de cada color y rareza.</li>
      </ul>
      <h4>Seed</h4>
      <p>La seed es un código que identifica una generación específica. La misma seed + misma configuración siempre produce el mismo resultado. Puedes copiarla, pegarla y compartirla.</p>
      <h4>Acciones</h4>
      <ul>
        <li><b>Generar nuevo mazo</b> — genera con una seed nueva y limpia los bloqueos.</li>
        <li><b>Volver a sortear</b> — genera con una seed nueva conservando las cartas bloqueadas 🔒.</li>
      </ul>
    `,
    custom:`
      <h3>Mazo Custom</h3>
      <p>Construye un mazo carta por carta, sin restricciones del generador.</p>
      <ul>
        <li><b>⚡ Usar generador</b> — carga el resultado del generador como punto de partida editable.</li>
        <li><b>+ Agregar</b> — abre un panel lateral para buscar y agregar cartas por rareza.</li>
        <li><b>[−] [n] [+]</b> — controla las copias de cada carta.</li>
        <li><b>💾 Guardar mazo</b> — guarda el mazo en el historial.</li>
        <li><b>Exportar / Importar JSON</b> — descarga o carga el mazo como archivo.</li>
        <li><b>Código MSC</b> — código compacto para compartir el mazo. Cópialo o impórtalo.</li>
      </ul>
      <p class="small">La estructura de slots (C/U/R/M) viene de la configuración del generador.</p>
    `,
    collection:`
      <h3>Colección de Cartas</h3>
      <p>Registra cuántas copias de cada carta tienes físicamente.</p>
      <ul>
        <li>Usa los controles <b>[−] [n] [+]</b> para ajustar las cantidades.</li>
        <li>Activa <b>Usar solo cartas de mi colección</b> en el generador para que respete tus cantidades.</li>
        <li><b>Exportar / Importar JSON</b> — guarda o carga tu colección completa.</li>
        <li><b>Faltantes</b> — filtra para ver qué cartas te faltan.</li>
      </ul>
    `,
    history:`
      <h3>Historial</h3>
      <p>Guarda y recupera mazos generados o custom.</p>
      <ul>
        <li>Haz clic en un mazo para ver su detalle, seed, y composición.</li>
        <li><b>↩ Restaurar configuración</b> — vuelve a la configuración con la que fue generado.</li>
        <li><b>▶ Generar con esta seed</b> — regenera el mazo exacto.</li>
        <li><b>✦ Cargar en Custom</b> — carga un mazo del historial en el editor custom.</li>
        <li>Las cartas marcadas en rojo no están disponibles en tu colección actual.</li>
      </ul>
    `,
    msc:`
      <h3>Código MSC</h3>
      <p>El código MSC (Mood Swings Code) es una cadena compacta que representa un mazo completo.</p>
      <p>Ejemplo: <code>MSC2-FXXX-XXXX-XG00-…</code></p>
      <ul>
        <li>Aparece debajo de cada mazo generado y en el mazo custom.</li>
        <li>Haz clic en <b>Copiar código</b> para copiarlo al portapapeles.</li>
        <li>En Custom Deck, usa <b>Importar código</b> para cargar un mazo desde un código MSC.</li>
        <li>También aparece en el historial — clic en el chip para copiarlo.</li>
      </ul>
      <p class="small">La misma seed + misma configuración siempre produce el mismo código MSC.</p>
    `
  },
  en:{
    generator:`
      <h3>Deck Generator</h3>
      <p>The generator creates random but reproducible decks using a <b>seed</b>.</p>
      <h4>Configuration</h4>
      <ul>
        <li><b>Cards per deck</b> — how many cards each deck will have.</li>
        <li><b>Max copies per card</b> — how many times the same card can appear across all decks.</li>
        <li><b>Simultaneous decks</b> — how many decks to generate at once.</li>
        <li><b>Use only cards from my collection</b> — if enabled, only uses cards you own and respects available quantities.</li>
      </ul>
      <h4>Rarities</h4>
      <p>Define how many Commons (C), Uncommons (U), Rares (R) and Mythics (M) each deck will have. Use presets or customize.</p>
      <h4>Colors</h4>
      <ul>
        <li><b>Auto-balanced</b> — distributes colors evenly.</li>
        <li><b>Random colors</b> — picks cards with no color restriction.</li>
        <li><b>Manual distribution</b> — you decide how many cards per color and rarity.</li>
      </ul>
      <h4>Seed</h4>
      <p>The seed is a code that identifies a specific generation. The same seed + same configuration always produces the same result. You can copy, paste and share it.</p>
      <h4>Actions</h4>
      <ul>
        <li><b>Generate new deck</b> — generates with a new seed and clears locks.</li>
        <li><b>Reroll</b> — generates with a new seed while keeping locked 🔒 cards.</li>
      </ul>
    `,
    custom:`
      <h3>Custom Deck</h3>
      <p>Build a deck card by card, without the generator's restrictions.</p>
      <ul>
        <li><b>⚡ Use generator</b> — loads the generator's result as an editable starting point.</li>
        <li><b>+ Add</b> — opens a side panel to search and add cards by rarity.</li>
        <li><b>[−] [n] [+]</b> — controls copies of each card.</li>
        <li><b>💾 Save deck</b> — saves the deck to history.</li>
        <li><b>Export / Import JSON</b> — download or load the deck as a file.</li>
        <li><b>MSC Code</b> — compact code to share the deck. Copy or import it.</li>
      </ul>
      <p class="small">The slot structure (C/U/R/M) comes from the generator configuration.</p>
    `,
    collection:`
      <h3>Card Collection</h3>
      <p>Track how many copies of each card you own physically.</p>
      <ul>
        <li>Use <b>[−] [n] [+]</b> controls to adjust quantities.</li>
        <li>Enable <b>Use only cards from my collection</b> in the generator to respect your quantities.</li>
        <li><b>Export / Import JSON</b> — save or load your full collection.</li>
        <li><b>Missing</b> — filter to see which cards you're missing.</li>
      </ul>
    `,
    history:`
      <h3>History</h3>
      <p>Save and retrieve generated or custom decks.</p>
      <ul>
        <li>Click a deck to see its detail, seed, and composition.</li>
        <li><b>↩ Restore configuration</b> — returns to the configuration it was generated with.</li>
        <li><b>▶ Generate with this seed</b> — regenerates the exact deck.</li>
        <li><b>✦ Load into Custom</b> — loads a history deck into the custom editor.</li>
        <li>Cards marked in red are not available in your current collection.</li>
      </ul>
    `,
    msc:`
      <h3>MSC Code</h3>
      <p>The MSC (Mood Swings Code) is a compact string that represents a complete deck.</p>
      <p>Example: <code>MSC2-FXXX-XXXX-XG00-…</code></p>
      <ul>
        <li>Appears below each generated deck and in the custom deck.</li>
        <li>Click <b>Copy code</b> to copy it to the clipboard.</li>
        <li>In Custom Deck, use <b>Import code</b> to load a deck from an MSC code.</li>
        <li>Also appears in history — click the chip to copy it.</li>
      </ul>
      <p class="small">The same seed + same configuration always produces the same MSC code.</p>
    `
  }
};

let _howToUseActiveTab="generator";

function openHowToUse(){
  const overlay=document.getElementById("howToUseOverlay");
  if(!overlay)return;
  overlay.classList.add("open");
  _renderHowToUse(_howToUseActiveTab);
}
function closeHowToUse(){
  const overlay=document.getElementById("howToUseOverlay");
  if(overlay)overlay.classList.remove("open");
}
function _renderHowToUse(tabId){
  _howToUseActiveTab=tabId;
  const es=language==="es";
  const title=document.getElementById("howToUseTitle");
  if(title)title.textContent=es?"Cómo usar":"How to use";
  const tabs=_howToUseTabs[es?"es":"en"];
  const tabsEl=document.getElementById("howToUseTabs");
  const bodyEl=document.getElementById("howToUseBody");
  if(tabsEl) tabsEl.innerHTML=tabs.map(t=>
    `<button type="button" class="how-to-use-tab${t.id===tabId?" active":""}" onclick="_renderHowToUse('${t.id}')">
      <span>${t.icon}</span> ${t.label}
    </button>`
  ).join("");
  if(bodyEl) bodyEl.innerHTML=_howToUseContent[es?"es":"en"][tabId]||"";
}
