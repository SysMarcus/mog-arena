// =============================================================
//  MOG ARENA – motore di gioco
//  Testi e rivali si modificano in config.js
// =============================================================
(function () {
  "use strict";

  const CFG = window.MOG_CONFIG;
  const RIV = CFG.rivali;
  const TIPS = CFG.consigliProf;
  const LETTERS = CFG.lettereExploit;
  const UPS = CFG.potenziamenti;
  const MAX_CPS = CFG.maxCaricheSecondo || 15;
  const PRE = CFG.prestigio;
  const LOOKS = CFG.aspetto;
  const CH = "01$#>_{}[];/";

  // ---------- Canvas ----------
  const cv = document.getElementById("cv");
  let c = cv.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;
  function resize() {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- Stato ----------
  // Preferenze: effetti sonori, musica, riduci effetti (rispetta l'impostazione del sistema)
  let opt = { snd: true, mus: true, calm: !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) };
  let S = freshStats(), look = freshLook(), owned = new Set(), pts = 0, lvl = 0, prestige = 0, phase = "menu", clicks = [];
  let pA = 0, rA = 0, t = 0, shake = 0, flash = 0;
  let parts = [], txts = [], cracks = [], codeRain = [];
  let qte = null, qteT = 2.5, endT = 0, win = false, combo = 0;
  let tauntT = 1.5, bubble = null, fightT = 0, mentor = null, mentorUsed = false;
  for (let i = 0; i < 40; i++) codeRain.push({ x: Math.random(), y: Math.random(), s: .3 + Math.random() });

  // ---------- Salvataggio (solo nel browser del giocatore) ----------
  // Il localStorage è modificabile da chiunque: va bene per il single player,
  // ma niente di ciò che sta qui verrà mai usato per multiplayer o classifiche.
  const SAVE_KEY = "mogArenaSave", SAVE_V = 1;
  let best = 0;

  function freshStats() { const o = {}; for (const u of UPS) o[u.id] = 0; return o; }
  function freshLook() { const o = {}; for (const g of LOOKS) o[g.id] = g.opzioni[0].id; return o; }

  // ---------- Negozio ----------
  // Un oggetto è "gruppo:opzione"; senza costo è gratuito e sempre disponibile
  const okey = (gid, oid) => gid + ":" + oid;
  const isPaid = (o) => o.costo > 0;
  const hasIt = (gid, o) => !isPaid(o) || owned.has(okey(gid, o.id));
  const PAID = [];
  for (const g of LOOKS) for (const o of g.opzioni) if (isPaid(o)) PAID.push({ g, o });
  // Offerta del giorno: un oggetto a metà prezzo, scelto dalla data (cambia a mezzanotte UTC)
  const DEAL = PAID.length ? PAID[Math.floor(Date.now() / 864e5) % PAID.length] : null;
  const isDeal = (gid, o) => DEAL && DEAL.g.id === gid && DEAL.o.id === o.id;
  const price = (gid, o) => isDeal(gid, o) ? Math.ceil(o.costo / 2) : (o.costo || 0);
  // Numero intero tra min e max, altrimenti il valore di riserva
  function intIn(v, min, max, def) { return Number.isInteger(v) && v >= min && v <= max ? v : def; }

  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (e) {}
    if (d && typeof d === "object" && d.v === SAVE_V) {
      pts = intIn(d.pts, 0, 1e9, 0);
      lvl = intIn(d.lvl, 0, RIV.length, 0);
      best = intIn(d.best, 0, RIV.length, 0);
      prestige = intIn(d.prestige, 0, 999, 0);
      const st = d.stats && typeof d.stats === "object" ? d.stats : {};
      for (const u of UPS) S[u.id] = intIn(st[u.id], 0, u.max, 0);
      // Aspetto: si accettano solo id presenti nel catalogo
      const lk = d.look && typeof d.look === "object" ? d.look : {};
      if (Array.isArray(d.owned)) {
        // Solo oggetti a pagamento che esistono nel catalogo
        for (const { g, o } of PAID) if (d.owned.includes(okey(g.id, o.id))) owned.add(okey(g.id, o.id));
      } else {
        // Salvataggio di prima del negozio: ciò che avevi addosso diventa tuo
        for (const { g, o } of PAID) if (lk[g.id] === o.id) owned.add(okey(g.id, o.id));
      }
      for (const g of LOOKS) { const o = g.opzioni.find((x) => x.id === lk[g.id]); if (o && hasIt(g.id, o)) look[g.id] = o.id; }
      const op = d.opt && typeof d.opt === "object" ? d.opt : {};
      for (const k of Object.keys(opt)) if (typeof op[k] === "boolean") opt[k] = op[k];
      return;
    }
    // Primo avvio con il nuovo salvataggio: recupera il vecchio record
    try { best = intIn(parseInt(localStorage.getItem("mogArenaBest") || "0", 10), 0, RIV.length, 0); } catch (e) {}
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_V, pts, lvl, best, prestige, stats: S, look, owned: [...owned], opt })); } catch (e) {}
  }
  function saveBest() { if (lvl > best) best = lvl; save(); }
  function resetAll() {
    S = freshStats(); look = freshLook(); owned = new Set(); pts = 0; lvl = 0; best = 0; prestige = 0;
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem("mogArenaBest"); } catch (e) {}
  }
  load();

  // Moltiplicatori del prestigio: più aura per te, rivali più veloci
  function auraMul() { return 1 + prestige * PRE.bonusAura; }
  function rivalMul() { return 1 + prestige * PRE.rivaliPiuForti; }

  // ---------- Audio (generato dal browser) ----------
  let AC = null;
  function snd(f, d, type, v) {
    if (!opt.snd) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(f, AC.currentTime);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, f * .4), AC.currentTime + d);
      g.gain.setValueAtTime(v || .15, AC.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + d);
      o.connect(g).connect(AC.destination);
      o.start(); o.stop(AC.currentTime + d);
    } catch (e) {}
  }

  // ---------- Musica (generata dal browser, solo durante le sfide) ----------
  // Giro di basso e arpeggio in minore; accelera quando la sfida si fa tesa.
  const MUS = { bpm: 108, bass: [45, 45, 48, 43], arp: [0, 3, 7, 10, 12, 10, 7, 3] };
  let musT = 0, musStep = 0;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function note(f, at, d, type, v) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, at);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + .01);
    g.gain.exponentialRampToValueAtTime(.0001, at + d);
    o.connect(g).connect(AC.destination); o.start(at); o.stop(at + d + .02);
  }
  function music(tension) {
    if (!AC || !opt.mus || phase !== "fight") { musT = 0; return; }
    try {
      const step = 60 / (MUS.bpm * (1 + tension * .35)) / 2;
      if (musT < AC.currentTime) musT = AC.currentTime + .05;
      while (musT < AC.currentTime + .2) {
        const s = musStep % 8, root = MUS.bass[Math.floor(musStep / 8) % 4];
        if (s % 4 === 0) note(midi(root), musT, step * 3.5, "triangle", .07);
        note(midi(root + 24 + MUS.arp[s]), musT, step * .8, "square", .012 + tension * .018);
        musStep++; musT += step;
      }
    } catch (e) {}
  }

  // ---------- Sfondi dei rivali (config.js → rivali → sfondo) ----------
  // Disegni tenui dietro ai personaggi, nel colore del rivale
  function backdrop(id, col) {
    c.save(); c.globalAlpha = .16; c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 2;
    if (id === "aula") {
      c.fillStyle = "#1D3B2E"; c.globalAlpha = .55; c.fillRect(W * .3, H * .06, W * .4, H * .3);
      c.globalAlpha = .25; c.strokeStyle = "#F1EFE8"; c.font = "16px monospace"; c.textAlign = "left"; c.fillStyle = "#F1EFE8";
      c.fillText("ping 127.0.0.1", W * .33, H * .16); c.fillText("ls -la", W * .33, H * .23); c.fillText("whoami", W * .33, H * .3);
      c.globalAlpha = .18; c.fillStyle = col; for (let i = 0; i < 4; i++) c.fillRect(W * (.05 + i * .25), H * .88, W * .18, 6);
    } else if (id === "laboratorio") {
      for (let i = 0; i < 6; i++) {
        const x = W * (.04 + i * .16), y = H * .74;
        c.fillRect(x, y, W * .11, H * .1); c.fillRect(x + W * .05, y + H * .1, W * .01, H * .04);
        c.globalAlpha = .1 + (Math.sin(t * 3 + i) + 1) * .06; c.fillStyle = "#F1EFE8"; c.fillRect(x + 4, y + 4, W * .11 - 8, H * .1 - 8);
        c.globalAlpha = .16; c.fillStyle = col;
      }
    } else if (id === "rete") {
      const N = [[.08, .2], [.22, .1], [.4, .25], [.6, .12], [.8, .22], [.93, .1], [.12, .85], [.5, .9], [.88, .85]];
      c.beginPath();
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) if (Math.abs(N[i][0] - N[j][0]) < .25) { c.moveTo(N[i][0] * W, N[i][1] * H); c.lineTo(N[j][0] * W, N[j][1] * H); }
      c.stroke();
      for (let i = 0; i < N.length; i++) { c.globalAlpha = .2 + (Math.sin(t * 4 + i * 2) + 1) * .12; c.beginPath(); c.arc(N[i][0] * W, N[i][1] * H, 6, 0, 6.3); c.fill(); }
    } else if (id === "kanban") {
      const cols = ["TODO", "DOING", "DONE"];
      c.font = "12px monospace"; c.textAlign = "center";
      for (let k = 0; k < 3; k++) {
        const x = W * (.3 + k * .14); c.globalAlpha = .3; c.fillText(cols[k], x + W * .05, H * .09);
        for (let n = 0; n < 4 - k; n++) { c.globalAlpha = .14; c.fillStyle = ["#FAC775", "#9FE1CB", "#F0997B"][(k + n) % 3]; c.fillRect(x, H * (.12 + n * .07), W * .1, H * .055); }
        c.fillStyle = col;
      }
    } else if (id === "server") {
      for (const x of [W * .02, W * .9]) {
        c.globalAlpha = .22; c.fillStyle = "#2C2C2A"; c.fillRect(x, H * .08, W * .08, H * .84);
        for (let r = 0; r < 12; r++) {
          c.globalAlpha = .5; c.fillStyle = (Math.floor(t * 6 + r * 7 + x) % 5) ? col : "#5DCAA5";
          c.fillRect(x + W * .012, H * (.1 + r * .068), 4, 4); c.fillRect(x + W * .03, H * (.1 + r * .068), 4, 4);
        }
      }
    } else if (id === "palco") {
      const g = c.createRadialGradient(W * .75, -H * .1, 10, W * .75, H * .5, H * .9);
      g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = .28; c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.globalAlpha = .2; c.fillStyle = col; c.fillRect(0, H * .9, W, H * .1);
    }
    c.restore();
  }

  // ---------- Effetti ----------
  function burst(x, y, n, col, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, s = Math.random() * sp;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, l: 1, col, sz: 2 + Math.random() * 3 });
    }
  }
  function popText(x, y, s, col) { txts.push({ x, y, s, col, l: 1 }); }

  // ---------- Disegno personaggi ----------
  // Opzione scelta di un gruppo dell'aspetto (vedi config.js → aspetto)
  function pick(gid) { const g = LOOKS.find((x) => x.id === gid), o = g.opzioni.find((x) => x.id === look[gid]); return o && hasIt(gid, o) ? o : g.opzioni[0]; }
  function playerLook() { return { skin: pick("pelle").col, hair: pick("capelli").col, aura: pick("aura").col, glasses: pick("occhiali").id, hat: pick("testa").id }; }

  // L = aspetto del giocatore; i rivali lo omettono e usano i colori di sempre
  function head(x, y, sc, jaw, eyes, col, aura, lose, glow, hood, L) {
    L = L || {};
    if (L.hat === "felpa") hood = 1;
    c.save(); c.translate(x, y); c.scale(sc, sc);
    if (aura > 5) {
      for (let k = 0; k < 3; k++) {
        const r = 95 + k * 18 + Math.sin(t * 6 + k) * 6 + aura * .35;
        c.strokeStyle = col; c.globalAlpha = (aura / 100) * .35 / (k + 1); c.lineWidth = 3; c.beginPath();
        for (let a = 0; a <= 6.3; a += .15) { const rr = r + Math.sin(a * 7 + t * 9 + k) * aura * .08; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        c.closePath(); c.stroke();
      }
      c.globalAlpha = 1;
    }
    if (hood) { c.fillStyle = "#2C2C2A"; c.beginPath(); c.moveTo(-78, 90); c.quadraticCurveTo(-85, -110, 0, -112); c.quadraticCurveTo(85, -110, 78, 90); c.closePath(); c.fill(); }
    const jw = 38 + jaw * 9, chin = 14 + jaw * 4;
    c.fillStyle = lose ? "#5F5E5A" : (L.skin || "#E8C9A8"); c.strokeStyle = "#2C2C2A"; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-50, -55); c.quadraticCurveTo(0, -95, 50, -55); c.lineTo(52, 0); c.lineTo(jw, 35); c.lineTo(chin, 70); c.lineTo(-chin, 70); c.lineTo(-jw, 35); c.lineTo(-52, 0); c.closePath(); c.fill(); c.stroke();
    if (!hood) { c.fillStyle = L.hair || "#2C2C2A"; c.beginPath(); c.moveTo(-54, -50); c.quadraticCurveTo(-30, -110, 10, -92); c.quadraticCurveTo(50, -110, 56, -48); c.quadraticCurveTo(20, -72, -54, -50); c.fill(); }
    if (jaw >= 3) { c.strokeStyle = "rgba(44,44,42,.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-jw + 6, 32); c.lineTo(-chin - 4, 62); c.moveTo(jw - 6, 32); c.lineTo(chin + 4, 62); c.stroke(); }
    const tilt = lose ? -.25 : eyes * .06;
    if (L.glasses === "sole" && !lose) {
      c.fillStyle = "#0a0a12"; c.beginPath(); c.roundRect(-46, -30, 40, 20, 8); c.roundRect(6, -30, 40, 20, 8); c.fill(); c.fillRect(-8, -25, 16, 4);
      c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-38, -25); c.lineTo(-28, -25); c.moveTo(14, -25); c.lineTo(24, -25); c.stroke();
    } else if (L.glasses === "visore" && !lose) {
      c.fillStyle = "#0a0a12"; c.beginPath(); c.roundRect(-52, -32, 104, 22, 11); c.fill();
      c.fillStyle = col; c.globalAlpha = .55 + Math.sin(t * 4) * .2; c.beginPath(); c.roundRect(-46, -27, 92, 12, 6); c.fill(); c.globalAlpha = 1;
      c.fillStyle = "rgba(255,255,255,.6)"; c.fillRect(-46 + ((t * 60) % 86), -27, 6, 12);
    } else if (eyes >= 4 && !lose && L.glasses !== "tondi") {
      c.fillStyle = "#0a0a12"; c.beginPath(); c.roundRect(-46, -28, 40, 18, 5); c.roundRect(6, -28, 40, 18, 5); c.fill(); c.fillRect(-8, -24, 16, 4);
      c.fillStyle = "#5DCAA5"; c.font = "9px monospace"; c.textAlign = "left"; c.fillText("root#", -42, -16); c.fillText("mog_", 10, -16);
    } else {
      c.strokeStyle = "#2C2C2A"; c.lineWidth = 3;
      for (const sx of [-1, 1]) {
        c.save(); c.translate(sx * 24, -20); c.rotate(sx * -tilt);
        c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(0, lose ? 6 : -6, 12, 0); c.stroke();
        c.fillStyle = "#2C2C2A"; c.beginPath(); c.arc(0, lose ? 3 : -1, 3.5, 0, 6.3); c.fill(); c.restore();
        c.save(); c.translate(sx * 24, -34); c.rotate(sx * (lose ? .35 : -.15 - eyes * .04)); c.fillRect(-14, -2, 28, 4); c.restore();
      }
    }
    if (L.glasses === "tondi") { c.strokeStyle = "#2C2C2A"; c.lineWidth = 2.5; c.beginPath(); c.arc(-24, -20, 14, 0, 6.3); c.moveTo(38, -20); c.arc(24, -20, 14, 0, 6.3); c.moveTo(-10, -22); c.lineTo(10, -22); c.stroke(); }
    c.strokeStyle = "#2C2C2A"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -10); c.lineTo(-5, 14); c.lineTo(4, 16); c.stroke();
    c.beginPath();
    if (lose) c.arc(0, 52, 10, 3.6, 5.8);
    else if (glow) { c.moveTo(-14, 40); c.quadraticCurveTo(4, 48, 16, 36); }
    else { c.moveTo(-12, 42); c.lineTo(12, 42); }
    c.stroke();
    if (lose) { c.fillStyle = "#85B7EB"; c.beginPath(); c.ellipse(-28, (t * 40) % 30, 3, 5, 0, 0, 6.3); c.fill(); }
    if (L.hat) hat(L.hat, col);
    c.restore();
  }

  // Accessori in testa, disegnati nello stesso sistema di coordinate di head()
  function hat(id, col) {
    c.fillStyle = col; c.strokeStyle = "#2C2C2A"; c.lineWidth = 2.5;
    if (id === "cappellino") {
      c.beginPath(); c.moveTo(-58, -54); c.bezierCurveTo(-58, -128, 58, -128, 58, -54); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(38, -54, 44, 8, 0, 0, 6.3); c.fill(); c.stroke();
    } else if (id === "cuffie") {
      c.strokeStyle = "#444441"; c.lineWidth = 7; c.beginPath(); c.arc(0, -22, 64, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.strokeStyle = "#2C2C2A"; c.lineWidth = 2;
      c.beginPath(); c.roundRect(-68, -36, 18, 38, 7); c.roundRect(50, -36, 18, 38, 7); c.fill(); c.stroke();
    } else if (id === "corona") {
      c.fillStyle = "#FAC775"; c.beginPath(); c.moveTo(-44, -70); c.lineTo(-44, -112); c.lineTo(-22, -88); c.lineTo(0, -122); c.lineTo(22, -88); c.lineTo(44, -112); c.lineTo(44, -70); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#E24B4A"; c.beginPath(); c.arc(0, -82, 5, 0, 6.3); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(-26, -78, 4, 0, 6.3); c.arc(26, -78, 4, 0, 6.3); c.fill();
    } else if (id === "bandana") {
      c.beginPath(); c.moveTo(-53, -60); c.quadraticCurveTo(0, -84, 53, -60); c.lineTo(53, -47); c.quadraticCurveTo(0, -70, -53, -47); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(52, -54); c.lineTo(72, -64); c.lineTo(68, -44); c.closePath(); c.fill(); c.stroke();
    }
  }

  function prof(x, y, sc, wave) {
    c.save(); c.translate(x, y); c.scale(sc, sc);
    c.strokeStyle = "rgba(250,199,117,.5)"; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -78, 26, 7, 0, 0, 6.3); c.stroke();
    c.fillStyle = "#534AB7"; c.beginPath(); c.moveTo(-42, 95); c.lineTo(-38, 40); c.quadraticCurveTo(0, 22, 38, 40); c.lineTo(42, 95); c.closePath(); c.fill();
    c.fillStyle = "#F1EFE8"; c.beginPath(); c.moveTo(-10, 30); c.lineTo(0, 58); c.lineTo(10, 30); c.closePath(); c.fill();
    c.fillStyle = "#E8C9A8"; c.strokeStyle = "#2C2C2A"; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -10, 30, 36, 0, 0, 6.3); c.fill(); c.stroke();
    c.fillStyle = "#888780"; c.beginPath(); c.ellipse(-28, -18, 7, 14, 0, 0, 6.3); c.ellipse(28, -18, 7, 14, 0, 0, 6.3); c.fill();
    c.strokeStyle = "#2C2C2A"; c.lineWidth = 2; c.beginPath(); c.arc(-12, -12, 8, 0, 6.3); c.moveTo(20, -12); c.arc(12, -12, 8, 0, 6.3); c.stroke();
    c.beginPath(); c.moveTo(-4, -12); c.lineTo(4, -12); c.stroke();
    c.fillStyle = "#2C2C2A"; c.beginPath(); c.arc(-12, -12, 2.2, 0, 6.3); c.fill(); c.beginPath(); c.arc(12, -12, 2.2, 0, 6.3); c.fill();
    c.beginPath(); c.moveTo(-10, 10); c.quadraticCurveTo(0, 18, 10, 10); c.stroke();
    c.save(); c.translate(40, 40); c.rotate(-.6 + Math.sin(t * 6) * (wave ? .35 : 0));
    c.fillStyle = "#534AB7"; c.fillRect(-6, -34, 12, 36); c.fillStyle = "#E8C9A8"; c.beginPath(); c.arc(0, -36, 7, 0, 6.3); c.fill();
    c.fillStyle = "#E24B4A"; c.fillRect(-3, -56, 6, 18); c.restore();
    c.restore();
  }

  function bar(x, y, w, v, col, label, right) {
    c.fillStyle = "rgba(255,255,255,.08)"; c.beginPath(); c.roundRect(x, y, w, 14, 7); c.fill();
    c.fillStyle = col; const fw = w * v / 100; c.beginPath(); c.roundRect(right ? x + w - fw : x, y, Math.max(fw, 1), 14, 7); c.fill();
    c.fillStyle = "#D3D1C7"; c.font = "500 12px sans-serif"; c.textAlign = right ? "right" : "left";
    c.fillText(label + "  " + Math.round(v) + "%", right ? x + w : x, y - 6);
  }

  function lightning(x1, y1, x2, y2, col) {
    c.strokeStyle = col; c.lineWidth = 2; c.globalAlpha = .8; c.beginPath(); c.moveTo(x1, y1);
    for (let i = 1; i < 10; i++) { const k = i / 10; c.lineTo(x1 + (x2 - x1) * k + (Math.random() - .5) * 14, y1 + (y2 - y1) * k + (Math.random() - .5) * 40); }
    c.lineTo(x2, y2); c.stroke(); c.globalAlpha = 1;
  }

  // ---------- Logica ----------
  // Conta le cariche dell'ultimo secondo: oltre MAX_CPS vengono ignorate
  function tooFast() {
    const now = performance.now();
    while (clicks.length && now - clicks[0] > 1000) clicks.shift();
    if (clicks.length >= MAX_CPS) return true;
    clicks.push(now); return false;
  }

  function charge() {
    if (phase !== "fight" || tooFast()) return;
    pA = Math.min(100, pA + 2.1 * (1 + S.aura * .3) * auraMul()); combo++;
    shake = Math.max(shake, 1.5); burst(W * .25, H * .55, 4, pick("aura").col, 4); snd(220 + pA * 4, .08, "square", .04);
    if (combo % 15 === 0) { popText(W * .25, H * .3, "sudo combo x" + combo, "#FAC775"); pA = Math.min(100, pA + 5); }
  }

  function qteHit() {
    const b = 12 * (1 + S.eyes * .4);
    pA = Math.min(100, pA + b); rA = Math.max(0, rA - 8 - S.eyes * 2);
    popText(W * .25, H * .25, qte.dt < .6 ? "Exploit riuscito" : "Accesso ottenuto", qte.dt < .6 ? "#FAC775" : "#9FE1CB");
    burst(W * .5, H * .2, 25, "#FAC775", 7); shake = 8; snd(880, .25, "triangle", .12);
    qte = null; qteT = 2 + Math.random() * 2;
  }

  function startFight() {
    phase = "fight"; pA = 0; rA = 0; qte = null; qteT = 2; combo = 0; cracks = []; parts = []; txts = [];
    endT = 0; bubble = null; tauntT = 1.2; fightT = 0; mentor = null; mentorUsed = false; clicks = [];
    document.getElementById("big").textContent = "Carica aura";
    snd(110, .4, "sawtooth", .1); ui();
  }

  function finish(w) {
    phase = "end"; win = w; endT = 0; shake = 18; flash = 1; bubble = null; mentor = null;
    if (w) {
      const g = Math.round((40 + lvl * 35) * (1 + S.charm * .1)); pts += g;
      popText(W / 2, H * .78, "+" + g + " mog points", "#FAC775");
      for (let i = 0; i < 6; i++) burst(W * .75, H * .5, 30, ["#EF9F27", "#5DCAA5", "#7F77DD", "#F0997B"][i % 4], 10);
      snd(80, 1.2, "sawtooth", .25); snd(660, .6, "triangle", .1);
      lvl = Math.min(lvl + 1, RIV.length); saveBest();
      if (lvl >= RIV.length) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => snd(f, .5, "triangle", .12), i * 180));
    } else {
      for (let i = 0; i < 14; i++) { const a = Math.random() * 6.283; cracks.push({ a, l: 60 + Math.random() * 260, j: [...Array(6)].map(() => (Math.random() - .5) * 40) }); }
      snd(55, 1.6, "sawtooth", .3); snd(40, 1.8, "square", .15);
      save();
    }
    ui();
  }

  function cst(u) { return u.costoBase + S[u.id] * u.costoPasso; }

  // Pannello potenziamenti generato dal catalogo in config.js.
  // Solo textContent, mai innerHTML: i testi non possono diventare codice.
  const upEls = {};
  for (const u of UPS) {
    const box = document.createElement("div"), b = document.createElement("b"),
      pips = document.createElement("span"), btn = document.createElement("button");
    box.className = "up"; pips.className = "pips";
    b.textContent = u.nome;
    btn.onclick = () => {
      const cost = cst(u);
      if (S[u.id] < u.max && pts >= cost) { pts -= cost; S[u.id]++; save(); snd(520, .2, "triangle", .1); ui(); }
    };
    const top = document.createElement("div"), desc = document.createElement("div");
    top.append(b, " ", pips); desc.className = "desc"; desc.textContent = u.desc;
    box.append(top, desc, btn);
    document.getElementById("ups").appendChild(box);
    upEls[u.id] = { pips, btn };
  }

  // Pannello Personaggio generato da config.js → aspetto (solo textContent)
  const lookBtns = [];
  for (const g of LOOKS) {
    const row = document.createElement("div"), lab = document.createElement("b"), opts = document.createElement("div");
    row.className = "lookrow"; lab.textContent = g.nome; row.append(lab, opts);
    for (const o of g.opzioni) {
      const btn = document.createElement("button");
      if (g.tipo === "colore") { btn.className = "sw"; btn.style.background = o.col; btn.title = o.nome; btn.setAttribute("aria-label", g.nome + ": " + o.nome); }
      else btn.textContent = o.nome;
      btn.onclick = () => buyOrWear(g, o);
      opts.appendChild(btn); lookBtns.push({ btn, g, o });
    }
    document.getElementById("lookopts").appendChild(row);
  }

  let optBtns = [];
  const shopMsg = document.getElementById("shopmsg");
  function buyOrWear(g, o) {
    if (!hasIt(g.id, o)) {
      const p = price(g.id, o);
      if (pts < p) { shopMsg.textContent = CFG.testoServono + " " + (p - pts) + "."; return; }
      pts -= p; owned.add(okey(g.id, o.id)); snd(660, .25, "triangle", .1);
      shopMsg.textContent = CFG.testoComprato + " " + o.nome + " (" + p + ").";
    } else shopMsg.textContent = "";
    look[g.id] = o.id; save(); ui();
  }

  // Anteprima del personaggio nel pannello, ridisegnata solo quando è aperto
  const pv = document.getElementById("pv"), pc = pv.getContext("2d"), lookBox = document.getElementById("lookbox");
  pv.width = 160 * dpr; pv.height = 180 * dpr; pc.setTransform(dpr, 0, 0, dpr, 0, 0);
  function drawPreview() {
    if (!lookBox.open) return;
    const main = c, PL = playerLook(); c = pc;
    c.fillStyle = "#0a0a12"; c.fillRect(0, 0, 160, 180);
    head(80, 104, .55, S.jaw + 1, S.eyes + 1, PL.aura, 60, false, true, 0, PL);
    c = main;
  }

  function ui() {
    for (const { btn, g, o } of lookBtns) {
      const locked = !hasIt(g.id, o), p = price(g.id, o);
      btn.setAttribute("aria-pressed", pick(g.id) === o ? "true" : "false");
      btn.classList.toggle("locked", locked);
      btn.classList.toggle("deal", locked && isDeal(g.id, o));
      if (g.tipo === "colore") { btn.dataset.cost = locked ? p : ""; btn.title = o.nome + (locked ? " · " + p + " mog points" : ""); }
      else btn.textContent = o.nome + (locked ? " · " + p : "");
    }
    document.getElementById("pts2").textContent = pts;
    for (const [k, b] of optBtns) b.setAttribute("aria-pressed", opt[k] ? "true" : "false");
    document.getElementById("deal").textContent = DEAL && !hasIt(DEAL.g.id, DEAL.o)
      ? CFG.testoOfferta + " " + DEAL.g.nome + " " + DEAL.o.nome + " (" + price(DEAL.g.id, DEAL.o) + ")." : "";
    document.getElementById("pts").textContent = pts;
    document.getElementById("lv").textContent = Math.min(lvl + 1, RIV.length);
    for (const u of UPS) {
      const e = upEls[u.id], full = S[u.id] >= u.max;
      e.pips.textContent = "●".repeat(S[u.id]) + "○".repeat(u.max - S[u.id]);
      e.btn.textContent = full ? "Massimo" : "Potenzia (" + cst(u) + ")";
      e.btn.style.opacity = (!full && pts >= cst(u)) ? 1 : .5;
    }
    const big = document.getElementById("big");
    if (phase === "end") big.textContent = lvl >= RIV.length && win ? CFG.testoPrestigio : win ? "Prossimo studente" : "Riprova";
    else if (phase === "menu") big.textContent = lvl >= RIV.length ? CFG.testoPrestigio : "Inizia la sfida";
    document.getElementById("pr").textContent = prestige;
    document.getElementById("prw").hidden = prestige === 0;
    const rec = best > 0 ? " Record: " + best + "/" + RIV.length + "." : "";
    document.getElementById("info").textContent = phase === "end"
      ? (win ? (lvl >= RIV.length ? "Corso completato. Grazie, prof. " + CFG.infoPrestigio : "Studente moggato. Spendi i mog points nei potenziamenti.") : "Sei stato moggato. Potenzia le statistiche e riprova.") + rec
      : "Spazio o tocco per caricare l'aura. Se sei in difficoltà, arriva il Prof." + rec;
  }

  // ---------- Input ----------
  cv.addEventListener("pointerdown", (e) => {
    if (phase !== "fight") { if (phase === "menu") document.getElementById("big").click(); return; }
    if (qte && !mentor) {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (Math.hypot(x - W / 2, y - H * .22) < 50) { qteHit(); return; }
    }
    charge();
  });
  document.getElementById("big").onclick = () => {
    if (phase === "fight") charge();
    else { if (lvl >= RIV.length) { prestige++; lvl = 0; S = freshStats(); pts = 0; save(); } startFight(); }
  };
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (e.repeat) return;
      if (phase === "fight") charge(); else document.getElementById("big").click();
      return;
    }
    if (phase === "fight" && qte && !mentor && e.key.toUpperCase() === qte.k) qteHit();
  });
  // Interruttori: effetti sonori, musica, riduci effetti
  optBtns = [["snd", "suono"], ["mus", "musica"], ["calm", "calma"]].map(([k, label]) => {
    const b = document.createElement("button");
    b.textContent = CFG.testiOpzioni[label];
    b.onclick = () => { opt[k] = !opt[k]; save(); ui(); };
    document.getElementById("opts").appendChild(b);
    return [k, b];
  });

  const resetBtn = document.getElementById("reset");
  resetBtn.textContent = CFG.testoAzzera;
  resetBtn.onclick = () => {
    if (phase === "fight" || !confirm(CFG.confermaAzzera)) return;
    resetAll(); phase = "menu"; win = false; ui();
  };
  ui();

  // ---------- Loop principale ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    const R = RIV[Math.min(lvl, RIV.length - 1)];

    if (phase === "fight") {
      fightT += dt;
      pA = Math.min(100, pA + S.jaw * 1.4 * dt * auraMul());
      rA = Math.min(100, rA + R.r * 60 * dt * (.8 + Math.sin(t * 2) * .3) * rivalMul());
      qteT -= dt;
      if (!qte && !mentor && qteT <= 0) { qte = { k: LETTERS[Math.floor(Math.random() * LETTERS.length)], dt: 0, life: 1.3 + S.reflex * .15 }; snd(990, .1, "square", .06); }
      if (qte) { qte.dt += dt; if (qte.dt > qte.life) { qte = null; qteT = 2 + Math.random() * 2; rA = Math.min(100, rA + 6); popText(W * .75, H * .25, "Exploit fallito", "#F09595"); } }
      tauntT -= dt;
      if (tauntT <= 0 && !mentor) { bubble = { s: R.tt[Math.floor(Math.random() * R.tt.length)], l: 2.2 }; tauntT = 3.5 + Math.random() * 2; snd(300, .15, "triangle", .05); }
      if (bubble) { bubble.l -= dt; if (bubble.l <= 0) bubble = null; }
      if (!mentorUsed && fightT > 3 && rA - pA > 20 && rA > 45) {
        mentorUsed = true; mentor = { k: 0, tip: TIPS[Math.floor(Math.random() * TIPS.length)], given: false }; bubble = null; qte = null;
        [392, 523, 659].forEach((f, i) => setTimeout(() => snd(f, .4, "triangle", .1), i * 120));
      }
      if (mentor) {
        mentor.k += dt;
        if (mentor.k > 1.1 && !mentor.given) { mentor.given = true; pA = Math.min(100, pA + 25); rA = Math.max(0, rA - 10); burst(W * .25, H * .5, 40, "#AFA9EC", 8); popText(W * .25, H * .3, "Consiglio del prof: +25 aura", "#CECBF6"); flash = .3; }
        if (mentor.k > 3.6) mentor = null;
      }
      if (pA >= 100) finish(true); else if (rA >= 100) finish(false);
    }
    if (phase === "end") endT += dt;
    shake *= .88; flash *= .92;
    if (opt.calm) { shake = 0; flash = 0; }

    c.save(); c.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    c.fillStyle = "#0a0a12"; c.fillRect(-20, -20, W + 40, H + 40);
    if (phase !== "end" || !win || lvl < RIV.length) backdrop(R.sfondo, R.col);

    const tension = phase === "fight" ? Math.max(pA, rA) / 100 : 0;
    c.font = "12px monospace"; c.textAlign = "left";
    for (const d of codeRain) {
      d.y += d.s * dt * (.15 + tension * .6);
      if (d.y > 1.05) { d.y = -.05; d.x = Math.random(); }
      c.fillStyle = "rgba(93,202,165," + (.08 + tension * .2) + ")";
      for (let k = 0; k < 5; k++) c.fillText(CH[(k + Math.floor(t * 8 + d.x * 20)) % CH.length], d.x * W, d.y * H - k * 13);
    }

    const px = W * .25, rx = W * .75, hy = H * .55;
    let ps = 1, rsc = 1;
    if (phase === "end") { const k = Math.min(1, endT * 2); if (win) { ps = 1 + k * .35; rsc = 1 - k * .45; } else { ps = 1 - k * .45; rsc = 1 + k * .35; } }
    if (phase === "fight" && !opt.calm && pA > 55 && rA > 55 && Math.random() < .5) lightning(px + 60, hy - 20, rx - 60, hy - 20, Math.random() < .5 ? "#5DCAA5" : R.col);

    const m = Math.min(1, W / 680) * 1.05;
    const finale = phase === "end" && win && lvl >= RIV.length;
    const PL = playerLook();
    head(px, hy, ps * m, S.jaw + 1, S.eyes + 1, PL.aura, phase === "end" ? (win ? 100 : 0) : pA, phase === "end" && !win, phase === "end" && win, 0, PL);
    if (!finale) head(rx, hy, rsc * m, R.j, R.e, R.col, phase === "end" ? (win ? 0 : 100) : rA, phase === "end" && win, phase === "end" && !win, R.hood);

    c.font = "500 13px sans-serif"; c.textAlign = "center";
    c.fillStyle = "#9FE1CB"; c.fillText("Tu", px, H - 18);
    if (!finale) { c.fillStyle = R.col; c.fillText(R.n, rx, H - 18); }

    if (mentor) {
      const k = Math.min(1, mentor.k * 2.5), out = Math.max(0, mentor.k - 3) * 2, mx = W * .5, my = H + 60 - (k - out) * 190 * m;
      prof(mx, my, m * .95, true);
      c.font = "13px sans-serif"; const tw = c.measureText(mentor.tip).width + 20;
      if (k >= 1 && out < .5) {
        const bx = Math.max(8, Math.min(W - tw - 8, mx - tw / 2)), by = my - 150 * m;
        c.fillStyle = "#CECBF6"; c.beginPath(); c.roundRect(bx, by, tw, 28, 8); c.fill();
        c.fillStyle = "#26215C"; c.textAlign = "left"; c.fillText(mentor.tip, bx + 10, by + 19);
      }
    }
    if (finale) {
      const k = Math.min(1, endT * 1.2);
      prof(rx, hy + 20 + (1 - k) * 200, m * 1.15, true);
      c.font = "500 13px sans-serif"; c.textAlign = "center"; c.fillStyle = "#CECBF6"; c.fillText("Il Prof", rx, H - 18);
    }
    if (bubble && phase === "fight") {
      c.font = "13px sans-serif";
      const tw = c.measureText(bubble.s).width + 20, bx = Math.min(W - tw - 8, rx - tw / 2), by = hy - 150 * m;
      c.globalAlpha = Math.min(1, bubble.l * 3); c.fillStyle = "#F1EFE8"; c.beginPath(); c.roundRect(bx, by, tw, 28, 8); c.fill();
      c.beginPath(); c.moveTo(rx - 6, by + 28); c.lineTo(rx + 4, by + 38); c.lineTo(rx + 8, by + 28); c.fill();
      c.fillStyle = "#2C2C2A"; c.textAlign = "left"; c.fillText(bubble.s, bx + 10, by + 19); c.globalAlpha = 1;
    }
    if (phase !== "menu" && !finale) { bar(20, 30, W * .4, pA, "#1D9E75", "Aura tua", false); bar(W * .6 - 20, 30, W * .4, rA, R.col, R.n, true); }

    for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += .12; p.l -= .015; c.globalAlpha = Math.max(0, p.l); c.fillStyle = p.col; c.fillRect(p.x, p.y, p.sz, p.sz); }
    c.globalAlpha = 1; parts = parts.filter((p) => p.l > 0);
    if (finale && Math.random() < .3) burst(Math.random() * W, -5, 3, ["#FAC775", "#AFA9EC", "#5DCAA5"][Math.floor(Math.random() * 3)], 2);
    for (const x of txts) { x.y -= .6; x.l -= .012; c.globalAlpha = Math.max(0, x.l); c.fillStyle = x.col; c.font = "500 18px sans-serif"; c.textAlign = "center"; c.fillText(x.s, x.x, x.y); }
    c.globalAlpha = 1; txts = txts.filter((x) => x.l > 0);

    if (qte && !mentor) {
      const k = 1 - qte.dt / qte.life;
      c.fillStyle = "rgba(250,199,117,.15)"; c.beginPath(); c.arc(W / 2, H * .22, 40, 0, 6.3); c.fill();
      c.strokeStyle = "#FAC775"; c.lineWidth = 4; c.beginPath(); c.arc(W / 2, H * .22, 40, -1.57, -1.57 + 6.283 * k); c.stroke();
      c.fillStyle = "#FAC775"; c.font = "500 34px monospace"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(qte.k, W / 2, H * .22 + 1); c.textBaseline = "alphabetic";
    }

    if (phase === "menu") {
      c.fillStyle = "rgba(10,10,18,.6)"; c.fillRect(0, 0, W, H); c.textAlign = "center";
      c.fillStyle = "#FAC775"; c.font = "500 " + Math.min(40, W / 12) + "px sans-serif"; c.fillText("MOG ARENA", W / 2, H * .32);
      c.fillStyle = "#5DCAA5"; c.font = "500 16px monospace"; c.fillText("> scuola_edition.sh", W / 2, H * .32 + 30);
      c.fillStyle = "#D3D1C7"; c.font = "14px sans-serif"; c.fillText("6 studenti del corso. Una sola mascella sopravvive.", W / 2, H * .32 + 58);
      c.fillStyle = "#CECBF6"; c.fillText("Con la partecipazione speciale del Prof, il mentore", W / 2, H * .32 + 80);
      c.fillStyle = "#D3D1C7"; c.fillText("Premi spazio o tocca per iniziare", W / 2, H * .32 + 108);
    }
    c.restore();

    if (phase === "end") {
      if (!win) {
        c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.5;
        for (const k of cracks) {
          const L = k.l * Math.min(1, endT * 3); c.beginPath(); c.moveTo(W / 2, H / 2);
          for (let i = 1; i <= 6; i++) { const d = L * i / 6; c.lineTo(W / 2 + Math.cos(k.a) * d + k.j[i - 1] * Math.sin(k.a), H / 2 + Math.sin(k.a) * d - k.j[i - 1] * Math.cos(k.a)); }
          c.stroke();
        }
        c.fillStyle = "rgba(120,0,0," + Math.min(.35, endT * .5) + ")"; c.fillRect(0, 0, W, H);
      }
      const k = Math.min(1, endT * 2.5), sc = k < 1 ? .3 + k * k * 1.1 : 1 + Math.sin(t * 5) * .03;
      c.save(); c.translate(W / 2, H * .17 + Math.sin(t * 3) * 3); c.scale(sc, sc); c.textAlign = "center"; c.textBaseline = "middle";
      const fs = Math.min(finale ? 36 : 46, W / 15); c.font = "500 " + fs + "px sans-serif";
      const msg = finale ? "CORSO COMPLETATO" : win ? "STUDENTE MOGGATO" : "YOU HAVE BEEN MOGGED";
      for (let i = 4; i > 0; i--) { c.fillStyle = win ? "rgba(239,159,39,.12)" : "rgba(226,75,74,.15)"; c.fillText(msg, i * 1.5, i * 1.5); }
      c.fillStyle = win ? "#FAC775" : "#F09595"; c.fillText(msg, 0, 0);
      if (endT > .6) {
        c.font = "14px monospace"; c.fillStyle = "#D3D1C7";
        c.fillText(finale ? "[+] tutti gli studenti pwned" : win ? "[+] " + RIV[Math.max(0, lvl - 1)].n + " pwned" : "[-] da " + R.n, 0, fs * .85);
      }
      c.restore();
      if (finale && endT > 1.5) {
        c.globalAlpha = Math.min(1, endT - 1.5);
        const bw = Math.min(W - 40, 440), bx = (W - bw) / 2, by = H * .3;
        c.fillStyle = "rgba(38,33,92,.85)"; c.beginPath(); c.roundRect(bx, by, bw, 62, 10); c.fill();
        c.textAlign = "center"; c.fillStyle = "#FAC775"; c.font = "500 17px sans-serif"; c.fillText(CFG.dedicaTitolo, W / 2, by + 26);
        c.fillStyle = "#CECBF6"; c.font = "13px sans-serif"; c.fillText(CFG.dedicaSottotitolo, W / 2, by + 47);
        c.globalAlpha = 1;
      }
    }
    if (flash > .02) { c.fillStyle = "rgba(255,255,255," + flash + ")"; c.fillRect(0, 0, W, H); }
    drawPreview();
    music(tension);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
