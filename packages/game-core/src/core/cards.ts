export const SEEDS = ["denari", "bastoni", "spade", "coppe"] as const;

export type Seed = (typeof SEEDS)[number];

export interface Card {
  seed: Seed;
  value: number; // da 1 a 10: 8 fante, 9 cavallo, 10 re
}
