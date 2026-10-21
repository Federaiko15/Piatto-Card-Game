// Generatore casuale con seed (mulberry32): a parità di seed produce sempre la stessa sequenza,
// così una partita si può riprodurre (sfida del giorno, bug da ricreare, test).
export type Rng = () => number;

export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomSeed = (): number => Math.floor(Math.random() * 4294967296);
