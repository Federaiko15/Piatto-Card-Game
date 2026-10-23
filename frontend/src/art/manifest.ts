import type { ConsumableId, SantinoId, TableModifierId } from "@piatto/game-core";

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

export interface CharacterInfo {
  name: string;
  emoji: string; // segnaposto del ritratto
  color: string; // colore dello sfondo del ritratto
  tagline: string; // una riga sul suo modo di giocare, per il giocatore che impara a leggerlo
}

export const CHARACTERS: Record<string, CharacterInfo> = {
  hero: { name: "Tu", emoji: "🧑", color: "#2f8f5b", tagline: "" },
  zio_turi: { name: "Zio Turi", emoji: "👴", color: "#7a5a3a", tagline: "Punta sempre poco." },
  picciotto: { name: "Il Picciotto", emoji: "😎", color: "#c8372d", tagline: "Va spesso a Piatto." },
  zingara: { name: "'A Zingara", emoji: "🔮", color: "#6b3fa0", tagline: "Conta le carte." },
  ragioniere: { name: "Il Ragioniere", emoji: "🧮", color: "#1f5fa8", tagline: "Punta il 10% del saldo." },
  prete: { name: "Il Prete", emoji: "⛪", color: "#2a1a12", tagline: "Al suo tavolo niente Piatto." },
};

// Mezzobusto del personaggio con l'espressione richiesta: zio_turi.happy.png, se c'è, altrimenti zio_turi.png
export const characterArt = (id: string, expression: Expression = "neutral"): string | undefined =>
  characterFiles[`${id}.${expression}`] ?? characterFiles[id];

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

export const ITEM_ICONS: Record<SantinoId | ConsumableId, string> = {
  san_giuseppe: "🪚",
  corno_rosso: "🌶️",
  coppola_del_nonno: "🧢",
  memoria_di_ferro: "🧠",
  santa_rosalia: "🌹",
  fico_d_india: "🌵",
  sant_antonio: "🕯️",
  salvadanaio: "🐷",
  pupo_di_orlando: "🗡️",
  brucia: "🔥",
  passo: "✋",
  mischia: "🔀",
};

export const MODIFIER_ICONS: Record<TableModifierId, string> = {
  niente_piatto: "⛪",
  sei_storto: "6️⃣",
  malocchio: "🧿",
  finanza: "💼",
  festa_del_patrono: "🎆",
};

// L'illustrazione di un santino o consumabile (san_giuseppe.png...), se è già stata disegnata
export const itemArt = (id: SantinoId | ConsumableId): string | undefined => santinoFiles[id];

export const SEED_SYMBOLS = { denari: "🪙", coppe: "🍷", spade: "🗡️", bastoni: "🪵" } as const;

export const cardArt = (seed: string, value: number) => `/cards/${seed}_${value}.png`;
