import { HERO_ID, type RunEvent, type RunState } from "@piatto/game-core";
import { characterText, type Text } from "../../i18n";

export type NoticeTone = "info" | "gold" | "curse" | "santino";

export interface Notice {
  text: string;
  tone: NoticeTone;
}

// Le scritte sul tavolo che spiegano cosa è appena successo: regole inattese, effetti delle carte,
// santini, malocchi. Il giocatore impara le regole vedendole accadere.
export const noticesFor = (events: RunEvent[], run: RunState, t: Text): Notice[] => {
  const nameOf = (id: string) => {
    if (id === HERO_ID) return t.you;
    const player = run.table.players.find((p) => p.id === id);
    return player ? characterText(t, player.character).name : id;
  };

  return events.flatMap((event): Notice[] => {
    switch (event.type) {
      case "pot_refilled": {
        const out = event.eliminated.map(nameOf);
        return [
          {
            text: t.notices.potRefilled(event.amount) + (out.length ? t.notices.eliminated(out.join(", ")) : ""),
            tone: "info",
          },
        ];
      }
      case "card_effect": {
        const who = nameOf(event.playerId);
        const hero = event.playerId === HERO_ID;
        switch (event.effect) {
          case "re":
            return [{ text: t.notices.re(who, hero), tone: "gold" }];
          case "fante":
            return [
              {
                text: t.notices.fante(who, hero, event.amount ?? 0, nameOf(event.targetId ?? "")),
                tone: "gold",
              },
            ];
          case "cavallo":
            return [{ text: t.notices.cavallo, tone: "info" }];
          default:
            return [];
        }
      }
      case "santino_triggered": {
        const line = t.notices.santino[event.santino as keyof Text["notices"]["santino"]];
        return line
          ? [{ text: `${t.santini[event.santino].name}: ${line(event.amount ?? 0)}`, tone: "santino" }]
          : [];
      }
      case "modifier_triggered": {
        const name = t.modifiers[event.modifier].name;
        switch (event.modifier) {
          case "sei_storto":
            return [{ text: `${name}: ${t.notices.sixLoses}`, tone: "curse" }];
          case "malocchio":
            return [{ text: `${name}! ${t.notices.evilEye}`, tone: "curse" }];
          case "finanza":
            return [{ text: `${name}: ${t.notices.finanza(event.amount ?? 0)}`, tone: "curse" }];
          default:
            return [];
        }
      }
      case "blessing_chosen":
        return [{ text: t.notices.blessing(t.santini[event.santino].name), tone: "santino" }];
      case "food_eaten": {
        const name = t.foods[event.food].name;
        return [
          event.food === "mpanata"
            ? { text: t.notices.mpanata(name, event.amount ?? 0), tone: "gold" }
            : { text: t.notices.mpurnatu(name), tone: "gold" },
        ];
      }
      case "food_effect":
        return [{ text: t.notices.foodSaved(t.foods[event.food].name, event.amount), tone: "gold" }];
      case "consumable_used":
        return [{ text: t.notices.used(t.consumables[event.item].name), tone: "info" }];
      // a Ti vitti si scrive solo quello che il giocatore deve sapere: le mosse sbagliate restano nascoste
      // finché qualcuno non dice "ti vitti"
      case "tivitti": {
        const stranger = run.table.players.find((p) => !p.hero);
        const name = stranger ? characterText(t, stranger.character).name : "";
        const e = event.event;
        if (e.type === "ti_vitti") {
          if (e.penalized === e.seat) return [{ text: t.tivitti.noticeFalseCall, tone: "curse" }];
          return e.penalized === 0
            ? [{ text: t.tivitti.noticeCalledOnYou(name), tone: "curse" }]
            : [{ text: t.tivitti.noticeYouCalled(name), tone: "gold" }];
        }
        if (e.type === "turned_over") return [{ text: t.tivitti.noticeTurnedOver(e.seat === 0 ? t.you : name), tone: "info" }];
        return [];
      }
      default:
        return [];
    }
  });
};
