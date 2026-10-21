import { it } from "vitest";
import {
  RUN_TABLES,
  applyRunAction,
  botBet,
  cardCount,
  createRng,
  createRun,
  getHero,
  maxHeroBet,
  type RunState,
} from "../src/index.js";

// Simulatore di bilanciamento: gioca migliaia di run con strategie diverse e stampa le percentuali di vittoria.
// Non parte con `npm test`; si lancia con `npm run simulate`. Le quote da provare si passano con
// QUOTAS='[[100,105,115],[95,100,110]]' npm run simulate

type Strategy = (run: RunState, rng: () => number) => number;

const STRATEGIES: Record<string, Strategy> = {
  // punta sempre il 10% del saldo, senza guardare il mazzo
  dieci_percento: (run) => Math.max(1, Math.floor(getHero(run).balance * 0.1)),
  // la stessa logica del bot Calcolatore
  calcolatore: (run, rng) =>
    botBet("Calcolatore", getHero(run).balance, run.table.piatto, cardCount(run.table.deck), rng),
  // conta le carte e punta forte solo quando restano molte carte alte
  conta_carte: (run) => {
    const count = cardCount(run.table.deck);
    const max = maxHeroBet(run);
    if (count <= -3) return max;
    if (count <= -1) return Math.ceil(max / 3);
    return 1;
  },
  // va sempre a "Piatto"
  sempre_piatto: (run) => maxHeroBet(run),
};

const RUNS = 4000;
const quotaSets: number[][] = process.env.QUOTAS
  ? JSON.parse(process.env.QUOTAS)
  : [RUN_TABLES.map((t) => t.quota)];

it.runIf(process.env.SIMULATE).each(quotaSets)("quote %j", (...quotas: number[]) => {
  quotas.forEach((quota, i) => ((RUN_TABLES[i] as { quota: number }).quota = quota));

  for (const [name, strategy] of Object.entries(STRATEGIES)) {
    let won = 0;
    const lost: Record<string, number> = {};

    for (let seed = 1; seed <= RUNS; seed++) {
      let run = createRun(seed * 7919, "Eroe");
      const rng = createRng(seed);
      while (run.phase === "table" || run.phase === "table_cleared") {
        const current = run.table.players[run.table.currentTurn];
        const result = applyRunAction(
          run,
          run.phase === "table_cleared"
            ? { type: "next_table" }
            : current.hero
              ? { type: "play", amount: Math.min(strategy(run, rng), maxHeroBet(run)) }
              : { type: "bot_turn" },
        );
        if (!result.ok) throw new Error(`${name}: ${result.error}`);
        run = result.run;
      }
      if (run.phase === "won") won++;
      else {
        const key = `tavolo ${run.tableIndex + 1} (${run.lossReason})`;
        lost[key] = (lost[key] ?? 0) + 1;
      }
    }

    console.log(
      `${name.padEnd(15)} vinte ${((won / RUNS) * 100).toFixed(1)}%  perse:`,
      lost,
    );
  }
});
