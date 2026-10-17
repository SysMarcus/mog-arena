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
- Potenziamenti con i mog points: Mascella (aura passiva), Aura (carica per clic), Sguardo (exploit più forti),
  Riflessi (più tempo per gli exploit), Carisma (più mog points).
- Prestigio a fine corso: si ricomincia con un bonus permanente di aura contro rivali più veloci.
- Personaggio personalizzabile (pannello "Personaggio"): pelle, capelli, colore aura, occhiali, accessori
  in testa. Opzioni in `config.js` → `aspetto`, disegnate sul canvas da `game.js`.
- Negozio nello stesso pannello: oggetti estetici a pagamento in mog points (`costo` in `config.js`),
  offerta del giorno a metà prezzo, oggetti comprati conservati dopo il prestigio.
- Sfondo diverso per ogni rivale, musica generata dal browser, interruttori per effetti sonori, musica
  e "riduci effetti" (accessibilità).
  Sono definiti in `config.js` (`potenziamenti`) e i pulsanti vengono generati da `game.js`.
- Progressi (mog points, potenziamenti, livello, record) salvati nel `localStorage` del browser
  sotto la chiave `mogArenaSave`, con pulsante "Azzera progressi".
- Massimo 15 cariche d'aura al secondo (`maxCaricheSecondo` in `config.js`): gli autoclicker non aiutano.

## Decisioni prese

- Il Prof è un personaggio dal design originale (occhiali, maglione viola, pennarello).
  Non si usano ritratti, foto o caricature di persone reali.
- I rivali sono archetipi, non compagni di corso riconoscibili.
- Testi separati dal motore (`config.js`) per poterli modificare senza toccare il codice.
- Hosting: GitHub Pages (consigliato), Netlify come alternativa veloce.
- Licenza consigliata: MIT.
- Le feature future si documentano e si ragionano in `FEATURES.md` prima di implementarle,
  una per volta, ognuna con branch e PR dedicati.
- Negozio solo con mog points, niente soldi veri.
- Gioco onesto: vince chi clicca davvero più veloce. Limite di clic al secondo già in single player;
  in multiplayer server autoritativo e potenziamenti esclusi.
- Multiplayer rimandato; il nome del giocatore arriva insieme al multiplayer.
- Potenziamenti: Mascella, Aura, Sguardo, Riflessi, Carisma. A fine corso il prestigio sostituisce
  "Ricomincia il corso": si riparte con +15% di aura per livello, rivali +10% più veloci.

## Da decidere

- [ ] Se togliere o cambiare i riferimenti al corso e il nome nella dedica
      (`config.js` righe 8 e 12, `index.html` righe 6, 8 e 16, `game.js` riga 320).
- [ ] Nome definitivo del gioco: "Mog Arena" o "Mogging Arena".
- [ ] Repository su account GitHub personale o dedicato.
- [ ] Servizio per il multiplayer: Cloudflare Durable Objects o Supabase.

## Roadmap

1. **Pubblicazione** – GitHub Pages, README, licenza.
2. **Rifiniture ed evoluzione single player** – salvataggio progressi, potenziamenti estesi,
   personaggio customizzabile, negozio, grafica, condivisione del risultato (dettagli in `FEATURES.md`).
3. **Multiplayer v1** – sfide 1 contro 1 con stanze tramite codice, con server autoritativo
   (Supabase o Cloudflare Durable Objects, da decidere: confronto in `FEATURES.md`).
4. **Multiplayer v2** – matchmaking automatico con logica lato server, per impedire di barare
   modificando il JavaScript dal browser.

## Registro modifiche

| Data | Cosa |
| --- | --- |
| 2026-10-17 | Versione 1.0: gioco completo, file separati, guida alla pubblicazione |
| 2026-10-17 | Aggiunto `FEATURES.md`: piano delle feature future con ordine consigliato e rischi di sicurezza |
| 2026-10-17 | Salvataggio progressi, potenziamenti definiti in `config.js`, limite di 15 clic al secondo |
| 2026-10-17 | Nuovi potenziamenti Riflessi e Carisma, prestigio a fine corso |
| 2026-10-17 | Personaggio personalizzabile con anteprima: pelle, capelli, aura, occhiali, accessori |
| 2026-10-17 | Negozio: oggetti estetici in mog points, offerta del giorno, nuovi oggetti (visore, corona) |
| 2026-10-17 | Sfondi per rivale, musica durante le sfide, interruttori suono/musica/riduci effetti |
