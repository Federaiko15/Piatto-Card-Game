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
  | { kind: "santino"; id: SantinoId }
  | { kind: "sfx"; name: SfxName };

export interface SceneDirection {
  cues: SceneCue[];
  expressions: Record<string, Expression>;
}

export const BIG_WIN = 20;

export const directScene = (events: RunEvent[], run: RunState): SceneDirection => {
  const cues: SceneCue[] = [];
  const expressions: Record<string, Expression> = {};
  const others = (id: string) => run.table.players.filter((p) => p.id !== id && p.status === "playing");

  for (const event of events) {
    switch (event.type) {
      case "card_drawn": {
        const delta = run.lastDraw?.playerId === event.playerId ? run.lastDraw.delta : 0;
        cues.push({ kind: "sfx", name: "card_flip" });
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
        } else {
          cues.push({ kind: "sfx", name: event.outcome === "win" ? "win" : "lose" });
        }
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
      case "santino_triggered":
        cues.push({ kind: "santino", id: event.santino });
        cues.push({ kind: "sfx", name: "santino" });
        break;
      case "modifier_triggered":
        cues.push({ kind: "flash", tone: "curse" });
        cues.push({ kind: "sfx", name: "curse" });
        break;
      case "player_eliminated":
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
      case "item_bought":
        cues.push({ kind: "sfx", name: "shop_buy" });
        break;
    }
  }
  return { cues, expressions };
};
