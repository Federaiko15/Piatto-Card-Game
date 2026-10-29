import type { ConsumableId, FoodId, SantinoId, TableModifierId } from "@piatto/game-core";
import { publicUrl } from "../edition";

// Il registro di tutta la grafica e dei suoni del gioco.
// I file si mettono nelle cartelle di src/art con il nome giusto (vedi src/art/README.md) e vengono
// presi in automatico: finché un file non c'è il gioco usa il segnaposto scritto qui sotto.
// Così l'arrivo dei disegni non richiede modifiche al codice.

export type Expression = "neutral" | "happy" | "sad" | "suspicious";

const files = (glob: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(glob).map(([path, url]) => [path.split("/").pop()!.replace(/\.\w+$/, ""), url]),
  );

const characterFiles = files(
  import.meta.glob<string>("./characters/*.{png,webp,gif}", { eager: true, import: "default" }),
);
const sceneFiles = files(
  import.meta.glob<string>("./scenes/*.{png,webp,jpg}", { eager: true, import: "default" }),
);
const santinoFiles = files(
  import.meta.glob<string>("./santini/*.{png,webp}", { eager: true, import: "default" }),
);
export const sfxFiles = files(
  import.meta.glob<string>("./sfx/*.{ogg,mp3,wav}", { eager: true, import: "default" }),
);

// ---------- Personaggi ----------

// L'aspetto dei personaggi; nomi e descrizioni stanno nei dizionari (src/i18n)
export interface CharacterInfo {
  emoji: string; // segnaposto del ritratto
  color: string; // colore dello sfondo del ritratto
  // il volto non si vede (l'incappucciato): le espressioni spuntano sopra la testa come nei manga,
  // con i disegni di emotes/ al posto delle espressioni del ritratto
  emotes?: boolean;
}

export const CHARACTERS: Record<string, CharacterInfo> = {
  hero: { emoji: "🧑", color: "#2f8f5b" },
  zio_turi: { emoji: "👴", color: "#7a5a3a" },
  picciotto: { emoji: "😎", color: "#c8372d" },
  zingara: { emoji: "🔮", color: "#6b3fa0" },
  ragioniere: { emoji: "🧮", color: "#1f5fa8" },
  prete: { emoji: "⛪", color: "#2a1a12" },
  incappucciato: { emoji: "🕴️", color: "#15110f", emotes: true },
};

// ---------- Espressioni sopra la testa ----------

const emoteFiles = files(
  import.meta.glob<string>("./emotes/*.{png,webp}", { eager: true, import: "default" }),
);

// emotes/happy.png, sad.png, suspicious.png; finché mancano, un segno disegnato con il testo
export const EMOTE_GLYPHS: Record<Exclude<Expression, "neutral">, string> = {
  happy: "♪",
  sad: "💧",
  suspicious: "?",
};

export const emoteArt = (expression: Expression): string | undefined => emoteFiles[expression];

// Mezzobusto del personaggio con l'espressione richiesta: zio_turi.happy.png, se c'è, altrimenti zio_turi.png
export const characterArt = (id: string, expression: Expression = "neutral"): string | undefined =>
  characterFiles[`${id}.${expression}`] ?? characterFiles[id];

// Il mezzobusto a livelli, per farlo respirare: zio_turi.braccia.png, zio_turi.busto.png e una testa per
// espressione (zio_turi.testa.happy.png, altrimenti zio_turi.testa.neutral.png). Tutti sulla stessa tela 80×80.
// zio_turi.busto.inspira.png, se c'è, è il busto disegnato mentre inspira: altrimenti il busto si alza di 1 pixel.
// Chi non cambia faccia (l'incappucciato) può non avere la testa a parte: è già nel busto
export interface CharacterLayers {
  braccia: string;
  busto: string;
  bustoInspira?: string;
  testa?: string;
}

export const characterLayers = (id: string, expression: Expression = "neutral"): CharacterLayers | undefined => {
  const braccia = characterFiles[`${id}.braccia`];
  const busto = characterFiles[`${id}.busto`];
  const testa = characterFiles[`${id}.testa.${expression}`] ?? characterFiles[`${id}.testa.neutral`];
  const bustoInspira = characterFiles[`${id}.busto.inspira`];
  return braccia && busto ? { braccia, busto, bustoInspira, testa } : undefined;
};

// Il ritmo del respiro, in secondi per un respiro intero: chi è agitato respira più in fretta
export const BREATH_SECONDS: Record<string, number> = {
  zio_turi: 4.2,
  picciotto: 2.6,
  zingara: 3.6,
  ragioniere: 3.4,
  prete: 4.8,
  incappucciato: 5.2,
};

// ---------- Fondali dei tavoli ----------

export interface SceneInfo {
  // i colori del segnaposto: parete, zoccolo di legno e luce della lampada
  wall: string;
  wainscot: string;
  lamp: string;
}

export const SCENES: SceneInfo[] = [
  { wall: "#5a2a1e", wainscot: "#2a1810", lamp: "rgba(255, 200, 110, 0.45)" }, // il bar della piazza
  { wall: "#2c2338", wainscot: "#1c1420", lamp: "rgba(255, 170, 90, 0.38)" }, // la bisca del retrobottega
  { wall: "#2a221c", wainscot: "#140f0c", lamp: "rgba(255, 160, 80, 0.32)" }, // la cantina
  { wall: "#3a1420", wainscot: "#1a0c10", lamp: "rgba(255, 140, 80, 0.4)" }, // il tavolo del Prete
];

// table-0.png, table-1.png... uno per tavolo della notte
export const sceneArt = (tableIndex: number): string | undefined =>
  sceneFiles[`table-${tableIndex}`];

// ---------- Tavoli ----------

const tableFiles = files(
  import.meta.glob<string>("./tables/*.{png,webp}", { eager: true, import: "default" }),
);

// tables/table-0.png, table-1.png...: il tavolo visto da seduti. Un tavolo senza disegno proprio
// usa quello del primo, e se non c'è nessun disegno resta il tavolo fatto in CSS
export const tableArt = (tableIndex: number): string | undefined =>
  tableFiles[`table-${tableIndex}`] ?? tableFiles["table-0"];

// shop.png: il fondale della bottega
export const SHOP_ART: string | undefined = sceneFiles.shop;

export const sceneInfo = (tableIndex: number): SceneInfo =>
  SCENES[tableIndex] ?? SCENES[SCENES.length - 1];

// ---------- Santini, consumabili, malocchi ----------

export type ItemId = SantinoId | ConsumableId | FoodId;

export const ITEM_ICONS: Record<ItemId, string> = {
  san_giuseppe: "🪚",
  corno_rosso: "🌶️",
  coppola_del_nonno: "🧢",
  memoria_di_ferro: "🧠",
  santa_rosalia: "🌹",
  fico_d_india: "🌵",
  sant_antonio: "🕯️",
  salvadanaio: "🐷",
  pupo_di_orlando: "🗡️",
  patto: "📜",
  corona_di_ruggero: "👑",
  sant_agata: "🌋",
  carretto_siciliano: "🛞",
  paladino_rinaldo: "🛡️",
  testa_di_moro: "🏺",
  trinacria: "☀️",
  brucia: "🔥",
  passo: "✋",
  mischia: "🔀",
  mpanata: "🥖",
  mpurnatu: "🥘",
};

export const MODIFIER_ICONS: Record<TableModifierId, string> = {
  niente_piatto: "⛪",
  sei_storto: "6️⃣",
  malocchio: "🧿",
  finanza: "💼",
  festa_del_patrono: "🎆",
};

// L'illustrazione di un santino, consumabile o cibo (san_giuseppe.png, mpanata.png...), se è già stata disegnata
export const itemArt = (id: ItemId): string | undefined => santinoFiles[id];

export const SEED_SYMBOLS = { denari: "🪙", coppe: "🍷", spade: "🗡️", bastoni: "🪵" } as const;

export const cardArt = (seed: string, value: number) => publicUrl(`cards/${seed}_${value}.png`);
export const CARD_BACK = publicUrl("cards/back.png");
