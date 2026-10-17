# Mog Arena – Feature future

Documento di lavoro per ragionare sulle nuove funzionalità prima di scriverle.
Per ogni feature: cosa fa, da cosa dipende, come la implementiamo, cosa può andare storto
(anche dal punto di vista di chi vuole barare) e quanto è grande il lavoro.

`PROGETTO.md` resta la scheda del progetto (stato, decisioni, registro modifiche).
Qui stanno le idee e i piani; quando una feature viene decisa o completata si aggiorna
anche `PROGETTO.md`.

## Come si usa

- Ogni feature ha uno **stato**: `idea` → `da decidere` → `pronta` → `in corso` → `fatta`.
- Le domande aperte di ogni feature vanno risolte prima di passare a `pronta`.
- Una feature si implementa con un branch e una PR dedicati, una alla volta.
- Dimensione indicativa: **S** (poche righe, un file), **M** (più funzioni o file), **L** (nuovi sistemi o servizi esterni).

## Punto di partenza: com'è il gioco oggi

Alcuni fatti del codice attuale che condizionano tutte le feature:

- **I progressi non si salvano.** Mog points (`pts`) e potenziamenti (`S`) vivono solo in memoria
  in `game.js`: ricaricando la pagina si riparte da zero. Si salva solo il record (`mogArenaBest`
  nel `localStorage`).
- **I personaggi sono disegnati in codice** sul canvas (funzioni `head()` e `prof()` in `game.js`),
  senza immagini. `head()` accetta già mascella, sguardo, colore e cappuccio: è la base naturale
  per la personalizzazione.
- **I potenziamenti sono scritti a mano** in tre punti: lo stato `S` in `game.js`, i pulsanti in
  `index.html` e la formula del costo `cst()`. Aggiungerne altri così diventa scomodo.
- **Tutto gira nel browser del giocatore.** In single player va benissimo; in multiplayer
  significa che qualunque valore calcolato dal client è falsificabile.

## Ordine consigliato

| # | Feature | Dimensione | Perché in questa posizione |
| --- | --- | --- | --- |
| 0 | [Salvataggio progressi](#0-salvataggio-progressi) | S | Senza, negozio e personalizzazione si perdono a ogni ricarica |
| 1 | [Catalogo in config.js](#1-catalogo-in-configjs) | S | Rende potenziamenti e oggetti dati, non codice: tutto il resto ci si appoggia |
| 2 | [Potenziamenti estesi](#2-potenziamenti-estesi) | M | Migliora subito il gioco con ciò che esiste già |
| 3 | [Personaggio customizzabile](#3-personaggio-customizzabile) | M | Lavora su `head()`, che è già parametrico |
| 4 | [Negozio oggetti](#4-negozio-oggetti) | M | Unisce 2 e 3 in un'unica schermata con una sola valuta |
| 5 | [Grafica e audio](#5-grafica-e-audio) | M | Rifiniture, si possono fare a pezzi in qualunque momento |
| 6 | [Condivisione del risultato](#6-condivisione-del-risultato) | S | Già in roadmap, porta giocatori prima del multiplayer |
| 7 | [Multiplayer v1: sfide tra amici](#7-multiplayer-v1-sfide-tra-amici) | L | Primo servizio esterno: va fatto quando il single player è stabile |
| 8 | [Multiplayer v2: matchmaking e classifica](#8-multiplayer-v2-matchmaking-e-classifica) | L | Richiede il server autoritativo della v1 |

Le feature 0–6 restano un sito statico su GitHub Pages, senza backend né costi.
Dalla 7 in poi serve un servizio esterno.

---

## 0. Salvataggio progressi

**Stato:** fatta · **Dimensione:** S · **Dipende da:** niente

**Cosa:** mog points, potenziamenti, livello raggiunto e (in futuro) oggetti posseduti restano
salvati nel browser tra una visita e l'altra.

**Come:**
- Un unico oggetto salvato in `localStorage` sotto una chiave, per esempio `mogArenaSave`,
  con un numero di versione: `{ v: 1, pts, lvl, stats, owned, equipped, best }`.
- Funzioni `load()` e `save()` in `game.js`; `save()` si chiama alla fine di ogni sfida e a ogni acquisto.
- Se il salvataggio è assente, illeggibile o di una versione sconosciuta si riparte da zero
  senza errori (stesso stile del `try/catch` già usato per il record).
- Il vecchio `mogArenaBest` viene letto una volta e migrato nel nuovo formato.
- Un pulsante "Azzera progressi" per ricominciare.

**Sicurezza:** il giocatore può modificare il `localStorage` e darsi punti infiniti. In single player
è accettabile: bara solo con se stesso. Regola che vale da qui in avanti: **niente di ciò che sta nel
`localStorage` verrà mai usato per multiplayer o classifiche.** Validare comunque i valori caricati
(numeri, limiti 0–5) così un salvataggio rotto non rompe il gioco.

---

## 1. Catalogo in config.js

**Stato:** fatta (per ora solo i potenziamenti; gli oggetti arrivano con le feature 3 e 4) · **Dimensione:** S · **Dipende da:** niente

**Cosa:** un elenco in `config.js` che descrive potenziamenti e oggetti come dati
(nome, descrizione, costo, livello massimo, effetto). `game.js` li legge e genera da solo i pulsanti,
invece di averli scritti a mano in `index.html`.

**Come:**
- In `config.js` nuove sezioni, per esempio:
  ```js
  potenziamenti: [
    { id: "jaw",  nome: "Mascella", desc: "Aura passiva, come un cron job", max: 5, costoBase: 50, costoPasso: 60 },
    ...
  ],
  oggetti: [
    { id: "occhiali_neri", tipo: "occhiali", nome: "Occhiali da root", costo: 120 },
    ...
  ]
  ```
- I testi restano in `config.js`, la logica (cosa fa ogni `id`) resta in `game.js`, come da regola del progetto.
- `index.html` mantiene solo un contenitore vuoto dove `game.js` crea i pulsanti.

**Sicurezza:** i pulsanti vanno creati con `textContent`, mai con `innerHTML`, così un testo in
`config.js` non può diventare codice eseguibile (abitudine utile quando arriveranno nomi scelti dai giocatori).

---

## 2. Potenziamenti estesi

**Stato:** fatta · **Dimensione:** M · **Dipende da:** 0, 1

**Fatto:**
- **Riflessi**: ogni livello allunga di 0,15 s il tempo per premere la lettera dell'exploit (da 1,3 s fino a 2,05 s).
- **Carisma**: ogni livello dà +10% di mog points a ogni vittoria (fino a +50%).
- **Prestigio**: a fine corso il pulsante "Ricomincia il corso" diventa "Prestigio". Si riparte dal primo
  studente con punti e potenziamenti azzerati, ma ogni livello di prestigio dà +15% su tutta l'aura caricata
  e rende i rivali più veloci del 10%. Il record e il prestigio restano.
- Numeri regolabili in `config.js` (`potenziamenti` e `prestigio`).

**Idee rimaste per dopo:** Firewall (rivale più lento), abilità attive con ricarica, consumabili.

---

## 3. Personaggio customizzabile

**Stato:** fatta (oggetti tutti gratuiti finché non arriva il negozio) · **Dimensione:** M · **Dipende da:** 0

**Cosa:** il giocatore sceglie l'aspetto del proprio personaggio: colore dell'aura, pelle, capelli,
occhiali, cappellino o cappuccio, accessori, e un nome da mostrare sotto il personaggio al posto di "Tu".

**Come:**
- Si estende `head()` con un oggetto "aspetto": `{ pelle, capelli, aura, occhiali, cappello, accessorio }`.
  Ogni accessorio è una piccola funzione di disegno sul canvas, come quelle già esistenti: niente immagini,
  niente librerie.
- Una schermata "Personaggio" (prima della sfida o dal menu) con anteprima dal vivo sul canvas.
- Alcune opzioni sono gratuite, altre si sbloccano nel negozio (feature 4).
- Mascella e sguardo continuano a crescere con i potenziamenti: è il "mogging" visibile e va mantenuto.

**Limiti fissi:** solo stili inventati. Nessun accessorio o combinazione che riproduca persone reali,
loghi o personaggi protetti.

**Sicurezza:** il nome scelto dal giocatore va limitato (lunghezza massima, solo caratteri normali)
e disegnato sul canvas o inserito con `textContent`. In multiplayer il nome dell'avversario
è input non fidato: va ricontrollato sul server e filtrato contro insulti.

**Deciso:** il nome del giocatore arriva solo con il multiplayer (feature 7).

**Fatto:** pannello "Personaggio" sotto l'arena con anteprima dal vivo. Si scelgono pelle (4 tonalità),
capelli (6 colori), colore dell'aura (5), occhiali (nessuno, tondi, da sole) e cosa indossare in testa
(niente, cappellino, cuffie, bandana, cappuccio). Le opzioni stanno in `config.js` → `aspetto`; l'aspetto
è salvato con i progressi e al caricamento si accettano solo id presenti nel catalogo. Mascella e sguardo
continuano a crescere con i potenziamenti. Con il negozio (feature 4) alcune opzioni diventeranno acquistabili.

---

## 4. Negozio oggetti

**Stato:** fatta · **Dimensione:** M · **Dipende da:** 0, 1, 3

**Cosa:** una schermata dove spendere i mog points in oggetti estetici (feature 3) e potenziamenti
(feature 2), con categorie, prezzo, "posseduto/equipaggiato".

**Come:**
- I prodotti sono le voci del catalogo in `config.js`.
- Il negozio è un pannello HTML sotto o sopra il canvas (più semplice e accessibile del disegno sul canvas),
  che sostituisce l'attuale riga dei potenziamenti.
- Acquisto: controllo punti → sottrazione → aggiunta a `owned` → `save()`.
- Eventuale "oggetto del giorno" scontato, scelto dalla data (nessun server necessario).

**Sicurezza:** in single player il negozio si può aggirare dalla console del browser e va bene così.
Se in futuro gli oggetti comparissero in multiplayer, **l'elenco degli oggetti posseduti dovrà stare sul
server**, altrimenti chiunque si "regala" tutto. Per questo consiglio che in multiplayer gli oggetti
siano solo estetici (vedi feature 7).

**Deciso:** solo mog points, niente soldi veri.

**Fatto:** il pannello "Personaggio e negozio" mostra i mog points e il prezzo degli oggetti bloccati;
un clic compra e indossa. Colori di capelli e aura, occhiali e accessori hanno un `costo` in
`config.js` → `aspetto` (le tonalità della pelle restano gratuite). Nuovi oggetti: capelli bianchi,
aura rubino, visore animato, corona. Ogni giorno un oggetto è a metà prezzo (offerta del giorno, scelta
dalla data). Gli oggetti comprati restano dopo il prestigio. Chi aveva già un oggetto addosso dalla
versione precedente lo tiene gratis. Al caricamento si accettano solo oggetti esistenti nel catalogo.
I potenziamenti restano nella loro riga sotto l'arena.

---

## 5. Grafica e audio

**Stato:** idea · **Dimensione:** M (a pezzi da S) · **Dipende da:** niente

**Idee:**
- **Sfondi per rivale**: ogni rivale con la sua "aula" (laboratorio, sala server, terminale) disegnata sul canvas.
- **Animazioni**: entrata dei personaggi, colpo di grazia, schermata di vittoria più ricca.
- **Nuovi rivali**: in `config.js` (già in roadmap), magari con un capo segreto dopo il prestigio.
- **Audio**: piccola musica di sottofondo generata con la Web Audio API (come gli effetti attuali),
  con pulsante per disattivarla e volume salvato.
- **Accessibilità**: opzione "riduci effetti" per scosse e lampi bianchi (`prefers-reduced-motion`),
  contrasto dei testi.

**Come:** si resta sul canvas disegnato in codice, così il gioco resta leggero e senza file grafici
da gestire. Se un giorno servissero immagini, meglio SVG originali nel repo che risorse prese dal web
(diritti d'autore).

**Limiti fissi:** nessun ritratto, foto o caricatura di persone reali; i rivali restano archetipi.

---

## 6. Condivisione del risultato

**Stato:** idea · **Dimensione:** S · **Dipende da:** niente

**Cosa:** a fine corso (o dopo una vittoria) un pulsante "Condividi" con il risultato:
testo tipo "Ho moggato 6/6 studenti in Mog Arena" + link, oppure un'immagine del canvas.

**Come:** `navigator.share()` sui telefoni, copia negli appunti sui computer; per l'immagine
`canvas.toBlob()`. Nessun servizio esterno.

**Sicurezza:** il risultato condiviso è dichiarato dal giocatore, quindi falsificabile. Va bene
finché resta "un vanto" e non una classifica.

---

## 7. Multiplayer v1: sfide tra amici

**Stato:** rimandata · **Dimensione:** L · **Dipende da:** 0, 3 (aspetto del personaggio); stabilità del single player

**Deciso:** il multiplayer aspetta. Quando arriverà deve essere un gioco onesto: vince chi clicca
davvero più veloce, quindi server autoritativo, limite di clic al secondo e potenziamenti esclusi
(conta solo l'aspetto). Il servizio esterno è ancora da scegliere.

**Cosa:** due giocatori si sfidano in tempo reale. Uno crea una stanza e ottiene un codice,
l'altro lo inserisce. Vince chi arriva prima al 100% di aura.

### Il problema da attaccante

Oggi è il browser a decidere quanto aura hai. In multiplayer questo è inaccettabile, perché un giocatore può:

- usare un **autoclicker** o uno script (`setInterval` che chiama `charge()`) e caricare a velocità impossibile;
- modificare `game.js` dalla console per partire al 99% o darsi potenziamenti al massimo;
- **inviare messaggi falsi** al servizio (per esempio "ho vinto") senza nemmeno usare il gioco;
- leggere le chiavi del servizio dal codice del sito (che è pubblico) e usarle per altro;
- spammare richieste per bloccare stanze o consumare le quote gratuite del servizio.

### Approccio consigliato: server autoritativo da subito

Il client manda solo **intenzioni** ("ho premuto carica", "ho premuto la lettera K"),
il **server** tiene lo stato vero della partita e decide il vincitore.

- Il server limita la frequenza delle azioni (per esempio massimo 12 cariche al secondo, ben sopra
  un umano veloce ma sotto un autoclicker), e ignora o penalizza ciò che supera il limite.
- Le lettere degli exploit le sceglie il server, con tempi misurati dal server.
- **In multiplayer i potenziamenti del single player non contano**: entrambi partono uguali,
  perché i potenziamenti stanno nel `localStorage` e sono falsificabili. Si porta solo l'aspetto
  del personaggio, che è estetico.
- I nomi e i messaggi arrivati dall'avversario sono trattati come input non fidato.
- Il codice della stanza è casuale e lungo abbastanza da non essere indovinato; la stanza scade dopo pochi minuti.

### Opzioni tecniche

| Opzione | Pro | Contro |
| --- | --- | --- |
| **Supabase Realtime** (in roadmap) | Gratuito per iniziare, si collega dal browser, ha database e login | Realtime da solo inoltra messaggi tra client: per essere autoritativo serve aggiungere logica sul server (Edge Functions o un processo che tiene lo stato), più complesso |
| **Cloudflare Workers + Durable Objects** | Ogni stanza è un piccolo programma sul server che tiene lo stato della partita: è proprio il modello "server autoritativo"; piano gratuito generoso | Account Cloudflare e un po' di codice server in JavaScript |
| **Server Node.js proprio** (es. Render, Fly.io) | Controllo totale | Va mantenuto, aggiornato e protetto: più superficie d'attacco |

Consiglio: **Cloudflare Durable Objects**, perché risolve in modo naturale il problema principale
(chi tiene lo stato) senza un server da amministrare. Il sito resta su GitHub Pages; solo la parte
multiplayer usa il servizio. Va comunque deciso insieme: è il primo servizio esterno del progetto.

**Altri rischi:**
- Le chiavi pubbliche nel codice del sito sono normali, ma devono avere solo i permessi minimi;
  le chiavi segrete non vanno mai nel repo (il repo è pubblico).
- Limitare le stanze create per indirizzo IP per non esaurire le quote gratuite.
- Il ritardo di rete rende la gara di clic meno precisa: lo stato si aggiorna dal server alcune volte
  al secondo e il client "anima" tra un aggiornamento e l'altro.

**Domande aperte:**
- Quale servizio esterno (Cloudflare o Supabase), con un account a tuo nome?

---

## 8. Multiplayer v2: matchmaking e classifica

**Stato:** idea · **Dimensione:** L · **Dipende da:** 7

**Cosa:** "Gioca online" senza codice, abbinamento automatico con uno sconosciuto;
classifica globale; eventualmente account.

**Come:** una coda di attesa sul server che accoppia i giocatori; i risultati salvati dal server
(mai dal client) in un database; punteggio tipo Elo.

**Sicurezza:**
- La classifica accetta **solo risultati di partite giocate sul server**. Una classifica del
  single player basata su punteggi inviati dal browser verrebbe falsificata in pochi minuti.
- Con gli account arrivano dati personali (email): servono informativa privacy, minimizzazione dei dati
  e preferibilmente il login di un fornitore esterno invece di gestire password in proprio.
- Nomi pubblici in classifica: filtro contro insulti e possibilità di segnalazione.
- Protezione da account multipli usati per gonfiare la classifica (vincere contro se stessi).

---

## Gioco onesto anche in single player

Il limite di clic vale già oggi: `config.js` → `maxCaricheSecondo` (15). Le cariche oltre questo
numero in un secondo vengono ignorate, così un autoclicker o uno script che simula la barra
spaziatrice non dà vantaggio. Un umano molto veloce arriva a 10–14 clic al secondo.
In single player resta aggirabile modificando il codice dalla console; la protezione vera,
per il multiplayer, sarà sul server.

## Domande aperte riassunte

1. Quale servizio per il multiplayer, quando arriverà (Cloudflare Durable Objects o Supabase)?

## Decisioni del 2026-10-17

- Si segue l'ordine consigliato; fatte le feature 0 e 1.
- Negozio solo con mog points.
- Multiplayer rimandato; quando arriva, gioco onesto: vince il più veloce, potenziamenti esclusi.
- Nuovi potenziamenti: Riflessi, Carisma e prestigio.
- Nome del giocatore solo con il multiplayer.
- Il prestigio sostituisce "Ricomincia il corso" (scelta proposta, applicata in attesa di conferma).
