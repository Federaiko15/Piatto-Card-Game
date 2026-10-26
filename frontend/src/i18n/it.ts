import {
  MAX_SWAPS,
  MPANATA_MIN,
  MPURNATU_TURNS,
  STRANGER_COINS,
  type CardEffectId,
  type Seed,
  type ConsumableId,
  type FoodId,
  type Rarity,
  type RunTableId,
  type SantinoId,
  type TableModifierId,
} from "@piatto/game-core";

// Tutti i testi della Notte all'Osteria in italiano: è il dizionario di riferimento, quello inglese
// deve avere esattamente le stesse voci (lo controlla TypeScript con il tipo Text).
// I nomi siciliani (santi, specialità, personaggi del paese) restano uguali in ogni lingua.

type Named = { name: string; effect: string };
export type CharacterId = "zio_turi" | "picciotto" | "zingara" | "ragioniere" | "prete" | "incappucciato";

const coins = (n = 0) => (n === 1 ? "1 moneta" : `${n} monete`);

export const it = {
  lang: "Italiano",
  coins,

  // ---------- la scelta della modalità (solo sul sito) ----------
  modes: {
    subtitle: "Scegli come vuoi giocare",
    soon: "In arrivo",
    legal: "Note Legali & Privacy",
    roguelike: {
      title: "Notte all'Osteria",
      description:
        "Piatto con regole nuove, più dinamiche del gioco originale: quattro tavoli in una notte, santini che cambiano le regole, una bottega e un boss finale. Raggiungi la quota di ogni tavolo per arrivare fino in fondo.",
      tag: "Giocatore singolo · Regole nuove",
    },
    offline: {
      title: "Classica contro i Bot",
      description: "Le regole di sempre contro avversari controllati dal computer. Funziona anche senza connessione.",
      tag: "Senza account",
    },
    online: {
      title: "Classica Online",
      description: "Crea una lobby o entra in quella di un amico e sfida altri giocatori in tempo reale.",
      tag: "Serve un account",
    },
  },

  // ---------- il menu della notte ----------
  menu: {
    title: "Notte all'Osteria",
    subtitle: (tables: number) => `${tables} tavoli, una sola notte per fare fortuna`,
    nightLabel: "I tavoli della notte",
    continue: "Continua la notte",
    inShop: "In bottega",
    inBlessing: "Il santino della nonna",
    atTable: (index: number, total: number) => `Tavolo ${index}/${total}`,
    nameLabel: "Il tuo nome",
    defaultName: "Giocatore",
    newNight: "Nuova notte",
    confirmNew: "Sicuro? La notte salvata andrà persa",
    howToPlay: "Come si gioca",
    otherModes: "← Scegli un'altra modalità",
    language: "Lingua",
    rules: [
      "Affronti i tavoli uno dopo l'altro: le monete che ti restano le porti al tavolo successivo.",
      "Con una carta da 1 a 5 la puntata va nel piatto, da 6 a 10 la prendi dal piatto.",
      "A ogni tavolo si gioca un solo mazzo: le carte uscite non tornano più.",
      "Se il piatto si svuota tutti rimettono la posta; quando il mazzo finisce, quello che resta si divide.",
      "Ogni tavolo ha una quota: alla fine devi avere almeno quelle monete, altrimenti la notte è finita.",
      "Le figure hanno un effetto, per tutti: il fante ruba una moneta, il cavallo fa saltare un turno, il re raddoppia la vincita.",
      "Tra un tavolo e l'altro passi dalla bottega: santini, consumabili e cibi ti aiutano, ma costano monete che poi non hai al tavolo.",
    ],
  },

  // ---------- nomi del mondo ----------
  tables: {
    bar: "Il bar della piazza",
    bisca: "La bisca del retrobottega",
    cantina: "La cantina",
    prete: "Il tavolo del Prete",
  } satisfies Record<RunTableId, string>,

  characters: {
    zio_turi: { name: "Zio Turi", tagline: "Punta sempre poco." },
    picciotto: { name: "Il Picciotto", tagline: "Va spesso a Piatto." },
    zingara: { name: "'A Zingara", tagline: "Conta le carte." },
    ragioniere: { name: "Il Ragioniere", tagline: "Punta il 10% del saldo." },
    prete: { name: "Il Prete", tagline: "Al suo tavolo niente Piatto." },
    incappucciato: { name: "L'Incappucciato", tagline: "Nessuno sa chi sia. Se lo batti, paga." },
  } satisfies Record<CharacterId, { name: string; tagline: string }>,
  you: "Tu",

  seeds: { denari: "denari", coppe: "coppe", spade: "spade", bastoni: "bastoni" } satisfies Record<Seed, string>,
  cards: {
    back: "Dorso della carta",
    front: (value: number, seed: string) => `${value} di ${seed}`,
  },

  rarity: { comune: "comune", raro: "raro", leggendario: "leggendario" } satisfies Record<Rarity, string>,
  tagConsumable: "consumabile",
  tagFood: "cibo",
  modifierKinds: { boss: "boss", malocchio: "malocchio", evento: "evento" },

  santini: {
    san_giuseppe: { name: "San Giuseppe", effect: "Quando peschi un 5 vinci invece di perdere." },
    corno_rosso: { name: "Corno rosso", effect: "La tua prima puntata persa a ogni tavolo ti viene restituita." },
    coppola_del_nonno: {
      name: "Coppola del nonno",
      effect: "Una volta per tavolo, nel tuo turno, puoi sbirciare la prossima carta.",
    },
    memoria_di_ferro: { name: "Memoria di ferro", effect: "Vedi le ultime 5 carte uscite al tavolo." },
    santa_rosalia: { name: "Santa Rosalia", effect: "Dopo 3 puntate perse di fila, la prossima vincita paga il doppio." },
    fico_d_india: { name: "Fico d'India", effect: "+1 moneta per ogni carta di bastoni che esce, chiunque la peschi." },
    sant_antonio: {
      name: "Sant'Antonio",
      effect: "Non paghi mai la posta: né quando ti siedi né quando il piatto si svuota.",
    },
    salvadanaio: {
      name: "Salvadanaio",
      effect: "A ogni tavolo superato guadagni 1 moneta ogni 10 che hai (massimo 5).",
    },
    pupo_di_orlando: {
      name: "Pupo di Orlando",
      effect:
        "Quando peschi una figura il suo effetto vale doppio: il fante ruba 2, il cavallo salta 2 giocatori, il re paga il triplo invece del doppio.",
    },
    patto: { name: "Il Patto", effect: "Quando perdi una puntata ne perdi solo metà." },
    corona_di_ruggero: {
      name: "Corona di Re Ruggero",
      effect:
        "Quando vinci con una figura il banco ti paga una puntata in più: fante e cavallo pagano doppio, il re triplo.",
    },
    sant_agata: { name: "Sant'Agata", effect: "Quando peschi un 4 vinci invece di perdere." },
    carretto_siciliano: {
      name: "Carretto siciliano",
      effect: "+1 moneta per ogni carta di denari che esce, chiunque la peschi.",
    },
    paladino_rinaldo: { name: "Paladino Rinaldo", effect: "Il fante che peschi ruba 3 monete invece di 1." },
    testa_di_moro: { name: "Testa di Moro", effect: "Le carte di coppe che peschi vincono sempre." },
    trinacria: { name: "Trinacria", effect: "A ogni tavolo, la prima carta da 1 a 5 che peschi vince." },
  } satisfies Record<SantinoId, Named>,

  consumables: {
    brucia: { name: "Brucia", effect: "Scarta la prima carta del mazzo senza guardarla." },
    passo: { name: "Passo", effect: "Salti il turno senza puntare." },
    mischia: { name: "Mischia", effect: "Rimescola le carte rimaste nel mazzo." },
  } satisfies Record<ConsumableId, Named>,

  foods: {
    mpanata: {
      name: "'Mpanata",
      effect: `Ti dà metà delle monete che ti mancano alla quota (almeno ${MPANATA_MIN}).`,
    },
    mpurnatu: {
      name: "'Mpurnatu",
      effect: `Piatto pesante, ti tiene: nei tuoi prossimi ${MPURNATU_TURNS} turni, se perdi, perdi solo metà puntata.`,
    },
  } satisfies Record<FoodId, Named>,

  modifiers: {
    niente_piatto: {
      name: "Niente Piatto",
      effect: "Al tavolo del Prete nessuno può puntare più di metà del piatto.",
    },
    sei_storto: { name: "Il 6 storto", effect: "A questo tavolo i 6 perdono." },
    malocchio: { name: "Malocchio", effect: "Il 7 di spade porta sfortuna: chi lo pesca perde la puntata." },
    finanza: { name: "Arriva la Finanza", effect: "Quando ti siedi perdi il 10% delle tue monete." },
    festa_del_patrono: {
      name: "Festa del patrono",
      effect: "A questo tavolo ogni vincita paga 1 moneta in più, a tutti.",
    },
  } satisfies Record<TableModifierId, Named>,

  figures: {
    fante: { name: "Fante (8)", effect: "ruba 1 moneta all'avversario più ricco" },
    cavallo: { name: "Cavallo (9)", effect: "il turno salta il prossimo giocatore" },
    re: { name: "Re (10)", effect: "raddoppia la vincita" },
  } satisfies Record<CardEffectId, Named>,

  // ---------- la puntata (anche ai tavoli classici) ----------
  bet: {
    quick: "Puntate rapide",
    min: "Min",
    half: "Metà",
    max: "Max",
    pot: "Piatto",
    all: "Tutto",
    decrease: "Diminuisci la puntata",
    increase: "Aumenta la puntata",
    amount: "Puntata",
    confirm: (bet: number) => `Punta ${bet} e pesca`,
    hint: (max: number, limit: string) => `Massimo ${max} (${limit})`,
    limitPot: "il piatto",
    limitBalance: "il tuo saldo",
  },

  // ---------- il tavolo ----------
  panel: {
    label: "La tua partita",
    menu: "Menu",
    menuTitle: "La notte resta salvata",
    help: "Regole, figure e santini",
    tableOf: (index: number, total: number) => `Tavolo ${index} di ${total}`,
    boss: " · boss",
    status: (balance: number, quota: number) => `Le tue monete: ${balance}, quota ${quota}`,
    quota: "Quota",
    betLabel: "La tua puntata",
    halfPotLimit: "metà del piatto, regola del Prete",
    waiting: (name: string) => `Tocca a ${name}…`,
    closed: "Tavolo chiuso",
  },

  fortune: {
    label: "La tua fortuna",
    santini: (n: number, max: number) => `Santini ${n}/${max}`,
    spent: "Usato a questo tavolo: torna buono al prossimo.",
    pocket: (n: number, max: number) => `In tasca ${n}/${max}`,
    peek: "Sbircia",
    peeked: "Già sbirciato",
    basket: (n: number, max: number) => `Panaru ${n}/${max}`,
    memory: "Ultime uscite",
  },

  scene: {
    opponents: "Avversari",
    out: "fuori",
    deck: (n: number) => `${n} carte nel mazzo`,
    deckCount: (n: number) => (n === 1 ? "ultima carta" : `${n} carte`),
    firstCard: "la prima carta",
    peekedTitle: "La prossima carta, vista con la Coppola del nonno",
    next: "prossima",
    pot: (n: number) => `Piatto: ${coins(n)}`,
  },

  // ---------- la bottega ----------
  shop: {
    between: "Tra un tavolo e l'altro",
    title: "La bottega",
    purse: "Le tue monete",
    sold: "Venduto",
    noCoins: "Monete insufficienti",
    santiniFull: "Santini al completo",
    pocketFull: "Tasche piene",
    basketFull: "Panaru pieno",
    buy: "Compra",
    swap: "Scambia",
    swapTitle: (left: number) => `Lasci uno dei tuoi santini (scambi rimasti: ${left})`,
    next: "Prossimo tavolo",
    tableDetail: (ante: number, quota: number, opponents: string) =>
      `Posta ${ante} · Quota ${quota} · Al tavolo: ${opponents}`,
    quiet: "Stanotte questo tavolo è tranquillo.",
    belowQuota: (n: number) => `Ti siedi sotto la quota: dovrai vincere almeno ${coins(n)}.`,
    reroll: "Rimescola la vetrina",
    rerollPrice: (n: number) => coins(n),
    sit: "Siediti al tavolo",
    sitDetail: (s: number, sMax: number, swaps: number, c: number, cMax: number, f: number, fMax: number) =>
      `Santini ${s}/${sMax} · Scambi ${swaps} · In tasca ${c}/${cMax} · Panaru ${f}/${fMax}`,
  },

  blessing: {
    before: "Prima di uscire di casa",
    title: "Il santino della nonna",
    intro: "\"Pigghia, ca stanotti ti servi.\" Scegline uno: ti accompagna per tutta la notte.",
    take: "Prendilo",
    first: "Primo tavolo",
  },

  swap: {
    title: "Quale santino lasci?",
    intro: (name: string, left: number) =>
      `Per prendere ${name} devi lasciarne uno. Scambi rimasti stanotte: ${left} su ${MAX_SWAPS}.`,
    keep: "Tienili tutti",
  },

  // ---------- fine del tavolo ----------
  end: {
    opponentsOut: "Hai lasciato tutti gli avversari senza monete!",
    deckEmpty: "Il mazzo è finito.",
    potCollected: (n: number) => `Il piatto è tuo: +${coins(n)}.`,
    potSplit: (n: number) => `Il piatto rimasto si divide: ${coins(n)} a testa.`,
    interest: (n: number) => `Salvadanaio: +${coins(n)} di interessi.`,
    cleared: "Tavolo superato!",
    won: "Hai sbancato l'osteria!",
    lost: "La notte finisce qui",
    leaveWith: "Ti alzi con",
    closeWith: "Chiudi la notte con",
    quotaNote: (q: number) => ` (quota ${q})`,
    bankrupt: "Sei rimasto senza monete.",
    belowQuota: (b: number, q: number) => `Ti alzi con ${coins(b)}, ma la quota era ${q}.`,
    track: (done: number, total: number) => `Tavoli superati: ${done} su ${total}`,
    enterShop: "Entra in bottega",
    enterShopDetail: "Santini, consumabili e cibi prima del prossimo tavolo",
    newNight: "Nuova notte",
    menu: "Menu",
    strangerIntro: "L'Incappucciato alza appena la testa:",
    strangerLine: "\"Hai giocato bene. Scegli.\"",
    rewardCoins: `+${STRANGER_COINS}`,
    rewardCoinsDetail: "Monete da spendere in bottega",
    rewardSwap: (effect: string) => `Scambia: ${effect}`,
  },

  help: {
    title: "Come si gioca",
    leadStart: "Punti e peschi: con una carta da ",
    low: "1 a 5",
    leadMiddle: " la puntata va nel piatto, da ",
    high: "6 a 10",
    leadEnd: " la prendi dal piatto. Fante, cavallo e re hanno anche un effetto, per tutti al tavolo.",
    tableRules: "Regole di questo tavolo",
    yourSantini: "I tuoi santini",
    back: "Torna al tavolo",
  },

  // ---------- le scritte sul tavolo ----------
  notices: {
    potRefilled: (n: number) => `Piatto vuoto! Tutti rimettono la posta: ora ci sono ${coins(n)}.`,
    eliminated: (names: string) => ` Non può pagare ed esce: ${names}.`,
    re: (who: string, hero: boolean) => `Re! ${who} ${hero ? "raddoppi" : "raddoppia"} la vincita.`,
    fante: (who: string, hero: boolean, n: number, victim: string) =>
      `Fante: ${who} ${hero ? "rubi" : "ruba"} ${n} a ${victim}.`,
    cavallo: "Cavallo: il prossimo giocatore salta il turno.",
    santino: {
      san_giuseppe: () => "il 5 vince!",
      corno_rosso: (n: number) => `ti restituisce ${coins(n)}.`,
      santa_rosalia: (n: number) => `vincita doppia, +${coins(n)}.`,
      fico_d_india: () => "esce un bastoni, +1 moneta.",
      pupo_di_orlando: () => "la figura vale doppio!",
      patto: (n: number) => `perdi solo metà, risparmi ${coins(n)}.`,
      corona_di_ruggero: (n: number) => `il banco ti paga +${coins(n)}.`,
      sant_agata: () => "il 4 vince!",
      testa_di_moro: () => "le coppe vincono!",
      trinacria: () => "la prima carta bassa del tavolo vince!",
      carretto_siciliano: () => "esce un denari, +1 moneta.",
      paladino_rinaldo: (n: number) => `il fante ruba ${coins(n)}.`,
    } satisfies Partial<Record<SantinoId, (n: number) => string>>,
    sixLoses: "il 6 perde!",
    evilEye: "Il 7 di spade perde.",
    finanza: (n: number) => `ti porta via ${coins(n)}.`,
    blessing: (name: string) => `La nonna ti ha dato ${name}.`,
    mpanata: (name: string, n: number) => `${name}: +${coins(n)}. Ora sì che si ragiona.`,
    mpurnatu: (name: string) => `${name}: sei sazio, le perdite si dimezzano per qualche turno.`,
    foodSaved: (name: string, n: number) => `${name}: perdi solo metà, risparmi ${coins(n)}.`,
    used: (name: string) => `Hai usato ${name}.`,
  },
};

export type Text = typeof it;
