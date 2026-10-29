import { MAX_SWAPS, MPANATA_MIN, MPURNATU_TURNS, STRANGER_COINS } from "@piatto/game-core";
import type { Text } from "./it";

// I testi in inglese: stesse voci del dizionario italiano. I nomi siciliani restano in siciliano
// (sono l'identità del gioco), l'effetto spiega cosa fanno; le parole comuni si traducono.

const coins = (n = 0) => (n === 1 ? "1 coin" : `${n} coins`);

export const en: Text = {
  lang: "English",
  coins,

  modes: {
    subtitle: "Choose how you want to play",
    soon: "Coming soon",
    legal: "Legal notes & Privacy",
    roguelike: {
      title: "A Night at the Osteria",
      description:
        "Piatto with new, more dynamic rules than the original game: four tables in one night, holy cards that bend the rules, a shop and a final boss. Reach every table's quota to make it to dawn.",
      tag: "Single player · New rules",
    },
    offline: {
      title: "Classic vs Bots",
      description: "The traditional rules against computer opponents. Works offline too.",
      tag: "No account",
    },
    online: {
      title: "Classic Online",
      description: "Create a lobby or join a friend's and challenge other players in real time.",
      tag: "Account required",
    },
  },

  menu: {
    title: "A Night at the Osteria",
    subtitle: (tables: number) => `${tables} tables, one night to make your fortune`,
    nightLabel: "Tonight's tables",
    continue: "Continue the night",
    inShop: "In the shop",
    inBlessing: "Nonna's holy card",
    atTable: (index: number, total: number) => `Table ${index}/${total}`,
    nameLabel: "Your name",
    defaultName: "Player",
    newNight: "New night",
    confirmNew: "Sure? Your saved night will be lost",
    howToPlay: "How to play",
    otherModes: "← Choose another mode",
    language: "Language",
    rules: [
      "You face the tables one after another: the coins you keep come with you to the next table.",
      "Draw a card from 1 to 5 and your bet goes into the pot; from 6 to 10 and you take it from the pot.",
      "Each table plays a single deck: cards that come out never come back.",
      "If the pot runs dry everyone pays the ante again; when the deck runs out, what's left is split.",
      "Every table has a quota: you must end with at least that many coins, or the night is over.",
      "Face cards have an effect, for everyone: the Jack steals a coin, the Knight skips a turn, the King doubles the win.",
      "Between tables you visit the shop: holy cards, items and food help you, but they cost coins you won't have at the table.",
    ],
  },

  tables: {
    bar: "The Piazza Bar",
    bisca: "The Back-Room Gambling Den",
    cantina: "The Cellar",
    prete: "The Priest's Table",
  },

  characters: {
    zio_turi: { name: "Zio Turi", tagline: "Old uncle Turi always bets small." },
    picciotto: { name: "Il Picciotto", tagline: "The young tough often bets the whole pot." },
    zingara: { name: "'A Zingara", tagline: "The fortune-teller counts the cards." },
    ragioniere: { name: "The Accountant", tagline: "Bets 10% of his balance." },
    prete: { name: "The Priest", tagline: "At his table, no betting the whole pot." },
    incappucciato: { name: "The Hooded Man", tagline: "Nobody knows who he is. Beat him and he pays." },
  },
  you: "You",

  seeds: { denari: "Coins", coppe: "Cups", spade: "Swords", bastoni: "Clubs" },
  cards: {
    back: "Card back",
    front: (value: number, seed: string) => `${value} of ${seed}`,
  },

  rarity: { comune: "common", raro: "rare", leggendario: "legendary" },
  tagConsumable: "item",
  tagFood: "food",
  modifierKinds: { boss: "boss", malocchio: "curse", evento: "event" },

  santini: {
    san_giuseppe: { name: "San Giuseppe", effect: "When you draw a 5 you win instead of losing." },
    corno_rosso: { name: "Red Horn", effect: "Your first lost bet at each table is given back." },
    coppola_del_nonno: {
      name: "Grandpa's Coppola",
      effect: "Once per table, on your turn, you can peek at the next card.",
    },
    memoria_di_ferro: { name: "Iron Memory", effect: "See the last 5 cards played at the table." },
    santa_rosalia: { name: "Santa Rosalia", effect: "After 3 lost bets in a row, your next win pays double." },
    fico_d_india: { name: "Prickly Pear", effect: "+1 coin for every Clubs card drawn, by anyone." },
    sant_antonio: {
      name: "Sant'Antonio",
      effect: "You never pay the ante: not when you sit down, not when the pot runs dry.",
    },
    salvadanaio: {
      name: "Piggy Bank",
      effect: "For each table you clear, earn 1 coin for every 10 you have (max 5).",
    },
    pupo_di_orlando: {
      name: "Orlando's Puppet",
      effect:
        "When you draw a face card its effect counts double: the Jack steals 2, the Knight skips 2 players, the King pays triple instead of double.",
    },
    patto: { name: "The Pact", effect: "When you lose a bet you only lose half of it." },
    corona_di_ruggero: {
      name: "King Roger's Crown",
      effect: "When you win with a face card the bank pays you one extra bet: Jack and Knight pay double, the King triple.",
    },
    sant_agata: { name: "Sant'Agata", effect: "When you draw a 4 you win instead of losing." },
    carretto_siciliano: {
      name: "Sicilian Cart",
      effect: "+1 coin for every Coins card drawn, by anyone.",
    },
    paladino_rinaldo: { name: "Paladin Rinaldo", effect: "When you draw a Jack it steals 3 coins instead of 1." },
    testa_di_moro: { name: "Testa di Moro", effect: "Cups cards you draw always win." },
    trinacria: { name: "Trinacria", effect: "At each table, the first card from 1 to 5 you draw wins." },
  },

  consumables: {
    brucia: { name: "Burn", effect: "Discard the top card of the deck without looking at it." },
    passo: { name: "Pass", effect: "Skip your turn without betting." },
    mischia: { name: "Shuffle", effect: "Reshuffle the cards left in the deck." },
  },

  foods: {
    mpanata: {
      name: "'Mpanata",
      effect: `Spinach-stuffed bread from Campobello di Licata. Gives you half the coins you're missing to the quota (at least ${MPANATA_MIN}).`,
    },
    mpurnatu: {
      name: "'Mpurnatu",
      effect: `Campobello's baked pasta: a heavy dish that keeps you going. For your next ${MPURNATU_TURNS} turns, if you lose you only lose half your bet.`,
    },
  },

  modifiers: {
    niente_piatto: {
      name: "No Full Pot",
      effect: "At the Priest's table nobody can bet more than half the pot.",
    },
    sei_storto: { name: "The Crooked 6", effect: "At this table 6s lose." },
    malocchio: { name: "Evil Eye", effect: "The 7 of Swords brings bad luck: whoever draws it loses the bet." },
    finanza: { name: "Tax Police", effect: "When you sit down you lose 10% of your coins." },
    festa_del_patrono: {
      name: "Patron Saint's Feast",
      effect: "At this table every win pays 1 extra coin, for everyone.",
    },
  },

  figures: {
    fante: { name: "Jack (8)", effect: "steals 1 coin from the richest opponent" },
    cavallo: { name: "Knight (9)", effect: "the next player skips a turn" },
    re: { name: "King (10)", effect: "doubles the win" },
  },

  bet: {
    quick: "Quick bets",
    min: "Min",
    half: "Half",
    max: "Max",
    pot: "Pot",
    all: "All",
    decrease: "Lower the bet",
    increase: "Raise the bet",
    amount: "Bet",
    confirm: (bet: number) => `Bet ${bet} and draw`,
    hint: (max: number, limit: string) => `Max ${max} (${limit})`,
    limitPot: "the pot",
    limitBalance: "your balance",
  },

  panel: {
    label: "Your game",
    menu: "Menu",
    menuTitle: "Your night stays saved",
    help: "Rules, face cards and holy cards",
    tableOf: (index: number, total: number) => `Table ${index} of ${total}`,
    boss: " · boss",
    status: (balance: number, quota: number) => `Your coins: ${balance}, quota ${quota}`,
    quota: "Quota",
    betLabel: "Your bet",
    halfPotLimit: "half the pot, the Priest's rule",
    waiting: (name: string) => `${name}'s turn…`,
    closed: "Table closed",
  },

  fortune: {
    label: "Your fortune",
    santini: (n: number, max: number) => `Holy cards ${n}/${max}`,
    spent: "Used at this table: works again at the next one.",
    pocket: (n: number, max: number) => `Pocket ${n}/${max}`,
    peek: "Peek",
    peeked: "Already peeked",
    basket: (n: number, max: number) => `Basket ${n}/${max}`,
    memory: "Last cards",
  },

  scene: {
    opponents: "Opponents",
    out: "out",
    deck: (n: number) => `${n} cards in the deck`,
    deckCount: (n: number) => (n === 1 ? "last card" : `${n} cards`),
    firstCard: "the first card",
    peekedTitle: "The next card, seen with Grandpa's Coppola",
    next: "next",
    pot: (n: number) => `Pot: ${coins(n)}`,
  },

  shop: {
    between: "Between tables",
    title: "The Shop",
    purse: "Your coins",
    sold: "Sold",
    noCoins: "Not enough coins",
    santiniFull: "Holy cards full",
    pocketFull: "Pocket full",
    basketFull: "Basket full",
    buy: "Buy",
    swap: "Swap",
    swapTitle: (left: number) => `Give up one of your holy cards (swaps left: ${left})`,
    next: "Next table",
    tableDetail: (ante: number, quota: number, opponents: string) =>
      `Ante ${ante} · Quota ${quota} · At the table: ${opponents}`,
    quiet: "This table is quiet tonight.",
    belowQuota: (n: number) => `You sit down below the quota: you'll need to win at least ${coins(n)}.`,
    reroll: "Reroll the shop",
    rerollPrice: (n: number) => coins(n),
    sit: "Sit at the table",
    sitDetail: (s: number, sMax: number, swaps: number, c: number, cMax: number, f: number, fMax: number) =>
      `Holy cards ${s}/${sMax} · Swaps ${swaps} · Pocket ${c}/${cMax} · Basket ${f}/${fMax}`,
  },

  blessing: {
    before: "Before leaving home",
    title: "Nonna's holy card",
    intro: "\"Pigghia, ca stanotti ti servi.\" (Take it, you'll need it tonight.) Pick one: it stays with you all night.",
    take: "Take it",
    first: "First table",
  },

  swap: {
    title: "Which holy card do you give up?",
    intro: (name: string, left: number) =>
      `To take ${name} you must give one up. Swaps left tonight: ${left} of ${MAX_SWAPS}.`,
    keep: "Keep them all",
  },

  end: {
    opponentsOut: "You left every opponent without a coin!",
    deckEmpty: "The deck is finished.",
    potCollected: (n: number) => `The pot is yours: +${coins(n)}.`,
    potSplit: (n: number) => `The rest of the pot is split: ${coins(n)} each.`,
    interest: (n: number) => `Piggy Bank: +${coins(n)} of interest.`,
    cleared: "Table cleared!",
    won: "You broke the osteria's bank!",
    lost: "The night ends here",
    leaveWith: "You leave with",
    closeWith: "You end the night with",
    quotaNote: (q: number) => ` (quota ${q})`,
    bankrupt: "You ran out of coins.",
    belowQuota: (b: number, q: number) => `You leave with ${coins(b)}, but the quota was ${q}.`,
    track: (done: number, total: number) => `Tables cleared: ${done} of ${total}`,
    enterShop: "Enter the shop",
    enterShopDetail: "Holy cards, items and food before the next table",
    newNight: "New night",
    menu: "Menu",
    strangerIntro: "The Hooded Man barely lifts his head:",
    strangerLine: "\"You played well. Choose.\"",
    rewardCoins: `+${STRANGER_COINS}`,
    rewardCoinsDetail: "Coins to spend in the shop",
    rewardSwap: (effect: string) => `Swap: ${effect}`,
  },

  help: {
    title: "How to play",
    leadStart: "Bet and draw: with a card from ",
    low: "1 to 5",
    leadMiddle: " your bet goes into the pot, from ",
    high: "6 to 10",
    leadEnd: " you take it from the pot. Jack, Knight and King also have an effect, for everyone at the table.",
    tableRules: "This table's rules",
    yourSantini: "Your holy cards",
    back: "Back to the table",
  },

  notices: {
    potRefilled: (n: number) => `The pot is empty! Everyone pays the ante again: now it holds ${coins(n)}.`,
    eliminated: (names: string) => ` Can't pay and leaves: ${names}.`,
    re: (who: string, hero: boolean) => `King! ${who} ${hero ? "double" : "doubles"} the win.`,
    fante: (who: string, hero: boolean, n: number, victim: string) =>
      `Jack: ${who} ${hero ? "steal" : "steals"} ${n} from ${victim}.`,
    cavallo: "Knight: the next player skips a turn.",
    santino: {
      san_giuseppe: () => "the 5 wins!",
      corno_rosso: (n: number) => `gives you back ${coins(n)}.`,
      santa_rosalia: (n: number) => `double win, +${coins(n)}.`,
      fico_d_india: () => "a Clubs card, +1 coin.",
      pupo_di_orlando: () => "the face card counts double!",
      patto: (n: number) => `you only lose half, you save ${coins(n)}.`,
      corona_di_ruggero: (n: number) => `the bank pays you +${coins(n)}.`,
      sant_agata: () => "the 4 wins!",
      testa_di_moro: () => "Cups win!",
      trinacria: () => "the table's first low card wins!",
      carretto_siciliano: () => "a Coins card, +1 coin.",
      paladino_rinaldo: (n: number) => `the Jack steals ${coins(n)}.`,
    },
    sixLoses: "the 6 loses!",
    evilEye: "The 7 of Swords loses.",
    finanza: (n: number) => `takes away ${coins(n)}.`,
    blessing: (name: string) => `Nonna gave you ${name}.`,
    mpanata: (name: string, n: number) => `${name}: +${coins(n)}. Now we're talking.`,
    mpurnatu: (name: string) => `${name}: you're full, losses are halved for a few turns.`,
    foodSaved: (name: string, n: number) => `${name}: you only lose half, you save ${coins(n)}.`,
    used: (name: string) => `You used ${name}.`,
  },

  // ---------- Ti vitti, in the cellar with the Hooded Man ----------
  tivitti: {
    title: "Ti vitti",
    subtitle: "No betting in the cellar: you play Ti vitti (\"I saw you\")",
    shopDetail: (name: string) => `You play Ti vitti with ${name}: no ante, no quota.`,
    yourDeck: "Your deck",
    hisDeck: (name: string) => `${name}'s deck`,
    yourPile: "Your pile",
    hisPile: (name: string) => `${name}'s pile`,
    stacks: "The runs",
    count: (n: number) => (n === 1 ? "1 card" : `${n} cards`),
    yourTurnFlip: "Your turn: click your deck to flip a card.",
    yourTurnPlace: "Drag the card: onto your opponent's pile, onto a run or onto your own pile.",
    hisTurn: (name: string) => `${name}'s turn…`,
    call: "Ti vitti!",
    callTitle: "If your opponent skipped a forced move, they flip 3 cards. If you're wrong, you flip them.",
    rules: [
      "A card goes onto your opponent's pile if it is exactly 1 higher than its top card (a 5 on a 4; the King doesn't go on the Ace).",
      "Aces start the runs in the middle: the next card of the same suit goes on top.",
      "It cascades: every time you free a card, check again. The top of your own pile can go onto your opponent or onto a run, and so can the card that shows up underneath, and the one after that. Flip the next card only when you can't move anything else.",
      "At the start of your turn too, before flipping: if the top of your pile fits on the card your opponent just put down, move it.",
      "If the card fits nowhere, put it on your own pile and the turn passes.",
      "Moves are forced: skip one and you hear \"ti vitti\", and you flip 3 cards.",
      "When your deck runs out, your pile is turned over. Whoever runs out of cards wins.",
    ],
    stakes: "Win and you choose the Hooded Man's prize. Lose and he takes a random holy card (or 15 coins).",
    noticeCalledOnYou: (name: string) => `"Ti vitti!" ${name} saw you: you flip 3 cards.`,
    noticeYouCalled: (name: string) => `"Ti vitti!" You caught ${name}: he flips 3 cards.`,
    noticeFalseCall: "A wrong \"ti vitti\": you flip the 3 cards yourself.",
    noticeTurnedOver: (who: string) => `${who}: deck finished, the pile is turned over.`,
    endWon: "You beat the Hooded Man at Ti vitti!",
    endLost: "The Hooded Man won at Ti vitti",
    stolenSantino: (name: string) => `He reaches out and takes one of your holy cards: ${name}.`,
    stolenCoins: (n: number) => `You have no holy cards: he takes ${coins(n)}.`,
    stolenNothing: "You have nothing to give him. He lets you go.",
  },
};
