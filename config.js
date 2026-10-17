// =============================================================
//  CONFIGURAZIONE DEL GIOCO
//  Qui puoi cambiare testi, rivali e dedica senza toccare game.js
// =============================================================

window.MOG_CONFIG = {
  // Dedica mostrata nel finale, dopo aver battuto l'ultimo rivale
  dedicaTitolo: "Dedicato al prof Paolino",
  dedicaSottotitolo: "Grazie per tutto quello che ci ha insegnato",

  // Massimo di cariche d'aura contate in un secondo: oltre questo limite
  // i clic vengono ignorati, così un autoclicker non dà vantaggio
  maxCaricheSecondo: 15,

  // Potenziamenti acquistabili con i mog points.
  // id = nome interno usato da game.js (non cambiarlo), max = livello massimo,
  // costo del livello successivo = costoBase + livello attuale × costoPasso
  potenziamenti: [
    { id: "jaw",  nome: "Mascella", desc: "Aura passiva, come un cron job", max: 5, costoBase: 50, costoPasso: 60 },
    { id: "aura", nome: "Aura",     desc: "Più carica per ogni clic",       max: 5, costoBase: 50, costoPasso: 60 },
    { id: "eyes", nome: "Sguardo",  desc: "Exploit rapidi più potenti",     max: 5, costoBase: 50, costoPasso: 60 },
    { id: "reflex", nome: "Riflessi", desc: "Più tempo per premere la lettera degli exploit", max: 5, costoBase: 60, costoPasso: 70 },
    { id: "charm",  nome: "Carisma",  desc: "Più mog points a ogni vittoria",                 max: 5, costoBase: 80, costoPasso: 80 }
  ],

  // Prestigio: a fine corso ricominci da capo con un bonus permanente.
  // Ogni livello di prestigio dà bonusAura in più su tutta l'aura caricata
  // (0.15 = +15%) e rende i rivali più veloci di rivaliPiuForti (0.10 = +10%).
  prestigio: { bonusAura: 0.15, rivaliPiuForti: 0.10 },
  testoPrestigio: "Prestigio: ricomincia più forte",
  infoPrestigio: "Con il prestigio ricominci il corso con un bonus permanente, ma i rivali diventano più forti.",

  // Aspetto del tuo personaggio e negozio (pannello "Personaggio e negozio").
  // La prima opzione di ogni gruppo è quella di partenza.
  // costo = prezzo in mog points; senza costo l'opzione è gratuita.
  // Le tonalità della pelle restano tutte gratuite.
  // Gli oggetti comprati restano tuoi anche dopo il prestigio.
  // tipo "colore" = campioni di colore, tipo "oggetto" = accessori disegnati da game.js
  // (gli id degli oggetti sono usati da game.js per disegnarli: non cambiarli).
  // Solo stili inventati: niente che riproduca persone reali o marchi.
  aspetto: [
    { id: "pelle", nome: "Pelle", tipo: "colore", opzioni: [
      { id: "p1", nome: "Chiara",    col: "#E8C9A8" },
      { id: "p2", nome: "Media",     col: "#CFA07A" },
      { id: "p3", nome: "Olivastra", col: "#B07F52" },
      { id: "p4", nome: "Scura",     col: "#7A4F2E" } ] },
    { id: "capelli", nome: "Capelli", tipo: "colore", opzioni: [
      { id: "nero",    nome: "Neri",    col: "#2C2C2A" },
      { id: "castano", nome: "Castani", col: "#6B4226" },
      { id: "biondo",  nome: "Biondi",  col: "#D8B45A" },
      { id: "rosso",   nome: "Rossi",   col: "#B5482A" },
      { id: "viola",   nome: "Viola",   col: "#7F77DD", costo: 80 },
      { id: "verde",   nome: "Verdi",   col: "#1D9E75", costo: 80 },
      { id: "bianco",  nome: "Bianchi", col: "#F1EFE8", costo: 150 } ] },
    { id: "aura", nome: "Colore aura", tipo: "colore", opzioni: [
      { id: "menta", nome: "Menta", col: "#5DCAA5" },
      { id: "oro",   nome: "Oro",   col: "#EF9F27", costo: 120 },
      { id: "lilla", nome: "Lilla", col: "#AFA9EC", costo: 100 },
      { id: "corallo", nome: "Corallo", col: "#F0997B", costo: 100 },
      { id: "cielo", nome: "Cielo", col: "#85B7EB", costo: 100 },
      { id: "rubino", nome: "Rubino", col: "#E24B4A", costo: 250 } ] },
    { id: "occhiali", nome: "Occhiali", tipo: "oggetto", opzioni: [
      { id: "nessuno", nome: "Nessuno" },
      { id: "tondi",   nome: "Tondi",   costo: 60 },
      { id: "sole",    nome: "Da sole", costo: 120 },
      { id: "visore",  nome: "Visore",  costo: 300 } ] },
    { id: "testa", nome: "In testa", tipo: "oggetto", opzioni: [
      { id: "nessuno",    nome: "Niente" },
      { id: "cappellino", nome: "Cappellino", costo: 80 },
      { id: "cuffie",     nome: "Cuffie",     costo: 120 },
      { id: "bandana",    nome: "Bandana",    costo: 80 },
      { id: "felpa",      nome: "Cappuccio",  costo: 150 },
      { id: "corona",     nome: "Corona",     costo: 600 } ] }
  ],

  // Testi del negozio
  testoOfferta: "Offerta del giorno: metà prezzo per",
  testoServono: "Ti servono altri mog points:",
  testoComprato: "Comprato:",

  // Testi del salvataggio
  testoAzzera: "Azzera progressi",
  confermaAzzera: "Vuoi cancellare mog points, potenziamenti, oggetti comprati, prestigio e record? Non si può annullare.",

  // Lettere usate negli eventi rapidi (exploit)
  lettereExploit: "SCUOLA",

  // Consigli del Prof (il mentore che ti aiuta quando sei in difficoltà)
  consigliProf: [
    "Prima la ricognizione, poi l'attacco",
    "Respira. Leggi l'output. Riprova.",
    "Nessuno nasce root: si diventa",
    "Il report si finisce sempre",
    "Ce la puoi fare, ti ho visto crescere"
  ],

  // Interruttori sotto l'arena (salvati nel browser)
  testiOpzioni: { suono: "Effetti sonori", musica: "Musica", calma: "Riduci effetti" },

  // I 6 rivali, dal più facile al più difficile.
  // j = mascella (1-5), e = sguardo (1-5), r = velocità di carica,
  // hood = 1 se ha la felpa col cappuccio, tt = battute,
  // sfondo = ambientazione disegnata da game.js: aula, laboratorio, rete, kanban, server, palco
  rivali: [
    { n: "Lo studente Windows", j: 1, e: 1, col: "#378ADD", r: .16, hood: 0, sfondo: "aula",
      tt: ["Ma Kali si installa su Paint?", "Il prof ha detto sudo?", "Ho cliccato su tutti i link della mail"] },
    { n: "Il copia-ChatGPT", j: 2, e: 1, col: "#D85A30", r: .22, hood: 0, sfondo: "laboratorio",
      tt: ["As an AI language model...", "Ho incollato il report intero", "Il prompt era buono, giuro"] },
    { n: "Nmap selvaggio", j: 2, e: 3, col: "#7F77DD", r: .28, hood: 1, sfondo: "rete",
      tt: ["nmap -A sulla rete del vicino", "Ho scansionato il router della scuola", "Porte aperte ovunque"] },
    { n: "Il capo della Build Week", j: 4, e: 2, col: "#1D9E75", r: .34, hood: 0, sfondo: "kanban",
      tt: ["Ho già diviso i task", "Il report lo consegno io", "Daily alle 8:00"] },
    { n: "Il re di Metasploit", j: 4, e: 4, col: "#D4537E", r: .40, hood: 1, sfondo: "server",
      tt: ["exploit/multi/mogging", "Meterpreter session opened", "Ho la shell sulla tua mascella"] },
    { n: "Il tutor supremo", j: 5, e: 5, col: "#EF9F27", r: .48, hood: 0, sfondo: "palco",
      tt: ["Hai letto la documentazione?", "Rifallo da capo", "Questa è teoria del primo modulo"] }
  ]
};
