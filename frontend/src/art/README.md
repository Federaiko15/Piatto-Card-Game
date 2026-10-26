# Grafica e suoni

I file messi in queste cartelle vengono presi in automatico da `manifest.ts`: basta usare il nome giusto, senza toccare il codice. Finché un file manca il gioco mostra un segnaposto (emoji, colori, motivo a maiolica).

Regole di stile (dal documento di game design): pixel art semplice e piatta, risoluzione nativa 256×144 per i fondali, grandi campiture con pochi dettagli, circa 50 colori caldi e terrosi con accenti blu e gialli delle maioliche, contorno scuro pieno, luce serale di una lampada. Il riferimento è `scenes/table-0.png`. Tutti gli asset vanno disegnati alla stessa densità di pixel del fondale: i file si salvano alla dimensione nativa (se il generatore li dà ingranditi ×4, vanno rimpiccioliti senza sfumature).

## `characters/`

| File | Cosa contiene | Dimensione consigliata |
| --- | --- | --- |
| `zio_turi.png` | mezzobusto neutro, seduto di fronte al giocatore con le braccia sul tavolo | tela 80×80, sfondo trasparente |
| `zio_turi.happy.png` | espressione contenta | come sopra |
| `zio_turi.sad.png` | espressione delusa | come sopra |
| `zio_turi.suspicious.png` | espressione sospettosa | come sopra |

Personaggi previsti: `zio_turi`, `picciotto`, `zingara`, `ragioniere`, `prete`, `incappucciato`, più `hero` per il giocatore (che si vede solo come ritrattino nel pannello a sinistra: la scena è in prima persona). Le espressioni mancanti ricadono sul ritratto neutro.

Tutte le espressioni di un personaggio stanno sulla stessa tela 80×80 nella stessa posizione: il disegno appoggiato al bordo basso e centrato, così cambiando espressione il personaggio non salta. Il personaggio può essere più stretto o più basso della tela, mai più grande.

## `scenes/`

Un fondale per tavolo della notte: `table-0.png` (il bar della piazza), `table-1.png` (la bisca del retrobottega), `table-2.png` (la cantina, con l'incappucciato), `table-3.png` (il tavolo del Prete). 256×144: la stanza vista da chi è seduto al tavolo, senza tavolo né personaggi, che stanno su livelli separati. La metà bassa resta coperta dal tavolo, e i personaggi siedono davanti alla fascia centrale.

`shop.png` è il fondale della bottega, stessa dimensione: se c'è, sostituisce il motivo a maiolica della schermata.

## `tables/`

Il tavolo visto da chi è seduto, con lo sfondo trasparente: `table-0.png`, `table-1.png`... come i fondali. Si vede dal bordo lontano (dove i personaggi appoggiano le braccia) fino al piano del bordo vicino, che sugli schermi larghi esce dal basso: il panno al centro va lasciato quasi vuoto, perché sopra ci stanno mazzo, piatto e carta pescata. Larghezza nativa intorno ai 256 px, niente lampada né gambe. Un tavolo senza disegno proprio usa `table-0.png`; senza nessun disegno resta il tavolo fatto in CSS.

## L'incappucciato e `emotes/`

L'incappucciato (`characters/incappucciato.png`, stessa tela 80×80) non mostra il volto: vestito di nero, testa china, si vedono solo il cappello e il mento. Basta il ritratto neutro, perché le sue espressioni non cambiano il disegno: spuntano sopra la testa come nei manga, con i file di `emotes/`.

| File | Cosa contiene | Dimensione consigliata |
| --- | --- | --- |
| `emotes/happy.png` | contento: una nota musicale o delle scintille | 16×16, sfondo trasparente |
| `emotes/sad.png` | deluso: la goccia di sudore | come sopra |
| `emotes/suspicious.png` | sospettoso: un punto di domanda o tre puntini | come sopra |

Finché mancano, al loro posto c'è un segno fatto con il testo (♪, 💧, ?). Le stesse emote si possono dare a qualsiasi personaggio con `emotes: true` in `manifest.ts`.

## `santini/`

Un'illustrazione per santino e consumabile con lo stesso nome dell'id del motore (`san_giuseppe.png`, `corno_rosso.png`, `brucia.png`...). 32×40, verticale come un santino stampato. Mancano ancora i due oggetti dell'incappucciato: `patto.png` e `corona_di_ruggero.png`.

## `sfx/`

Suoni brevi, nomi in `src/audio/sfx.ts`: `card_flip`, `coins`, `lose`, `big_win`, `curse`, `santino`, `shop_buy`, `chair`, `victory`, `button`. Formato `.ogg` (o `.mp3`), sotto i 100 KB: mono, senza silenzio all'inizio e con il picco a −3 dB, così hanno tutti lo stesso volume.

Ogni suono preso da fuori va segnato in `sfx/CREDITS.md` con autore, link e licenza. Si usano solo CC0 o CC-BY (che chiede di citare l'autore nei crediti del gioco), mai licenze NC o ND.
