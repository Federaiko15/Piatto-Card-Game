import {
  CONSUMABLES,
  FOODS,
  HERO_ID,
  SANTINI,
  TABLE_MODIFIERS,
  type RunEvent,
  type RunState,
} from "@piatto/game-core";

export type NoticeTone = "info" | "gold" | "curse" | "santino";

export interface Notice {
  text: string;
  tone: NoticeTone;
}

// Le scritte sul tavolo che spiegano cosa è appena successo: regole inattese, effetti delle carte,
// santini, malocchi. Il giocatore impara le regole vedendole accadere.
export const noticesFor = (events: RunEvent[], run: RunState): Notice[] => {
  const nameOf = (id: string) =>
    id === HERO_ID ? "Tu" : (run.table.players.find((p) => p.id === id)?.username ?? id);
  const verb = (id: string, hero: string, other: string) => (id === HERO_ID ? hero : other);
  const coins = (amount = 0) => `${amount} ${amount === 1 ? "moneta" : "monete"}`;

  return events.flatMap((event): Notice[] => {
    switch (event.type) {
      case "pot_refilled": {
        const out = event.eliminated.map(nameOf);
        return [
          {
            text: `Piatto vuoto! Tutti rimettono la posta: ora ci sono ${event.amount} monete.${
              out.length ? ` Non può pagare ed esce: ${out.join(", ")}.` : ""
            }`,
            tone: "info",
          },
        ];
      }
      case "card_effect": {
        const who = nameOf(event.playerId);
        switch (event.effect) {
          case "re":
            return [{ text: `Re! ${who} ${verb(event.playerId, "raddoppi", "raddoppia")} la vincita.`, tone: "gold" }];
          case "fante":
            return [
              {
                text: `Fante: ${who} ${verb(event.playerId, "rubi", "ruba")} ${event.amount} a ${nameOf(event.targetId ?? "")}.`,
                tone: "gold",
              },
            ];
          case "cavallo":
            return [{ text: "Cavallo: il prossimo giocatore salta il turno.", tone: "info" }];
          default:
            return [];
        }
      }
      case "santino_triggered": {
        const name = SANTINI[event.santino].name;
        switch (event.santino) {
          case "san_giuseppe":
            return [{ text: `${name}: il 5 vince!`, tone: "santino" }];
          case "corno_rosso":
            return [{ text: `${name}: ti restituisce ${coins(event.amount)}.`, tone: "santino" }];
          case "santa_rosalia":
            return [{ text: `${name}: vincita doppia, +${coins(event.amount)}.`, tone: "santino" }];
          case "fico_d_india":
            return [{ text: `${name}: esce un bastoni, +1 moneta.`, tone: "santino" }];
          case "pupo_di_orlando":
            return [{ text: `${name}: la figura vale doppio!`, tone: "santino" }];
          case "patto":
            return [{ text: `${name}: perdi solo metà, risparmi ${coins(event.amount)}.`, tone: "santino" }];
          case "sant_agata":
            return [{ text: `${name}: il 4 vince!`, tone: "santino" }];
          case "testa_di_moro":
            return [{ text: `${name}: le coppe vincono!`, tone: "santino" }];
          case "trinacria":
            return [{ text: `${name}: la prima carta bassa del tavolo vince!`, tone: "santino" }];
          case "carretto_siciliano":
            return [{ text: `${name}: esce un denari, +1 moneta.`, tone: "santino" }];
          case "paladino_rinaldo":
            return [{ text: `${name}: il fante ruba ${coins(event.amount)}.`, tone: "santino" }];
          case "corona_di_ruggero":
            return [{ text: `${name}: il banco ti paga +${coins(event.amount)}.`, tone: "santino" }];
          default:
            return [];
        }
      }
      case "modifier_triggered": {
        const name = TABLE_MODIFIERS[event.modifier].name;
        switch (event.modifier) {
          case "sei_storto":
            return [{ text: `${name}: il 6 perde!`, tone: "curse" }];
          case "malocchio":
            return [{ text: `${name}! Il 7 di spade perde.`, tone: "curse" }];
          case "finanza":
            return [{ text: `${name}: ti porta via ${coins(event.amount)}.`, tone: "curse" }];
          default:
            return [];
        }
      }
      case "blessing_chosen":
        return [{ text: `La nonna ti ha dato ${SANTINI[event.santino].name}.`, tone: "santino" }];
      case "food_eaten":
        return [
          event.food === "mpanata"
            ? { text: `${FOODS.mpanata.name}: +${coins(event.amount)}. Ora sì che si ragiona.`, tone: "gold" }
            : { text: `${FOODS[event.food].name}: sei sazio, le perdite si dimezzano per qualche turno.`, tone: "gold" },
        ];
      case "food_effect":
        return [{ text: `${FOODS[event.food].name}: perdi solo metà, risparmi ${coins(event.amount)}.`, tone: "gold" }];
      case "consumable_used":
        return [{ text: `Hai usato ${CONSUMABLES[event.item].name}.`, tone: "info" }];
      default:
        return [];
    }
  });
};
