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
    { id: "eyes", nome: "Sguardo",  desc: "Exploit rapidi più potenti",     max: 5, costoBase: 50, costoPasso: 60 }
  ],

  // Testi del salvataggio
  testoAzzera: "Azzera progressi",
  confermaAzzera: "Vuoi cancellare mog points, potenziamenti e record? Non si può annullare.",

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

  // I 6 rivali, dal più facile al più difficile.
  // j = mascella (1-5), e = sguardo (1-5), r = velocità di carica,
  // hood = 1 se ha la felpa col cappuccio, tt = battute
  rivali: [
    { n: "Lo studente Windows", j: 1, e: 1, col: "#378ADD", r: .16, hood: 0,
      tt: ["Ma Kali si installa su Paint?", "Il prof ha detto sudo?", "Ho cliccato su tutti i link della mail"] },
    { n: "Il copia-ChatGPT", j: 2, e: 1, col: "#D85A30", r: .22, hood: 0,
      tt: ["As an AI language model...", "Ho incollato il report intero", "Il prompt era buono, giuro"] },
    { n: "Nmap selvaggio", j: 2, e: 3, col: "#7F77DD", r: .28, hood: 1,
      tt: ["nmap -A sulla rete del vicino", "Ho scansionato il router della scuola", "Porte aperte ovunque"] },
    { n: "Il capo della Build Week", j: 4, e: 2, col: "#1D9E75", r: .34, hood: 0,
      tt: ["Ho già diviso i task", "Il report lo consegno io", "Daily alle 8:00"] },
    { n: "Il re di Metasploit", j: 4, e: 4, col: "#D4537E", r: .40, hood: 1,
      tt: ["exploit/multi/mogging", "Meterpreter session opened", "Ho la shell sulla tua mascella"] },
    { n: "Il tutor supremo", j: 5, e: 5, col: "#EF9F27", r: .48, hood: 0,
      tt: ["Hai letto la documentazione?", "Rifallo da capo", "Questa è teoria del primo modulo"] }
  ]
};
