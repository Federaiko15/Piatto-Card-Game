# Grafica e suoni

I file messi in queste cartelle vengono presi in automatico da `manifest.ts`: basta usare il nome giusto, senza toccare il codice. Finché un file manca il gioco mostra un segnaposto (emoji, colori, motivo a maiolica).

Regole di stile (dal documento di game design): pixel art semplice e piatta, risoluzione nativa 256×144 per i fondali, grandi campiture con pochi dettagli, circa 50 colori caldi e terrosi con accenti blu e gialli delle maioliche, contorno scuro pieno, luce serale di una lampada. Il riferimento è `scenes/table-0.png`. Tutti gli asset vanno disegnati alla stessa densità di pixel del fondale: i file si salvano alla dimensione nativa (se il generatore li dà ingranditi ×4, vanno rimpiccioliti senza sfumature).

## `characters/`

| File | Cosa contiene | Dimensione consigliata |
| --- | --- | --- |
| `zio_turi.png` | mezzobusto neutro, seduto di fronte al giocatore (il tavolo copre il resto) | 64×72, sfondo trasparente |
| `zio_turi.happy.png` | espressione contenta | come sopra |
| `zio_turi.sad.png` | espressione delusa | come sopra |
| `zio_turi.suspicious.png` | espressione sospettosa | come sopra |

Personaggi previsti: `zio_turi`, `picciotto`, `zingara`, `ragioniere`, `prete`, più `hero` per il giocatore (che si vede solo come ritrattino nel pannello a sinistra: la scena è in prima persona). Le espressioni mancanti ricadono sul ritratto neutro.

## `scenes/`

Un fondale per tavolo della notte: `table-0.png` (il bar della piazza), `table-1.png` (la bisca del retrobottega), `table-2.png` (il tavolo del Prete). 256×144: la stanza vista da chi è seduto al tavolo, senza tavolo né personaggi, che stanno su livelli separati. La metà bassa resta coperta dal tavolo, e i personaggi siedono davanti alla fascia centrale.

`shop.png` è il fondale della bottega, stessa dimensione: se c'è, sostituisce il motivo a maiolica della schermata.

`cantina.png` è già pronto per un futuro tavolo della notte: il gioco non lo usa finché non diventa `table-3.png` (o non gli si dà un altro posto nel codice).

## `tables/`

Il tavolo visto da chi è seduto, con lo sfondo trasparente: `table-0.png`, `table-1.png`... come i fondali. Si vede dal bordo lontano (dove i personaggi appoggiano le braccia) fino al piano del bordo vicino, che sugli schermi larghi esce dal basso: il panno al centro va lasciato quasi vuoto, perché sopra ci stanno mazzo, piatto e carta pescata. Larghezza nativa intorno ai 256 px, niente lampada né gambe. Un tavolo senza disegno proprio usa `table-0.png`; senza nessun disegno resta il tavolo fatto in CSS.

## `santini/`

Un'illustrazione per santino e consumabile con lo stesso nome dell'id del motore (`san_giuseppe.png`, `corno_rosso.png`, `brucia.png`...). 32×40, verticale come un santino stampato.

## `sfx/`

Suoni brevi, nomi in `src/audio/sfx.ts`: `card_flip`, `card_slap`, `coins`, `win`, `lose`, `big_win`, `curse`, `santino`, `shop_buy`, `button`. Formato `.ogg` (o `.mp3`), sotto i 100 KB.
