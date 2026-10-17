# Mog Arena – Scheda di progetto

Documento vivo: va aggiornato ogni volta che si prende una decisione o si chiude un pezzo di lavoro.
È la "memoria" del progetto per Claude e per chiunque ci lavori.

## Cos'è

Gioco web a tema "mogging": il giocatore carica l'aura e affronta 6 rivali, archetipi
di studenti di un corso di cybersecurity, fino al boss finale. Un personaggio mentore,
il Prof, interviene una volta per sfida quando il giocatore è in difficoltà.
Il finale contiene una dedica al docente del corso.

## Stato attuale (versione 1.0)

- Gioco single player completo e funzionante.
- Sito statico: `index.html`, `style.css`, `config.js`, `game.js`, `favicon.svg`.
- Nessuna dipendenza esterna, nessun cookie, nessun backend.
- Pubblicazione prevista su GitHub Pages.

## Come è fatto il codice

| File | Ruolo |
| --- | --- |
| `index.html` | Struttura della pagina, pulsanti, potenziamenti, sezione "Come si gioca" |
| `style.css` | Grafica della pagina, tema chiaro/scuro automatico |
| `config.js` | Tutti i testi: rivali, battute, consigli del Prof, dedica, lettere degli exploit |
| `game.js` | Motore: canvas, disegno personaggi, logica di gioco, audio Web Audio API |

Meccaniche principali:
- Carica aura con Spazio o tocco; vince chi arriva al 100%.
- Eventi rapidi (exploit): compare una lettera, va premuta entro 1,3 secondi.
- Mentore: il Prof arriva una volta per sfida se il rivale è avanti di oltre 20 punti.
- Potenziamenti con i mog points: Mascella (aura passiva), Aura (carica per clic), Sguardo (exploit più forti).
- Record salvato nel `localStorage` del browser.

## Decisioni prese

- Il Prof è un personaggio dal design originale (occhiali, maglione viola, pennarello).
  Non si usano ritratti, foto o caricature di persone reali.
- I rivali sono archetipi, non compagni di corso riconoscibili.
- Testi separati dal motore (`config.js`) per poterli modificare senza toccare il codice.
- Hosting: GitHub Pages (consigliato), Netlify come alternativa veloce.
- Licenza consigliata: MIT.

## Da decidere

- [ ] Se togliere o cambiare i riferimenti al corso e il nome nella dedica
      (`config.js` righe 8 e 12, `index.html` righe 6, 8 e 16, `game.js` riga 320).
- [ ] Nome definitivo del gioco: "Mog Arena" o "Mogging Arena".
- [ ] Repository su account GitHub personale o dedicato.

## Roadmap

1. **Pubblicazione** – GitHub Pages, README, licenza.
2. **Rifiniture** – più rivali, suoni migliori, schermata di condivisione del risultato.
3. **Multiplayer v1** – sfide 1 contro 1 con stanze tramite codice, usando Supabase Realtime.
4. **Multiplayer v2** – matchmaking automatico con logica lato server, per impedire di barare
   modificando il JavaScript dal browser.

## Registro modifiche

| Data | Cosa |
| --- | --- |
| 2026-10-17 | Versione 1.0: gioco completo, file separati, guida alla pubblicazione |
