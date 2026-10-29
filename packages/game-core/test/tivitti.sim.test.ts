import { it } from "vitest";
import {
  applyTiVittiAction,
  createRng,
  createTiVitti,
  mandatoryMove,
  tiVittiBotAction,
  type Rng,
  type TiVittiAction,
  type TiVittiState,
} from "../src/index.js";

// Simulatore di Ti vitti: l'eroe contro l'incappucciato, con diverse distrazioni dell'uno e dell'altro.
// Non parte con `npm test`; si lancia con `SIMULATE=1 npx vitest run tivitti.sim`

const GAMES = 4000;

// L'eroe: salta una mossa obbligata con probabilità `slips` e si accorge degli errori dell'incappucciato
// con probabilità `notices`
const heroAction = (state: TiVittiState, rng: Rng, slips: number, notices: number): TiVittiAction | null => {
  if (state.mistake === 1 && rng() < notices) return { type: "ti_vitti" };
  if (state.turn !== 0) return null;
  const required = mandatoryMove(state);
  if (required && rng() >= slips) return required;
  return state.flipped ? { type: "keep" } : { type: "flip" };
};

const play = (seed: number, carelessness: number, slips: number, notices: number) => {
  let state = createTiVitti(seed);
  const rng = createRng(seed * 7919);
  let tiVitti = 0;
  let heroFlips = 0;
  // l'eroe decide una volta per errore dell'incappucciato se se n'è accorto
  let judged = false;
  while (state.winner === null) {
    let action: TiVittiAction | null = null;
    let seat: 0 | 1 = state.turn;
    if (state.mistake === 1 && !judged) {
      judged = true;
      const call = heroAction(state, rng, slips, notices);
      if (call?.type === "ti_vitti") [action, seat] = [call, 0];
    }
    if (!action) {
      action = state.turn === 0 ? heroAction({ ...state, mistake: null }, rng, slips, notices) : tiVittiBotAction(state, 1, rng, carelessness);
      seat = state.turn;
    }
    if (state.mistake === 0) [action, seat] = [{ type: "ti_vitti" }, 1];
    if (!action) throw new Error("nessuna mossa");
    if (action.type === "flip" && seat === 0) heroFlips++;
    const result = applyTiVittiAction(state, seat, action);
    if (!result.ok) throw new Error(result.error);
    if (action.type === "ti_vitti") tiVitti++;
    if (state.mistake !== 1) judged = false;
    state = result.state;
  }
  return { won: state.winner === 0, turns: state.turns, tiVitti, heroFlips, limit: state.turns >= 400 };
};

it.runIf(process.env.SIMULATE)("ti vitti contro l'incappucciato", () => {
  const rows: string[] = [];
  for (const carelessness of [0, 1 / 10, 1 / 6, 1 / 4]) {
    for (const [hero, slips, notices] of [
      ["perfetto", 0, 1],
      ["attento", 0.05, 0.8],
      ["distratto", 0.2, 0.5],
    ] as const) {
      let won = 0;
      let turns = 0;
      let calls = 0;
      let flips = 0;
      let limit = 0;
      for (let seed = 1; seed <= GAMES; seed++) {
        const r = play(seed, carelessness, slips, notices);
        won += r.won ? 1 : 0;
        turns += r.turns;
        calls += r.tiVitti;
        flips += r.heroFlips;
        limit += r.limit ? 1 : 0;
      }
      rows.push(
        `incappucciato distratto ${(carelessness * 100).toFixed(0).padStart(2)}% | eroe ${hero.padEnd(9)} | ` +
          `vinte ${((won / GAMES) * 100).toFixed(1).padStart(5)}% | turni ${(turns / GAMES).toFixed(0).padStart(3)} | ` +
          `carte girate dall'eroe ${(flips / GAMES).toFixed(0).padStart(3)} | ti vitti ${(calls / GAMES).toFixed(1)} | ` +
          `al limite ${((limit / GAMES) * 100).toFixed(1)}%`,
      );
    }
  }
  console.log(rows.join("\n"));
}, 600_000);
