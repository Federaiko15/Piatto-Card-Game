import { HERO_ID, type RunEvent, type RunState, type SantinoId } from "@piatto/game-core";
import type { Expression } from "../art/manifest";
import type { SfxName } from "../audio/sfx";

// Il "regista" della scena: trasforma gli eventi del motore in indicazioni di regia (monete che volano,
// lampi, espressioni, suoni). Non sa come verranno disegnate: oggi le esegue il DOM, domani la scena PixiJS
// potrà leggere le stesse indicazioni senza cambiare il motore né questa funzione.

export type Anchor = string; // l'id di un giocatore, "pot" per il piatto, "scene" per tutta la scena
export type Tone = "win" | "lose" | "gold" | "curse";

export type SceneCue =
  | { kind: "coins"; from: Anchor; to: Anchor; amount: number }
  | { kind: "float"; at: Anchor; text: string; tone: Tone }
  | { kind: "burst"; at: Anchor; tone: Tone }
  | { kind: "flash"; tone: Tone }
  | { kind: "shake" }
  // minor: il santino si accende nel pannello; major: entra in scena; spent: si spegne, vale una volta per tavolo
  | { kind: "santino"; id: SantinoId; size: "minor" | "major"; spent: boolean; amount?: number }
  | { kind: "sfx"; name: SfxName };

export interface SceneDirection {
  cues: SceneCue[];
  expressions: Record<string, Expression>;
}

export const BIG_WIN = 20;

// I santini che scattano spesso (o fuori dal tavolo) non fermano il gioco: si accendono nel pannello.
// Tutti gli altri cambiano il colpo e meritano di entrare in scena
const MINOR_SANTINI = new Set<SantinoId>([
  "fico_d_india",
  "carretto_siciliano",
  "salvadanaio",
  "patto",
  "paladino_rinaldo",
]);
// quelli che valgono una volta per tavolo: dopo l'uso restano spenti fino al tavolo successivo
export const ONCE_PER_TABLE = new Set<SantinoId>(["corno_rosso", "coppola_del_nonno"]);

export const directScene = (events: RunEvent[], run: RunState): SceneDirection => {
  const cues: SceneCue[] = [];
  const expressions: Record<string, Expression> = {};
  const others = (id: string) => run.table.players.filter((p) => p.id !== id && p.status === "playing");
  // due santini grandi nella stessa pescata (Pupo e Corona sul re) si coprirebbero: entra in scena solo il primo
  let majorShown = false;

  for (const event of events) {
    switch (event.type) {
      case "card_drawn": {
        const delta = run.lastDraw?.playerId === event.playerId ? run.lastDraw.delta : 0;
        cues.push({ kind: "sfx", name: "card_flip" });
        if (delta !== 0) cues.push({ kind: "sfx", name: "coins" });
        if (delta > 0) {
          cues.push({ kind: "coins", from: "pot", to: event.playerId, amount: delta });
          cues.push({ kind: "float", at: event.playerId, text: `+${delta}`, tone: "win" });
        } else if (delta < 0) {
          cues.push({ kind: "coins", from: event.playerId, to: "pot", amount: -delta });
          cues.push({ kind: "float", at: event.playerId, text: `−${-delta}`, tone: "lose" });
        }
        expressions[event.playerId] = event.outcome === "win" ? "happy" : "sad";

        if (delta >= BIG_WIN) {
          cues.push({ kind: "burst", at: event.playerId, tone: "gold" });
          cues.push({ kind: "sfx", name: "big_win" });
          // una vincita grossa rende sospettosi gli altri al tavolo
          for (const p of others(event.playerId)) expressions[p.id] = "suspicious";
          if (event.playerId === HERO_ID) cues.push({ kind: "flash", tone: "gold" });
        }
        // le carte normali non hanno un suono loro: bastano la carta e le monete,
        // la fanfara resta per il tavolo vinto e "lose" per la notte persa
        if (event.playerId === HERO_ID && delta <= -BIG_WIN) cues.push({ kind: "shake" });
        break;
      }
      case "card_effect":
        if (event.effect === "re") cues.push({ kind: "burst", at: event.playerId, tone: "gold" });
        if (event.effect === "fante" && event.targetId && event.amount) {
          cues.push({ kind: "coins", from: event.targetId, to: event.playerId, amount: event.amount });
          cues.push({ kind: "float", at: event.targetId, text: `−${event.amount}`, tone: "lose" });
          expressions[event.targetId] = "suspicious";
        }
        break;
      case "santino_triggered": {
        const major: boolean = !MINOR_SANTINI.has(event.santino) && !majorShown;
        majorShown ||= major;
        if (major) cues.push({ kind: "flash", tone: "gold" });
        cues.push({
          kind: "santino",
          id: event.santino,
          size: major ? "major" : "minor",
          spent: ONCE_PER_TABLE.has(event.santino),
          amount: event.amount,
        });
        cues.push({ kind: "sfx", name: "santino" });
        // Fico d'India e Carretto pagano una moneta anche quando la carta la pesca un altro
        if ((event.santino === "fico_d_india" || event.santino === "carretto_siciliano") && event.amount) {
          cues.push({ kind: "coins", from: `santino:${event.santino}`, to: HERO_ID, amount: event.amount });
        }
        break;
      }
      case "modifier_triggered":
        cues.push({ kind: "flash", tone: "curse" });
        cues.push({ kind: "sfx", name: "curse" });
        break;
      case "player_eliminated":
        // chi resta senza monete si alza dal tavolo
        cues.push({ kind: "sfx", name: "chair" });
        expressions[event.playerId] = "sad";
        if (event.playerId === HERO_ID) cues.push({ kind: "shake" });
        break;
      case "pot_refilled":
        cues.push({ kind: "sfx", name: "coins" });
        break;
      case "pot_collected":
        cues.push({ kind: "coins", from: "pot", to: HERO_ID, amount: event.amount });
        break;
      case "pot_split":
        for (const id of event.players) {
          cues.push({ kind: "coins", from: "pot", to: id, amount: event.share });
        }
        break;
      // tavolo superato o notte vinta: la fanfara (alla fine della notte arrivano tutti e due gli eventi)
      case "table_cleared":
        cues.push({ kind: "sfx", name: "victory" });
        break;
      case "run_lost":
        cues.push({ kind: "sfx", name: "lose" });
        break;
      case "table_started":
        cues.push({ kind: "sfx", name: "chair" });
        break;
      // il santino della nonna entra in scena al primo tavolo e va al suo posto nel pannello
      case "blessing_chosen":
        cues.push({ kind: "santino", id: event.santino, size: "major", spent: false });
        cues.push({ kind: "sfx", name: "santino" });
        break;
      // il premio dell'incappucciato: le monete suonano, il suo oggetto entra in scena
      case "reward_chosen":
        if (event.santino) {
          cues.push({ kind: "santino", id: event.santino, size: "major", spent: false });
          cues.push({ kind: "sfx", name: "santino" });
        } else {
          cues.push({ kind: "sfx", name: "coins" });
        }
        break;
      // la 'Mpanata rimette monete in tasca; il 'Mpurnatu si sente quando una perdita si dimezza
      case "food_eaten":
        cues.push({ kind: "sfx", name: event.amount ? "coins" : "shop_buy" });
        cues.push({
          kind: "float",
          at: HERO_ID,
          text: event.amount ? `+${event.amount}` : "Sazio!",
          tone: "gold",
        });
        break;
      case "food_effect":
        cues.push({ kind: "float", at: HERO_ID, text: `+${event.amount}`, tone: "gold" });
        break;
      case "item_bought":
        cues.push({ kind: "sfx", name: "shop_buy" });
        break;
      // Ti vitti: le carte suonano; chi dice "ti vitti" a ragione è contento, chi lo subisce no
      case "tivitti": {
        const stranger = run.table.players.find((p) => !p.hero)?.id;
        const e = event.event;
        if (e.type === "flipped" || e.type === "given" || e.type === "stacked") {
          cues.push({ kind: "sfx", name: "card_flip" });
        }
        if (e.type === "given" && e.seat === 0 && stranger) expressions[stranger] = "suspicious";
        if (e.type === "ti_vitti" && stranger) {
          const heroCaught = e.penalized === 0;
          expressions[stranger] = heroCaught ? "happy" : "sad";
          expressions[HERO_ID] = heroCaught ? "sad" : "happy";
          cues.push({ kind: "flash", tone: heroCaught ? "curse" : "gold" });
          cues.push({ kind: "sfx", name: heroCaught ? "curse" : "santino" });
          if (heroCaught) cues.push({ kind: "shake" });
        }
        break;
      }
      case "tivitti_over":
        cues.push({ kind: "sfx", name: event.won ? "victory" : "lose" });
        break;
    }
  }
  return { cues, expressions };
};
