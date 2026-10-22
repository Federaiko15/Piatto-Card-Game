# Grafica e suoni

I file messi in queste cartelle vengono presi in automatico da `manifest.ts`: basta usare il nome giusto, senza toccare il codice. Finché un file manca il gioco mostra un segnaposto (emoji, colori, motivo a maiolica).

Regole di stile (dal documento di game design): pixel art a risoluzione nativa 640×360, scalata per multipli interi, palette unica di 30–40 colori presi dal carretto siciliano e dalle maioliche di Caltagirone, contorno pieno a un colore.

## `characters/`

| File | Cosa contiene | Dimensione consigliata |
| --- | --- | --- |
| `zio_turi.png` | mezzobusto neutro, seduto di fronte al giocatore (il tavolo copre il resto) | 128×148, sfondo trasparente |
| `zio_turi.happy.png` | espressione contenta | come sopra |
| `zio_turi.sad.png` | espressione delusa | come sopra |
| `zio_turi.suspicious.png` | espressione sospettosa | come sopra |

Personaggi previsti: `zio_turi`, `picciotto`, `zingara`, `ragioniere`, `prete`, più `hero` per il giocatore (che si vede solo come ritrattino nel pannello a sinistra: la scena è in prima persona). Le espressioni mancanti ricadono sul ritratto neutro.

## `scenes/`

Un fondale per tavolo della notte: `table-0.png` (il bar della piazza), `table-1.png` (la bisca del retrobottega), `table-2.png` (il tavolo del Prete). 640×360: l'interno di un bar siciliano visto da chi è seduto al tavolo (bancone, mensole, parete), senza tavolo né personaggi, che stanno su livelli separati. La metà bassa resta coperta dal tavolo.

## `santini/`

Un'illustrazione per santino e consumabile con lo stesso nome dell'id del motore (`san_giuseppe.png`, `corno_rosso.png`, `brucia.png`...). 64×80, verticale come un santino stampato.

## `sfx/`

Suoni brevi, nomi in `src/audio/sfx.ts`: `card_flip`, `card_slap`, `coins`, `win`, `lose`, `big_win`, `curse`, `santino`, `shop_buy`, `button`. Formato `.ogg` (o `.mp3`), sotto i 100 KB.
