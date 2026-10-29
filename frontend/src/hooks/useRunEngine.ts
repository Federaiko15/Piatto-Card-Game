import { useCallback, useEffect, useReducer } from "react";
import {
  applyRunAction,
  createRun,
  randomSeed,
  type ConsumableId,
  type FoodId,
  type RunAction,
  type RunEvent,
  type RunState,
  type TiVittiAction,
} from "@piatto/game-core";
import { clearRun, loadRun, saveRun } from "../services/runStorage";
import { EDITION } from "../edition";

const BOT_DELAY = 1300;
const BOT_DELAY_AFTER_NOTICE = 2400; // dopo un avviso (piatto rimesso, santino) lasciamo il tempo di leggerlo
// a Ti vitti l'incappucciato gioca più svelto: le sue mosse sono tante e piccole. Dopo un "ti vitti" si aspetta
// che la scritta si legga
const TIVITTI_DELAY = 750;
const TIVITTI_CALL_DELAY = 650; // il tempo che ci mette ad accorgersi di un errore dell'eroe
const TIVITTI_DELAY_AFTER_GIVE = 1100; // dopo aver dato una carta all'eroe: il tempo di vederla arrivare
const NOTICE_EVENTS = new Set<RunEvent["type"]>([
  "pot_refilled",
  "santino_triggered",
  "card_effect",
  "modifier_triggered",
]);

interface EngineState {
  run: RunState | null;
  events: RunEvent[]; // gli eventi dell'ultima mossa, per animazioni e avvisi
  moveId: number; // cresce a ogni mossa: serve come key per far ripartire le animazioni
}

type EngineAction =
  | { type: "start"; seed: number; heroName: string }
  | { type: "act"; action: RunAction };

// Le regole stanno in game-core: il reducer applica solo le azioni e tiene gli eventi dell'ultima mossa
const reducer = (state: EngineState, action: EngineAction): EngineState => {
  if (action.type === "start") {
    return {
      run: createRun(action.seed, action.heroName, EDITION, { blessing: true }),
      events: [],
      moveId: state.moveId + 1,
    };
  }
  if (!state.run) return state;
  const result = applyRunAction(state.run, action.action);
  if (!result.ok) return state;
  return { run: result.run, events: result.events, moveId: state.moveId + 1 };
};

// paused: gli avversari aspettano (per esempio mentre il giocatore legge le regole)
export function useRunEngine(paused = false) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    run: loadRun(),
    events: [],
    moveId: 0,
  }));
  const { run, events } = state;

  // dopo ogni mossa la run viene salvata; una run finita non si può più continuare
  useEffect(() => {
    if (!run) return;
    if (run.phase === "won" || run.phase === "lost") clearRun();
    else saveRun(run);
  }, [run]);

  // gli avversari giocano da soli, con una pausa per far vedere la carta
  useEffect(() => {
    if (!run || run.phase !== "table" || paused || run.tivitti) return;
    const current = run.table.players[run.table.currentTurn];
    if (!current || current.hero) return;

    const delay = events.some((e) => NOTICE_EVENTS.has(e.type))
      ? BOT_DELAY_AFTER_NOTICE
      : BOT_DELAY;
    const timer = window.setTimeout(
      () => dispatch({ type: "act", action: { type: "bot_turn" } }),
      delay,
    );
    return () => window.clearTimeout(timer);
  }, [run, events, paused]);

  // a Ti vitti l'incappucciato fa le sue mosse e dice "ti vitti" all'eroe quando sbaglia
  useEffect(() => {
    const game = run?.phase === "table" ? run.tivitti : null;
    if (!game || game.winner !== null || paused) return;
    if (game.turn !== 1 && game.mistake !== 0) return;
    const called = events.some((e) => e.type === "tivitti" && e.event.type === "ti_vitti");
    const gave = events.some((e) => e.type === "tivitti" && e.event.type === "given" && e.event.seat === 1);
    const delay = called
      ? BOT_DELAY_AFTER_NOTICE
      : game.mistake === 0
        ? TIVITTI_CALL_DELAY
        : gave
          ? TIVITTI_DELAY_AFTER_GIVE
          : TIVITTI_DELAY;
    const timer = window.setTimeout(() => dispatch({ type: "act", action: { type: "tivitti_bot" } }), delay);
    return () => window.clearTimeout(timer);
  }, [run, events, paused]);

  const play = useCallback((amount: number) => {
    dispatch({ type: "act", action: { type: "play", amount } });
  }, []);

  const act = useCallback((action: RunAction) => dispatch({ type: "act", action }), []);
  const nextTable = useCallback(() => act({ type: "next_table" }), [act]);
  const enterShop = useCallback(() => act({ type: "enter_shop" }), [act]);
  const buy = useCallback((index: number, replace?: number) => act({ type: "buy", index, replace }), [act]);
  const reroll = useCallback(() => act({ type: "reroll" }), [act]);
  const peek = useCallback(() => act({ type: "peek" }), [act]);
  const consume = useCallback((item: ConsumableId) => act({ type: "use", item }), [act]);
  const eat = useCallback((food: FoodId) => act({ type: "eat", food }), [act]);
  const tivitti = useCallback((move: TiVittiAction) => act({ type: "tivitti", move }), [act]);
  const chooseBlessing = useCallback((index: number) => act({ type: "choose_blessing", index }), [act]);
  const chooseReward = useCallback(
    (reward: "coins" | "santino", replace?: number) => act({ type: "choose_reward", reward, replace }),
    [act],
  );

  const startNewRun = useCallback((heroName: string) => {
    dispatch({ type: "start", seed: randomSeed(), heroName });
  }, []);

  return {
    run,
    events,
    moveId: state.moveId,
    play,
    nextTable,
    enterShop,
    buy,
    reroll,
    peek,
    consume,
    eat,
    chooseBlessing,
    chooseReward,
    tivitti,
    startNewRun,
  };
}
