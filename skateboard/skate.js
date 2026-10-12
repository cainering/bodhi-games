/* Bodhi's Skate Park.
   Paint your own board, then ride it through a skate park with ramps, rails, stairs, a half-pipe and mega ramps.
   No timers, no losing: bad landings just wobble and keep rolling. All sounds are made with Web Audio. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var KEY_DECK = "bodhi-skate-deck", KEY_RIDER = "bodhi-skate-rider", KEY_STARS = "bodhi-skate-stars";
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var EMOJI_FONT = "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";

  /* ---------------- Speech ---------------- */
  function speak(text, voice) {
    if (window.KidsVoice) { window.KidsVoice.say([{ text: text, lang: "en", voice: voice || "" }], { rate: 1.0, pitch: 1.3 }); return; }
    var s = window.speechSynthesis;
    if (!s || typeof SpeechSynthesisUtterance === "undefined") return;
    try {
      s.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 1.0; u.pitch = 1.3;
      s.speak(u);
    } catch (e) {}
  }

  /* ---------------- Sound effects (Web Audio, gentle volumes) ---------------- */
  var actx = null, master = null, noiseBuf = null;
  function audio() {
    if (!actx) {
      var A = window.AudioContext || window.webkitAudioContext;
      if (A) { try { actx = new A(); master = actx.createGain(); master.gain.value = 0.55; master.connect(actx.destination); } catch (e) { actx = null; } }
    }
    if (actx && actx.state === "suspended") { try { actx.resume(); } catch (e) {} }
    return actx;
  }
  function getNoise(c) {
    if (!noiseBuf) {
      var len = c.sampleRate, d;
      noiseBuf = c.createBuffer(1, len, c.sampleRate); d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  function env(g, t, vol, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f1, f2, dur, vol, delay) {
    var c = audio(); if (!c) return;
    var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
    env(g, t, vol, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(dur, vol, f1, f2, q, type, delay) {
    var c = audio(); if (!c) return;
    var t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = getNoise(c); s.loop = true;
    f.type = type || "bandpass"; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2 || f1, t + dur);
    env(g, t, vol, dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  function loopNoise(freq, q, type) {
    var c = audio(); if (!c) return null;
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = getNoise(c); s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start();
    return { g: g, f: f };
  }
  function setLoop(l, vol) { if (l && actx) l.g.gain.setTargetAtTime(vol, actx.currentTime, 0.05); }
  var sfx = {
    pop: function () { tone("square", 220, 70, 0.09, 0.18); hiss(0.05, 0.25, 2500, 2500, 1.2); },
    land: function () { hiss(0.14, 0.35, 700, 300, 0.8, "lowpass"); tone("sine", 140, 50, 0.14, 0.35); },
    whoosh: function () { hiss(0.5, 0.3, 350, 2400, 1.6); },
    flick: function () { tone("triangle", 900, 1500, 0.06, 0.2); tone("triangle", 900, 1500, 0.06, 0.2, 0.13); tone("triangle", 900, 1500, 0.06, 0.2, 0.26); },
    boing: function () { tone("sine", 260, 900, 0.28, 0.3); },
    wheee: function () { tone("sine", 500, 1300, 0.5, 0.22); tone("triangle", 520, 1350, 0.5, 0.1, 0.03); },
    ding: function () { tone("triangle", 1320, 1320, 0.14, 0.2); tone("triangle", 1760, 1760, 0.2, 0.2, 0.08); },
    cheer: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone("triangle", f, f, 0.22, 0.2, i * 0.09); }); },
    wobble: function () {
      var c = audio(); if (!c) return;
      var t = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(620, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.8);
      lfo.frequency.value = 11; lg.gain.value = 70; lfo.connect(lg); lg.connect(o.frequency);
      env(g, t, 0.3, 0.85); o.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + 0.9); lfo.stop(t + 0.9);
    },
    clunk: function () { tone("square", 160, 90, 0.07, 0.12); hiss(0.08, 0.2, 900, 500, 1, "lowpass"); }
  };
  var rollLoop = null, grindLoop = null, chargeOsc = null;
  function startLoops() {
    if (rollLoop || !audio()) return;
    rollLoop = loopNoise(260, 0.7, "lowpass");
    grindLoop = loopNoise(3200, 6, "bandpass");
  }
  function chargeStart() {
    var c = audio(); if (!c || chargeOsc) return;
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = "triangle"; o.frequency.setValueAtTime(220, t); o.frequency.linearRampToValueAtTime(880, t + 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.05);
    o.connect(g); g.connect(master); o.start(t); chargeOsc = { o: o, g: g };
  }
  function chargeStop() {
    if (!chargeOsc || !actx) { chargeOsc = null; return; }
    var t = actx.currentTime; chargeOsc.g.gain.setTargetAtTime(0.0001, t, 0.02); chargeOsc.o.stop(t + 0.15); chargeOsc = null;
  }

  /* ---------------- Characters ---------------- */
  var RIDERS = [
    { id: "tommy", name: "Tommy the Tiger", img: "img/tommy.jpg", crop: [145, 95, 88], fur: "#f39a2b", dark: "#3a2208", shirt: "#e53935", shorts: "#1e5bd8", letter: "T", letterColor: "#ffd23f", hands: "#f39a2b" },
    { id: "bonkers", name: "Bonkers the Dog", img: "img/bonkers.jpg", crop: [262, 138, 80], fur: "#e9b36a", dark: "#8a5524", shirt: "#e9b36a", shorts: "#e9b36a", letter: "", letterColor: "", hands: "#fff5e6" },
    { id: "smash", name: "Mr. Smash", img: "img/smash.jpg", crop: [186, 118, 88], fur: "#8c9cc9", dark: "#3a3f5c", shirt: "#f6c33a", shorts: "#6a3bb5", letter: "S", letterColor: "#e53935", hands: "#e53935" }
  ];
  var imgs = {};
  RIDERS.forEach(function (r) { var i = new Image(); i.src = r.img; imgs[r.id] = i; });
  var riderId = load(KEY_RIDER) || "tommy";
  function rider() { for (var i = 0; i < RIDERS.length; i++) if (RIDERS[i].id === riderId) return RIDERS[i]; return RIDERS[0]; }

  /* ---------------- Paint ---------------- */
  var DW = 900, DH = 250;
  var deck = $("deck"), dctx = deck.getContext("2d");
  var art = document.createElement("canvas"); art.width = DW; art.height = DH;
  var actx2 = art.getContext("2d");
  function deckPath(c, w, h, inset) {
    var r = h / 2 - inset; c.beginPath();
    c.moveTo(h / 2, inset); c.lineTo(w - h / 2, inset); c.arc(w - h / 2, h / 2, r, -Math.PI / 2, Math.PI / 2);
    c.lineTo(h / 2, h - inset); c.arc(h / 2, h / 2, r, Math.PI / 2, Math.PI * 1.5); c.closePath();
  }
  function defaultArt() {
    var c = actx2; c.fillStyle = "#ffd23f"; c.fillRect(0, 0, DW, DH);
    c.fillStyle = "#f07a1a";
    for (var i = 0; i < 7; i++) { var x = 60 + i * 125; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 50, 0); c.lineTo(x + 10, 95); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x, DH); c.lineTo(x + 50, DH); c.lineTo(x + 25, DH - 80); c.closePath(); c.fill(); }
    c.font = "900 120px 'Trebuchet MS', 'Avenir Next', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = 14; c.strokeStyle = "#3a2208"; c.strokeText("BODHI", DW / 2, DH / 2 + 6); c.fillStyle = "#fff"; c.fillText("BODHI", DW / 2, DH / 2 + 6);
  }
  function renderDeck() {
    dctx.clearRect(0, 0, DW, DH);
    dctx.save(); deckPath(dctx, DW, DH, 6); dctx.clip(); dctx.drawImage(art, 0, 0); dctx.restore();
    dctx.fillStyle = "rgba(58,34,8,.55)";
    [[200, 95], [200, 155], [260, 95], [260, 155], [640, 95], [640, 155], [700, 95], [700, 155]].forEach(function (b) { dctx.beginPath(); dctx.arc(b[0], b[1], 7, 0, Math.PI * 2); dctx.fill(); });
    deckPath(dctx, DW, DH, 6); dctx.lineWidth = 10; dctx.strokeStyle = "#3a2208"; dctx.stroke();
  }
  function saveDeck() { try { store(KEY_DECK, art.toDataURL("image/png")); } catch (e) {} }
  (function () {
    defaultArt(); renderDeck();
    var saved = load(KEY_DECK);
    if (saved) { var im = new Image(); im.onload = function () { actx2.clearRect(0, 0, DW, DH); actx2.drawImage(im, 0, 0); renderDeck(); }; im.src = saved; }
  })();

  var COLORS = ["#e53935", "#ff8a1f", "#ffd23f", "#8bd34a", "#2e9e4f", "#7fdbff", "#1e88e5", "#283593", "#8e24aa", "#6d4c41", "#212121", "#ffffff"];
  var TOOLS = [
    { id: "thin", icon: "🖍️", label: "Thin" }, { id: "fat", icon: "🖌️", label: "Fat" }, { id: "rainbow", icon: "🌈", label: "Rainbow" },
    { id: "fill", icon: "🪣", label: "Fill" }, { id: "clear", icon: "🧽", label: "Clear" }
  ];
  var STAMPS = ["⭐", "🔥", "⚡", "🚀", "💥", "🐾", "🦖", "😎", "face:tommy", "face:bonkers", "face:smash"];
  var color = "#e53935", tool = "fat", hue = 0, undo = [];
  function pushUndo() { try { undo.push(actx2.getImageData(0, 0, DW, DH)); if (undo.length > 12) undo.shift(); } catch (e) {} }
  function sel(container, el) { Array.prototype.forEach.call(document.querySelectorAll(".sk-tool, .sk-stamp"), function (b) { b.classList.remove("on"); }); if (el) el.classList.add("on"); }
  COLORS.forEach(function (c) {
    var b = document.createElement("button"); b.type = "button"; b.className = "sk-swatch" + (c === color ? " on" : ""); b.style.background = c; b.setAttribute("aria-label", "color");
    b.addEventListener("click", function () {
      color = c; Array.prototype.forEach.call(document.querySelectorAll(".sk-swatch"), function (s) { s.classList.remove("on"); }); b.classList.add("on");
      if (tool !== "fill" && tool !== "thin" && tool !== "fat") { tool = "fat"; sel(null, document.querySelector('[data-tool="fat"]')); }
      tone("sine", 700, 900, 0.08, 0.12);
    });
    $("colors").appendChild(b);
  });
  TOOLS.forEach(function (t) {
    var b = document.createElement("button"); b.type = "button"; b.className = "sk-tool" + (t.id === tool ? " on" : ""); b.dataset.tool = t.id;
    b.innerHTML = t.icon + "<span>" + t.label + "</span>";
    b.addEventListener("click", function () {
      if (t.id === "clear") { pushUndo(); actx2.fillStyle = "#fff"; actx2.fillRect(0, 0, DW, DH); renderDeck(); saveDeck(); hiss(0.4, 0.25, 3000, 600, 1); speak("All clean!"); return; }
      tool = t.id; sel(null, b); tone("sine", 600, 800, 0.08, 0.12);
    });
    $("tools").appendChild(b);
  });
  STAMPS.forEach(function (s) {
    var b = document.createElement("button"); b.type = "button"; b.className = "sk-stamp"; b.dataset.stamp = s;
    if (s.indexOf("face:") === 0) { var r = RIDERS.filter(function (x) { return "face:" + x.id === s; })[0]; b.innerHTML = '<img src="' + r.img + '" alt="' + r.name + '">'; }
    else b.textContent = s;
    b.addEventListener("click", function () { tool = "stamp:" + s; sel(null, b); tone("sine", 800, 1000, 0.08, 0.12); });
    $("stamps").appendChild(b);
  });
  $("paint-undo").addEventListener("click", function () { if (undo.length) { actx2.putImageData(undo.pop(), 0, 0); renderDeck(); saveDeck(); tone("sine", 900, 500, 0.12, 0.15); } });

  function drawStamp(s, x, y) {
    var c = actx2, size = 110;
    c.save(); c.translate(x, y); c.rotate((Math.random() - 0.5) * 0.5);
    if (s.indexOf("face:") === 0) {
      var r = RIDERS.filter(function (q) { return "face:" + q.id === s; })[0], im = imgs[r.id], cr = r.crop, R = 62;
      c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();
      c.save(); c.clip(); if (im.complete && im.naturalWidth) c.drawImage(im, cr[0] - cr[2], cr[1] - cr[2], cr[2] * 2, cr[2] * 2, -R, -R, R * 2, R * 2); c.restore();
      c.lineWidth = 7; c.strokeStyle = "#3a2208"; c.stroke();
    } else {
      c.font = size + "px " + EMOJI_FONT; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(s, 0, 6);
    }
    c.restore();
  }
  var painting = false, last = null, lastStamp = null;
  function deckPos(e) { var r = deck.getBoundingClientRect(); return { x: (e.clientX - r.left) * DW / r.width, y: (e.clientY - r.top) * DH / r.height }; }
  function strokeTo(p) {
    var c = actx2, w = tool === "thin" ? 16 : 46;
    if (tool === "rainbow") { hue = (hue + 6) % 360; c.strokeStyle = "hsl(" + hue + ",90%,55%)"; w = 40; } else c.strokeStyle = color;
    c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(p.x + 0.01, p.y); c.stroke(); last = p;
  }
  deck.addEventListener("pointerdown", function (e) {
    e.preventDefault(); audio(); try { deck.setPointerCapture(e.pointerId); } catch (er) {}
    var p = deckPos(e); pushUndo();
    if (tool === "fill") { actx2.fillStyle = color; actx2.fillRect(0, 0, DW, DH); renderDeck(); saveDeck(); hiss(0.3, 0.2, 500, 1500, 1); return; }
    if (tool.indexOf("stamp:") === 0) { drawStamp(tool.slice(6), p.x, p.y); lastStamp = p; painting = true; renderDeck(); tone("sine", 500, 1100, 0.12, 0.2); return; }
    painting = true; last = p; strokeTo(p); renderDeck();
  });
  deck.addEventListener("pointermove", function (e) {
    if (!painting) return; var p = deckPos(e);
    if (tool.indexOf("stamp:") === 0) { if (Math.hypot(p.x - lastStamp.x, p.y - lastStamp.y) > 120) { drawStamp(tool.slice(6), p.x, p.y); lastStamp = p; renderDeck(); tone("sine", 500, 1100, 0.1, 0.15); } return; }
    strokeTo(p); renderDeck();
  });
  function endPaint() { if (painting) { painting = false; saveDeck(); } }
  deck.addEventListener("pointerup", endPaint); deck.addEventListener("pointercancel", endPaint);

  RIDERS.forEach(function (r) {
    var b = document.createElement("button"); b.type = "button"; b.className = "sk-rider" + (r.id === riderId ? " on" : ""); b.setAttribute("aria-label", r.name);
    b.innerHTML = '<img src="' + r.img + '" alt="' + r.name + '">';
    b.addEventListener("click", function () {
      riderId = r.id; store(KEY_RIDER, r.id);
      Array.prototype.forEach.call(document.querySelectorAll(".sk-rider"), function (x) { x.classList.remove("on"); }); b.classList.add("on");
      sfx.boing(); speak(r.name + "!", /^(tommy|bonkers|smash)$/.test(r.id) ? r.id : "");
    });
    $("riders").appendChild(b);
  });

  /* ---------------- Screens ---------------- */
  var firstRide = true;
  function showRide() {
    document.body.dataset.screen = "ride"; $("paint").hidden = true; $("ride").hidden = false; window.scrollTo(0, 0);
    audio(); startLoops(); resize(); running = true; lastT = 0; requestAnimationFrame(frame);
    if (firstRide) { firstRide = false; showText("LET'S RIDE!", "Hold JUMP to go super high!"); speak("Let's ride! Hold the jump button to jump super high!"); }
    else speak("Let's go!");
  }
  function showPaint() {
    running = false; setLoop(rollLoop, 0); setLoop(grindLoop, 0); chargeStop();
    document.body.dataset.screen = "paint"; $("ride").hidden = true; $("paint").hidden = false;
    speak("Paint your board!");
  }
  $("go-ride").addEventListener("click", showRide);
  $("to-paint").addEventListener("click", showPaint);

  /* ---------------- Skate park world ---------------- */
  var VX = 340, G = 1500;
  var pieces = [], rails = [], stars = [], signs = [], genX = 0, bag = [], lastKind = "";
  var FIRST = ["kicker", "rail", "mega", "funbox", "halfpipe", "stairs", "qp"];
  function add(kind, len, fn, o) {
    var p = { kind: kind, x0: genX, x1: genX + len, fn: fn, launch: 0, lip: null, body: null, copings: [] };
    for (var k in o) p[k] = o[k];
    pieces.push(p); genX += len; return p;
  }
  function flatFn() { return 0; }
  function addRail(pts, style) { rails.push({ pts: pts, x0: pts[0][0], x1: pts[pts.length - 1][0], style: style || "rail" }); }
  function addStar(x, y) { stars.push({ x: x, y: y, got: false, ph: Math.random() * 6 }); }
  function arcStars(lx, ly, vy, times) { times.forEach(function (t) { addStar(lx + VX * t, ly + vy * t - G * t * t / 2 + 55); }); }
  function nextKind() {
    if (FIRST.length) return FIRST.shift();
    if (!bag.length) { bag = ["kicker", "mega", "qp", "halfpipe", "funbox", "stairs", "rail", "kicker", "rail", "mega", "funbox"]; for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t; } }
    var k = bag.pop(); if (k === lastKind && bag.length) { bag.unshift(k); k = bag.pop(); }
    return k;
  }
  function build(kind) {
    var x = genX, gap = 430 + Math.random() * 180;
    lastKind = kind;
    if (kind === "kicker") {
      var L = 220, H = 110;
      add(kind, L + 2, function (l) { return l <= L ? H * Math.pow(l / L, 2.2) : 0; }, { launch: 760, lip: x + L, body: "#6fb3ea", copings: [[x + L, H]] });
      arcStars(x + L, H, 760, [0.35, 0.6]);
    } else if (kind === "mega") {
      var L2 = 480, H2 = 250;
      signs.push({ x: x - 120, text: "BIG JUMP!", color: "#e53935" });
      add(kind, L2 + 2, function (l) { return l <= L2 ? H2 * Math.pow(l / L2, 2.3) : 0; }, { launch: 1150, lip: x + L2, body: "#5aa0dc", copings: [[x + L2, H2]] });
      arcStars(x + L2, H2, 1150, [0.4, 0.77, 1.15]); gap += 260;
    } else if (kind === "qp") {
      var L3 = 230, H3 = 220;
      signs.push({ x: x - 140, text: "SKY HIGH!", color: "#1e88e5" });
      add(kind, L3 + 2, function (l) { if (l > L3) return 0; var u = Math.min(l / L3, 0.985); return H3 * (1 - Math.sqrt(1 - u * u)); }, { launch: 1250, lip: x + L3, body: "#6fb3ea", copings: [[x + L3, H3 * (1 - Math.sqrt(1 - 0.985 * 0.985))]] });
      arcStars(x + L3, H3, 1250, [0.5, 0.83, 1.2]); gap += 260;
    } else if (kind === "halfpipe") {
      var D = 170, Wd = 200, B = 240, W2 = 230, uc = 0.985, top = -D + W2 * (1 - Math.sqrt(1 - uc * uc)), lipX = x + 60 + Wd + B + Wd;
      signs.push({ x: x - 160, text: "HALF-PIPE", color: "#8e24aa" });
      add(kind, 60 + Wd + B + Wd + 140 + 150, function (l) {
        if (l < 60) return 0; l -= 60;
        if (l < Wd) { var u = 1 - l / Wd; return -D + D * (1 - Math.sqrt(Math.max(0, 1 - u * u))); } l -= Wd;
        if (l < B) return -D; l -= B;
        if (l < Wd) { var v = Math.min(l / Wd, uc); return -D + W2 * (1 - Math.sqrt(1 - v * v)); } l -= Wd;
        if (l < 140) return top; l -= 140;
        return top * (1 - l / 150);
      }, { launch: 1100, lip: lipX, body: "#6fb3ea", copings: [[x + 60, 0], [lipX, top]] });
      arcStars(lipX, top, 1100, [0.45, 0.73, 1.1]); gap += 200;
    } else if (kind === "funbox") {
      var H4 = 80;
      add(kind, 170 + 320 + 170, function (l) { if (l < 170) return H4 * l / 170; if (l < 490) return H4; return H4 * (1 - (l - 490) / 170); }, { body: "#f0a35e" });
      addRail([[x + 190, H4 + 12], [x + 470, H4 + 12]], "ledge");
      addStar(x + 260, H4 + 150); addStar(x + 400, H4 + 150);
    } else if (kind === "stairs") {
      var H5 = 132, N = 6, SW = 50;
      add(kind, 220 + 240 + N * SW, function (l) {
        if (l < 220) { var t = l / 220; return H5 * t * t * (3 - 2 * t); }
        if (l < 460) return H5;
        var i = Math.floor((l - 460) / SW) + 1; return H5 * (1 - i / N);
      }, { body: "#b8bdc6", stairs: { x: x + 460, n: N, w: SW, h: H5 } });
      addRail([[x + 320, H5 + 52], [x + 460, H5 + 52], [x + 460 + N * SW, 52]], "rail");
      addStar(x + 400, H5 + 130); addStar(x + 560, H5 + 60);
    } else if (kind === "rail") {
      add(kind, 560, flatFn, {});
      addRail([[x + 100, 56], [x + 470, 56]], "rail");
      addStar(x + 200, 140); addStar(x + 330, 140); addStar(x + 440, 140);
    }
    add("flat", gap, flatFn, {});
  }
  function resetWorld() {
    pieces = []; rails = []; stars = []; signs = []; genX = 0; bag = [];
    FIRST = ["kicker", "rail", "mega", "funbox", "halfpipe", "stairs", "qp"];
    signs.push({ x: 380, text: "BODHI'S SKATE PARK", color: "#f07a1a", big: true });
    add("flat", 820, flatFn, {});
  }
  function ensureWorld(x) {
    while (genX < x + 3500) build(nextKind());
    var cut = x - 1600;
    if (pieces.length && pieces[0].x1 < cut) pieces = pieces.filter(function (p) { return p.x1 >= cut; });
    rails = rails.filter(function (r) { return r.x1 >= cut; }); stars = stars.filter(function (s) { return s.x >= cut; }); signs = signs.filter(function (s) { return s.x >= cut - 400; });
  }
  function pieceAt(x) { for (var i = 0; i < pieces.length; i++) { var p = pieces[i]; if (x >= p.x0 && x < p.x1) return p; } return null; }
  function groundAt(x) { var p = pieceAt(x); return p ? p.fn(x - p.x0) : 0; }
  function railY(r, x) {
    if (x < r.x0 || x > r.x1) return null;
    for (var i = 0; i < r.pts.length - 1; i++) { var a = r.pts[i], b = r.pts[i + 1]; if (x >= a[0] && x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / Math.max(1, b[0] - a[0]); }
    return null;
  }

  /* ---------------- Rider state ---------------- */
  var S;
  var totalStars = parseInt(load(KEY_STARS) || "0", 10) || 0;
  function resetRider() {
    S = { x: 120, y: 0, vy: 0, grounded: true, angle: 0, trick: null, queue: null, combo: 0, airT: 0, maxAlt: 0, apexSaid: false,
      wobble: 0, land: 0, grind: null, wantGrind: 0, grindQueued: null, charging: false, charge: 0, jumpBuffer: 0, bufferPower: 0,
      manual: 0, sinceGround: 0, time: 0, bounce: false };
  }
  var cam = { y: 0, s: 1 }, particles = [], lastTextAt = -9;
  resetWorld(); resetRider();
  function addStars(n) { totalStars += n; $("star-count").textContent = totalStars; store(KEY_STARS, String(totalStars)); }
  $("star-count").textContent = totalStars;
  function showText(main, sub) {
    var el = $("trick-text"); el.innerHTML = main + (sub ? "<small>" + sub + "</small>" : "");
    el.classList.remove("show"); void el.offsetWidth; el.classList.add("show"); lastTextAt = S ? S.time : 0;
  }

  var TRICKS = {
    kickflip: { dur: 0.5, name: "KICKFLIP!", say: "Kickflip!", snd: "flick" },
    spin: { dur: 0.7, name: "360 SPIN!", say: "Three sixty!", snd: "whoosh" },
    grab: { dur: 0.8, names: ["TAIL GRAB!", "NOSE GRAB!", "INDY GRAB!"], says: ["Tail grab!", "Nose grab!", "Indy grab!"], snd: "boing" },
    superman: { dur: 0.85, name: "SUPERMAN!", say: "Superman!", snd: "wheee" }
  };
  var grabIdx = 0;
  function jumpVy(power) { return 680 + 950 * power; }
  function doJump(power, quiet) {
    var base = S.grounded || S.grind ? Math.max(S.vy, 0) : 0;
    if (S.grind) endGrind();
    S.vy = Math.min(1700, base + jumpVy(power)); S.grounded = false; S.sinceGround = 0; S.manual = 0;
    takeoff(); if (!quiet) sfx.pop();
    if (power > 0.7) { sfx.wheee(); }
  }
  function takeoff() { S.airT = 0; S.maxAlt = 0; S.apexSaid = false; S.combo = 0; S.bounce = false; }
  function startTrick(type) {
    var T = TRICKS[type], name = T.name, say = T.say;
    if (type === "grab") { name = T.names[grabIdx % 3]; say = T.says[grabIdx % 3]; grabIdx++; }
    S.trick = { type: type, t: 0, dur: T.dur }; S.combo++;
    sfx[T.snd](); showText(name, S.combo >= 2 ? "COMBO x" + S.combo : ""); speak(say); addStars(1);
  }
  function trickButton(type) {
    audio();
    if (type === "grind") return grindButton();
    if (S.grind) { doJump(0.1); startTrick(type); return; }
    if (S.grounded) { doJump(0.05); startTrick(type); return; }
    if (S.trick) { S.queue = type; return; }
    startTrick(type);
  }
  function railAhead() {
    var best = null;
    rails.forEach(function (r) { if (r.x1 > S.x + 40 && r.x0 < S.x + VX * 1.6 && (!best || r.x0 < best.x0)) best = r; });
    return best;
  }
  function popToRail(r) {
    var X = Math.max(r.x0 + 30, S.x + VX * 0.45), tR = (X - S.x) / VX, ry = railY(r, X);
    if (ry === null) { ry = railY(r, r.x1 - 5); }
    var vy = (ry + 8 - S.y + 0.5 * G * tR * tR) / tR;
    S.vy = clamp(vy, 350, 1600); S.grounded = false; S.manual = 0; takeoff(); sfx.pop(); S.wantGrind = 1.6;
  }
  function grindButton() {
    if (S.grind) return;
    var r = railAhead();
    if (r) {
      if (!S.grounded) { S.wantGrind = 1.6; return; }
      var tR = (Math.max(r.x0 + 30, S.x) - S.x) / VX;
      if (tR <= 0.7) popToRail(r); else { S.grindQueued = r; S.wantGrind = 0; }
      return;
    }
    if (S.grounded) { S.manual = 1.3; S.combo = 0; showText("MANUAL!"); speak("Manual!"); sfx.boing(); addStars(1); }
    else if (S.trick) S.queue = "superman"; else startTrick("superman");
  }
  function startGrind(r) {
    S.grind = r; S.grounded = false; S.trick = null; S.queue = null; S.wantGrind = 0; S.grindQueued = null; S.combo++;
    S.y = railY(r, S.x); sfx.clunk(); showText(r.style === "ledge" ? "BOARD SLIDE!" : "GRIND!", S.combo >= 2 ? "COMBO x" + S.combo : "");
    speak(r.style === "ledge" ? "Board slide!" : "Grind!"); addStars(1);
  }
  function endGrind() { S.grind = null; setLoop(grindLoop, 0); }
  function landed() {
    var t = S.trick, bad = false;
    if (t) { var p = t.t / t.dur; bad = (t.type === "kickflip" || t.type === "spin") ? p < 0.75 : p < 0.5; }
    var big = S.maxAlt;
    S.trick = null; S.queue = null; S.wantGrind = 0;
    for (var i = 0; i < 8; i++) particles.push({ x: S.x + (Math.random() - 0.5) * 80, y: S.y + 4, vx: (Math.random() - 0.5) * 160, vy: 40 + Math.random() * 80, life: 0.5, max: 0.5, c: "rgba(140,140,150,", r: 8 + Math.random() * 8 });
    if (bad && !S.bounce) {
      S.wobble = 1.1; S.bounce = true; S.grounded = false; S.vy = 280; sfx.wobble();
      showText("WHOA!", "Wobble wobble!"); speak("Whoa! Wobble wobble!");
      return;
    }
    sfx.land(); S.land = 0.25;
    if (S.combo >= 2 && !S.bounce) { sfx.cheer(); addStars(S.combo); showText("COMBO x" + S.combo + "!", "+" + S.combo + " bonus stars"); speak(["Combo! Awesome!", "Wow! What a combo!", "Amazing combo!"][Math.floor(Math.random() * 3)]); }
    else if (big > 420 && S.time - lastTextAt > 1.2) { sfx.cheer(); showText("NICE LANDING!"); speak("Nice landing!"); }
    S.combo = 0; S.bounce = false;
  }

  /* ---------------- Physics ---------------- */
  function step(dt) {
    S.time += dt; S.x += VX * dt;
    if (S.charging) S.charge = Math.min(1, S.charge + dt / 0.9);
    if (S.wobble > 0) S.wobble = Math.max(0, S.wobble - dt);
    if (S.land > 0) S.land = Math.max(0, S.land - dt);
    if (S.manual > 0) S.manual = Math.max(0, S.manual - dt);
    if (S.wantGrind > 0) S.wantGrind -= dt;
    if (S.jumpBuffer > 0) S.jumpBuffer -= dt;
    if (S.grindQueued && S.grounded) {
      var gq = S.grindQueued; if (gq.x1 < S.x) S.grindQueued = null;
      else if ((Math.max(gq.x0 + 30, S.x) - S.x) / VX <= 0.6) { S.grindQueued = null; popToRail(gq); }
    }
    if (S.trick) {
      S.trick.t += dt;
      if (S.trick.t >= S.trick.dur) { S.trick = null; if (S.queue && !S.grounded) { var q = S.queue; S.queue = null; startTrick(q); } }
    }
    if (S.grind) {
      var r = S.grind, ry = railY(r, S.x);
      if (ry === null) {
        endGrind(); S.grounded = false; S.vy = 240; takeoff(); S.combo = 1;
      } else {
        var ry2 = railY(r, S.x + 4); S.vy = ry2 === null ? 0 : (ry2 - ry) / 4 * VX; S.y = ry; S.angle += (Math.atan((ry2 === null ? ry : ry2) - ry) * 0 + Math.atan(S.vy / VX) - S.angle) * Math.min(1, dt * 12);
        if (Math.random() < 0.7) particles.push({ x: S.x + 30, y: ry, vx: -80 - Math.random() * 200, vy: 60 + Math.random() * 160, life: 0.35, max: 0.35, c: "rgba(255," + (150 + Math.floor(Math.random() * 80)) + ",40,", r: 3 + Math.random() * 3 });
        setLoop(grindLoop, 0.09);
      }
      setLoop(rollLoop, 0);
      return;
    }
    if (S.grounded) {
      S.sinceGround = 0;
      var lp = pieceAt(S.x - VX * dt - 1);
      if (lp && lp.lip !== null && lp.launch && S.x - VX * dt < lp.lip && S.x >= lp.lip) {
        S.grounded = false; S.vy = Math.max(S.vy, lp.launch); takeoff(); sfx.wheee();
        if (S.jumpBuffer > 0) { S.jumpBuffer = 0; S.vy = Math.min(1700, S.vy + 0.5 * jumpVy(S.bufferPower)); }
        return;
      }
      var hn = groundAt(S.x), slope = (groundAt(S.x + 4) - groundAt(S.x - 4)) / 8;
      var yb = S.y + S.vy * dt - 0.5 * G * dt * dt, tol = 3 + VX * dt * 0.6;
      if (hn >= yb - tol) {
        S.y = hn; S.vy = clamp(VX * slope, -1300, 1300);
        var target = clamp(Math.atan(slope), -1.1, 1.1); S.angle += (target - S.angle) * Math.min(1, dt * 14);
        setLoop(rollLoop, 0.05 + Math.abs(slope) * 0.03);
        if (S.jumpBuffer > 0) { S.jumpBuffer = 0; doJump(S.bufferPower); }
      } else {
        S.grounded = false; S.y = yb; S.vy -= G * dt; takeoff();
        var p = pieceAt(S.x - 6);
        if (p && p.lip !== null && Math.abs(S.x - p.lip) < 45 && p.launch) { S.vy = Math.max(S.vy, p.launch); sfx.wheee(); }
        if (S.charging && S.charge > 0.15) { /* ramp + held jump = extra boost on release */ }
      }
    } else {
      S.sinceGround += dt; S.airT += dt;
      setLoop(rollLoop, 0);
      var yPrev = S.y; S.vy -= G * dt; S.y += S.vy * dt;
      S.angle += (0 - S.angle) * Math.min(1, dt * 2.5);
      var alt = S.y - groundAt(S.x); if (alt > S.maxAlt) S.maxAlt = alt;
      if (!S.apexSaid && S.vy < 0 && S.maxAlt > 430) {
        S.apexSaid = true;
        if (S.time - lastTextAt > 0.7) { showText("SO HIGH!"); speak(["Wow! So high!", "Whoa! Super high!", "Up to the sky!"][Math.floor(Math.random() * 3)]); }
      }
      if (S.vy <= 0) {
        for (var i = 0; i < rails.length; i++) {
          var rr = rails[i], y2 = railY(rr, S.x); if (y2 === null || S.x > rr.x1 - 25) continue;
          var magnet = S.wantGrind > 0 && Math.abs(S.y - y2) < 70;
          if ((yPrev >= y2 - 2 && S.y <= y2 + 16) || magnet) { startGrind(rr); return; }
        }
      }
      var g = groundAt(S.x);
      if (S.y <= g) { S.y = g; S.grounded = true; S.vy = 0; landed(); if (!S.grounded) return; }
    }
    // collect stars
    for (var k = 0; k < stars.length; k++) {
      var st = stars[k]; if (st.got) continue;
      if (Math.abs(st.x - S.x) < 70 && Math.abs(st.y - (S.y + 70)) < 85) {
        st.got = true; sfx.ding(); addStars(1);
        for (var m = 0; m < 6; m++) particles.push({ x: st.x, y: st.y, vx: Math.cos(m) * 160, vy: Math.sin(m) * 160, life: 0.5, max: 0.5, c: "rgba(255,210,40,", r: 5 });
      }
    }
  }

  /* ---------------- Input ---------------- */
  var jumpBtn = $("btn-jump");
  function jumpDown() {
    audio(); if (S.charging) return;
    S.charging = true; S.charge = 0; jumpBtn.classList.add("held"); chargeStart();
  }
  function jumpUp() {
    if (!S.charging) return;
    var power = S.charge; S.charging = false; S.charge = 0; jumpBtn.classList.remove("held"); chargeStop();
    if (S.grounded || S.grind || S.sinceGround < 0.15) doJump(power);
    else { S.jumpBuffer = 0.35; S.bufferPower = power; }
  }
  jumpBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); try { jumpBtn.setPointerCapture(e.pointerId); } catch (er) {} jumpDown(); });
  jumpBtn.addEventListener("pointerup", function (e) { e.preventDefault(); jumpUp(); });
  jumpBtn.addEventListener("pointercancel", jumpUp);
  jumpBtn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  Array.prototype.forEach.call(document.querySelectorAll(".sk-trick"), function (b) {
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); b.classList.add("held"); trickButton(b.dataset.trick); });
    var up = function () { b.classList.remove("held"); };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("pointerleave", up);
    b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  });
  var KEYS = { KeyZ: "kickflip", Digit1: "kickflip", KeyX: "spin", Digit2: "spin", KeyC: "grab", Digit3: "grab", KeyV: "grind", Digit4: "grind" };
  window.addEventListener("keydown", function (e) {
    if (document.body.dataset.screen !== "ride") { if (e.code === "Enter") showRide(); return; }
    if (e.repeat) { if (e.code === "Space" || e.code === "ArrowUp") e.preventDefault(); return; }
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); jumpDown(); }
    else if (KEYS[e.code]) trickButton(KEYS[e.code]);
    else if (e.code === "KeyP") showPaint();
  });
  window.addEventListener("keyup", function (e) { if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") jumpUp(); });

  /* ---------------- Rendering ---------------- */
  var cv = $("park"), ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, baseY = 0, baseS = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1); var vv = window.visualViewport; W = window.innerWidth; H = window.innerHeight;
    var rb = $("ride").getBoundingClientRect(); if (rb.height > 50) { W = rb.width; H = rb.height; } else if (vv) { W = vv.width; H = vv.height; }
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var ch = document.querySelector(".sk-controls").offsetHeight || 220;
    baseY = Math.min(H * 0.8, H - ch - 10); if (baseY < H * 0.55) baseY = H * 0.6;
    baseS = clamp(Math.min(W / 1000, baseY / 680), 0.5, 1.3);
  }
  window.addEventListener("resize", function () { if (!$("ride").hidden) resize(); });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", function () { if (!$("ride").hidden) resize(); });
  window.addEventListener("orientationchange", function () { setTimeout(function () { if (!$("ride").hidden) resize(); }, 300); });
  var RX = function () { return W * 0.3; };
  function sx(wx) { return RX() + (wx - S.x) * cam.s; }
  function sy(wy) { return baseY - (wy - cam.y) * cam.s; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  var clouds = [[100, 90, 40], [420, 150, 30], [700, 70, 50], [1000, 130, 36], [1300, 95, 44]];
  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#8fd0ff"); g.addColorStop(0.7, "#dff3ff"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffe14a"; ctx.beginPath(); ctx.arc(W - 120, 150, 54, 0, Math.PI * 2); ctx.fill();
    var span = Math.max(W + 300, 1500);
    ctx.fillStyle = "rgba(255,255,255,.95)";
    clouds.forEach(function (c) {
      var x = ((c[0] - S.x * 0.08) % span + span) % span - 150, y = c[1];
      ctx.beginPath(); ctx.arc(x, y, c[2], 0, 7); ctx.arc(x + c[2] * 0.9, y + 8, c[2] * 0.8, 0, 7); ctx.arc(x - c[2] * 0.9, y + 10, c[2] * 0.7, 0, 7); ctx.fill();
    });
    var hy = baseY - 40 + cam.y * cam.s * 0.15;
    [["#c7e9b0", 0.15, 90, 260], ["#a5d98a", 0.3, 60, 170]].forEach(function (h) {
      ctx.fillStyle = h[0]; ctx.beginPath(); ctx.moveTo(0, H);
      for (var x = 0; x <= W + 20; x += 20) { var wx = x + S.x * h[1]; ctx.lineTo(x, hy - h[2] - Math.sin(wx / h[3]) * 40 - Math.sin(wx / (h[3] * 0.37)) * 14); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    });
    // trees on the near hill
    for (var i = -1; i < W / 160 + 2; i++) {
      var off = (S.x * 0.45) % 160, tx = i * 160 - off + 40, ty = hy - 20;
      ctx.fillStyle = "#8a5524"; ctx.fillRect(tx - 5, ty - 30, 10, 30);
      ctx.fillStyle = "#6cbf5a"; ctx.beginPath(); ctx.arc(tx, ty - 46, 26, 0, 7); ctx.fill();
    }
  }
  function drawWorld() {
    var left = S.x - RX() / cam.s - 20, right = S.x + (W - RX()) / cam.s + 20, stepW = 5 / cam.s, x;
    // ground (concrete)
    ctx.beginPath(); ctx.moveTo(sx(left), H + 10);
    for (x = left; x <= right; x += stepW) ctx.lineTo(sx(x), sy(groundAt(x)));
    ctx.lineTo(sx(right), H + 10); ctx.closePath();
    ctx.fillStyle = "#d3d6dc"; ctx.fill();
    // expansion joints
    ctx.strokeStyle = "rgba(120,125,135,.35)"; ctx.lineWidth = 2;
    for (x = Math.floor(left / 200) * 200; x < right; x += 200) { var gy = groundAt(x); if (gy === 0) { ctx.beginPath(); ctx.moveTo(sx(x), sy(0) + 4); ctx.lineTo(sx(x - 40), H); ctx.stroke(); } }
    // ramp bodies
    pieces.forEach(function (p) {
      if (!p.body || p.x1 < left || p.x0 > right) return;
      var a = Math.max(p.x0, left), b = Math.min(p.x1, right);
      ctx.beginPath(); ctx.moveTo(sx(a), sy(0));
      for (x = a; x <= b; x += stepW) ctx.lineTo(sx(x), sy(Math.max(0, p.fn(x - p.x0))));
      ctx.lineTo(sx(b), sy(Math.max(0, p.fn(Math.min(b, p.x1 - 0.01) - p.x0)))); ctx.lineTo(sx(b), sy(0)); ctx.closePath();
      ctx.fillStyle = p.body; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = Math.max(2, 4 * cam.s);
      for (x = Math.ceil(p.x0 / 60) * 60; x < p.x1; x += 60) { var h = p.fn(x - p.x0); if (h > 10 && x > left && x < right && !(p.stairs && x > p.stairs.x)) { ctx.beginPath(); ctx.moveTo(sx(x), sy(0)); ctx.lineTo(sx(x), sy(h - 6)); ctx.stroke(); } }
      if (p.stairs) {
        var st = p.stairs; ctx.fillStyle = "#b8bdc6";
        ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = Math.max(3, 6 * cam.s);
        for (var i = 0; i <= st.n; i++) { var ex = st.x + i * st.w, eh = st.h * (1 - i / st.n); if (eh <= 0) continue; ctx.beginPath(); ctx.moveTo(sx(ex), sy(eh)); ctx.lineTo(sx(ex + Math.min(st.w, 18)), sy(eh)); ctx.stroke(); }
      }
    });
    // surface edge
    ctx.beginPath();
    for (x = left; x <= right; x += stepW) { var yy = sy(groundAt(x)); if (x === left) ctx.moveTo(sx(x), yy); else ctx.lineTo(sx(x), yy); }
    ctx.strokeStyle = "#6c727c"; ctx.lineWidth = Math.max(3, 6 * cam.s); ctx.lineJoin = "round"; ctx.stroke();
    // coping
    pieces.forEach(function (p) { p.copings.forEach(function (c) { if (c[0] < left || c[0] > right) return; ctx.fillStyle = "#e8e8ee"; ctx.strokeStyle = "#555"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx(c[0]), sy(c[1]), Math.max(5, 9 * cam.s), 0, 7); ctx.fill(); ctx.stroke(); }); });
    // rails
    rails.forEach(function (r) {
      if (r.x1 < left || r.x0 > right) return;
      ctx.strokeStyle = "#5a5f6a"; ctx.lineWidth = Math.max(3, 7 * cam.s); ctx.lineCap = "round";
      r.pts.forEach(function (pt, i) { if (i === 0 || i === r.pts.length - 1 || r.style === "rail") { ctx.beginPath(); ctx.moveTo(sx(pt[0]), sy(pt[1])); ctx.lineTo(sx(pt[0]), sy(groundAt(pt[0] - 1))); ctx.stroke(); } });
      ctx.beginPath(); r.pts.forEach(function (pt, i) { if (i) ctx.lineTo(sx(pt[0]), sy(pt[1])); else ctx.moveTo(sx(pt[0]), sy(pt[1])); });
      ctx.strokeStyle = r.style === "ledge" ? "#9aa0aa" : "#ff7a1a"; ctx.lineWidth = Math.max(5, 12 * cam.s); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = Math.max(1, 3 * cam.s); ctx.stroke();
    });
    // signs
    signs.forEach(function (s) {
      if (s.x < left - 400 || s.x > right + 200) return;
      var w = (s.big ? 520 : 260) * cam.s, h = (s.big ? 90 : 70) * cam.s, bx = sx(s.x), by = sy(groundAt(s.x)) - (s.big ? 230 : 180) * cam.s;
      ctx.strokeStyle = "#6c727c"; ctx.lineWidth = Math.max(3, 8 * cam.s);
      ctx.beginPath(); ctx.moveTo(bx - w * 0.35, by); ctx.lineTo(bx - w * 0.35, sy(groundAt(s.x))); ctx.moveTo(bx + w * 0.35, by); ctx.lineTo(bx + w * 0.35, sy(groundAt(s.x))); ctx.stroke();
      rr(ctx, bx - w / 2, by - h, w, h, 16 * cam.s); ctx.fillStyle = s.color; ctx.fill(); ctx.lineWidth = Math.max(3, 6 * cam.s); ctx.strokeStyle = "#3a2208"; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "900 " + Math.round((s.big ? 46 : 40) * cam.s) + "px 'Trebuchet MS', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s.text, bx, by - h / 2 + 2);
    });
    // collectible stars
    stars.forEach(function (s) {
      if (s.got || s.x < left || s.x > right) return;
      var bob = Math.sin(S.time * 2.5 + s.ph) * 6;
      drawStar(sx(s.x), sy(s.y) + bob, 26 * Math.max(0.7, cam.s), S.time * 0.8 + s.ph);
    });
  }
  function drawStar(x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(rot) * 0.3); ctx.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    ctx.closePath(); ctx.fillStyle = "#ffd23f"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "#c77700"; ctx.stroke(); ctx.restore();
  }
  function limb(x1, y1, x2, y2, x3, y3, w, col) {
    ctx.strokeStyle = "#3a2208"; ctx.lineWidth = w + 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  function ball(x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#3a2208"; ctx.stroke(); }
  function drawHead(R, hx, hy) {
    var c = ctx, ol = "#3a2208";
    c.save(); c.translate(hx, hy); c.lineWidth = 3; c.strokeStyle = ol;
    if (R.id === "tommy") {
      ball(-20, -24, 12, R.fur); ball(20, -24, 12, R.fur); c.fillStyle = "#f7a8b8"; c.beginPath(); c.arc(-20, -24, 6, 0, 7); c.arc(20, -24, 6, 0, 7); c.fill();
      ball(0, 0, 30, R.fur);
      c.strokeStyle = ol; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, -29); c.lineTo(-3, -18); c.moveTo(4, -29); c.lineTo(4, -19); c.moveTo(13, -27); c.lineTo(10, -18); c.moveTo(-29, -4); c.lineTo(-19, -2); c.moveTo(-28, 6); c.lineTo(-19, 5); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(9, 11, 18, 13, 0, 0, 7); c.fill(); c.lineWidth = 3; c.stroke();
    } else if (R.id === "bonkers") {
      ball(0, 0, 29, R.fur);
      c.fillStyle = R.dark; c.beginPath(); c.ellipse(13, -8, 11, 10, 0, 0, 7); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(22, 9, 17, 12, 0, 0, 7); c.fill(); c.lineWidth = 3; c.stroke();
      c.fillStyle = "#111"; c.beginPath(); c.ellipse(37, 3, 7, 6, 0, 0, 7); c.fill();
      c.fillStyle = "#f07a9a"; c.beginPath(); c.ellipse(24, 22, 6, 9, 0.2, 0, 7); c.fill(); c.stroke();
      c.save(); c.translate(-14, -14); c.rotate(0.5 + Math.sin(S.time * 8) * 0.15); c.fillStyle = R.dark; c.beginPath(); c.ellipse(-4, 14, 11, 22, 0, 0, 7); c.fill(); c.stroke(); c.restore();
    } else {
      [[-1, -16], [1, 20]].forEach(function (e) { c.fillStyle = R.fur; c.beginPath(); c.moveTo(e[1] - 12, -18); c.lineTo(e[1] - 3 * e[0], -46); c.lineTo(e[1] + 12, -20); c.closePath(); c.fill(); c.stroke(); c.fillStyle = "#f7a8b8"; c.beginPath(); c.moveTo(e[1] - 6, -22); c.lineTo(e[1] - 3 * e[0], -38); c.lineTo(e[1] + 6, -22); c.fill(); });
      ball(0, 0, 30, R.fur);
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(9, 11, 18, 13, 0, 0, 7); c.fill(); c.lineWidth = 3; c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(18, 10); c.lineTo(42, 4); c.moveTo(18, 14); c.lineTo(42, 16); c.moveTo(0, 10); c.lineTo(-22, 6); c.moveTo(0, 14); c.lineTo(-22, 18); c.stroke();
    }
    if (R.id !== "bonkers") { c.fillStyle = "#f07a9a"; c.beginPath(); c.ellipse(11, 4, 5, 4, 0, 0, 7); c.fill(); }
    // eyes
    [[-2, -8], [16, -8]].forEach(function (e) {
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(e[0], e[1], 6.5, 8, 0, 0, 7); c.fill(); c.lineWidth = 2.5; c.strokeStyle = ol; c.stroke();
      c.fillStyle = R.id === "smash" ? "#2e9e4f" : "#3a2208"; c.beginPath(); c.arc(e[0] + 2, e[1] + 1, 3.6, 0, 7); c.fill();
    });
    // smile
    c.strokeStyle = ol; c.lineWidth = 3; c.beginPath();
    if (S.wobble > 0) { c.ellipse(11, 17, 5, 6, 0, 0, 7); c.fillStyle = "#7a1f2a"; c.fill(); }
    else { c.arc(11, 12, 8, 0.15 * Math.PI, 0.85 * Math.PI); }
    c.stroke();
    c.restore();
  }
  function drawRider() {
    var R = rider(), t = S.trick, p = t ? t.t / t.dur : 0, type = t ? t.type : "";
    var px = RX(), py = sy(S.y), s = cam.s;
    ctx.save(); ctx.translate(px, py); ctx.scale(s, s);
    var ang = -S.angle;
    if (type === "grab") ang += -0.25 * Math.sin(Math.PI * p);
    if (S.manual > 0) { ctx.translate(-38, 0); ctx.rotate(-0.28 * Math.min(1, S.manual * 3)); ctx.translate(38, 0); }
    if (S.wobble > 0) ang += Math.sin(S.wobble * 18) * 0.25 * S.wobble;
    ctx.rotate(ang);
    var flipX = type === "spin" ? Math.cos(p * Math.PI * 2) : 1;
    if (type === "spin") { ctx.scale(flipX < 0 ? Math.min(-0.15, flipX) : Math.max(0.15, flipX), 1); }
    // board
    var lift = type === "kickflip" ? Math.sin(Math.PI * p) * 22 : 0, flip = type === "kickflip" ? Math.cos(p * Math.PI * 2) : 1;
    ctx.save(); ctx.translate(0, -lift);
    ctx.fillStyle = "#666"; ctx.fillRect(-46, -16, 18, 7); ctx.fillRect(28, -16, 18, 7);
    ball(-38, -8, 8, "#fafafa"); ball(38, -8, 8, "#fafafa");
    ctx.save(); ctx.translate(0, -22); ctx.scale(1, Math.abs(flip) < 0.12 ? 0.12 : Math.abs(flip));
    ctx.drawImage(deck, -64, -12, 128, 24);
    if (flip < 0) { ctx.fillStyle = "rgba(58,34,8,.35)"; ctx.beginPath(); ctx.ellipse(0, 0, 63, 11, 0, 0, 7); ctx.fill(); }
    ctx.restore(); ctx.restore();
    // body
    var crouch = Math.max(S.charging && S.grounded ? S.charge * 0.9 : 0, S.land > 0 ? S.land * 3 : 0, type === "grab" ? Math.sin(Math.PI * p) : 0, type === "kickflip" ? 0.5 * Math.sin(Math.PI * p) : 0);
    var footY = -34 - lift * 0.9, hipY = -86 + crouch * 22, shY = hipY - 42, lean = 6 + crouch * 6;
    var col = R.shorts, skin = R.fur;
    var high = !S.grounded && !S.grind && !t && S.maxAlt > 250 && S.vy > -400;
    if (type === "superman") {
      var e = Math.sin(Math.PI * p);
      limb(-4, hipY, -30 - 20 * e, hipY + 10 - 10 * e, -60 - 30 * e, hipY + 4 - 24 * e, 13, skin);
      limb(4, hipY, -20 - 20 * e, hipY + 18 - 6 * e, -50 - 32 * e, hipY + 16 - 20 * e, 13, skin);
      ball(-60 - 30 * e, hipY + 4 - 24 * e, 8, "#fff"); ball(-50 - 32 * e, hipY + 16 - 20 * e, 8, "#fff");
    } else {
      limb(-20, footY, -12 + lean + crouch * 12, (footY + hipY) / 2, -4, hipY, 13, skin);
      limb(22, footY, 22 + lean + crouch * 14, (footY + hipY) / 2, 6, hipY, 13, skin);
      ball(-20, footY - 2, 8, "#fff"); ball(22, footY - 2, 8, "#fff");
    }
    // torso
    ctx.save(); ctx.translate(lean, 0);
    rr(ctx, -16, shY, 34, hipY - shY + 6, 12); ctx.fillStyle = R.shirt; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#3a2208"; ctx.stroke();
    rr(ctx, -17, hipY - 8, 36, 16, 6); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    if (R.id === "bonkers") { ctx.fillStyle = R.dark; ctx.beginPath(); ctx.ellipse(-4, hipY - 22, 10, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#e53935"; ctx.fillRect(-14, shY - 2, 30, 7); ball(4, shY + 9, 6, "#ffd23f"); }
    if (R.letter) { ctx.fillStyle = R.letterColor; ctx.font = "900 20px 'Trebuchet MS', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(R.letter, 2, (shY + hipY) / 2); }
    // arms
    var hand = R.id === "smash" ? 10 : 7, wob = S.wobble > 0 ? S.time * 14 : 0;
    var aBack, aFront;
    if (type === "grab") { aBack = [-24, shY + 26, -40, shY + 2]; aFront = [22, shY + 34, 36, footY + 6]; }
    else if (type === "superman") { aBack = [16, shY + 30, 34, footY + 4]; aFront = [24, shY + 32, 40, footY + 4]; }
    else if (high || type === "spin") { aBack = [-22, shY - 16, -24, shY - 44]; aFront = [20, shY - 18, 26, shY - 46]; }
    else if (S.wobble > 0) { aBack = [-22 + Math.cos(wob) * 10, shY - 6 + Math.sin(wob) * 14, -40 + Math.cos(wob) * 22, shY - 14 + Math.sin(wob) * 26]; aFront = [24 - Math.cos(wob) * 10, shY - 6 - Math.sin(wob) * 14, 42 - Math.cos(wob) * 22, shY - 14 - Math.sin(wob) * 26]; }
    else { aBack = [-22, shY + 18, -38, shY + 30 - crouch * 8]; aFront = [24, shY + 16, 40, shY + 26 - crouch * 8]; }
    limb(-8, shY + 6, aBack[0], aBack[1], aBack[2], aBack[3], 11, skin); ball(aBack[2], aBack[3], hand, R.hands);
    limb(8, shY + 6, aFront[0], aFront[1], aFront[2], aFront[3], 11, skin); ball(aFront[2], aFront[3], hand, R.hands);
    drawHead(R, 6, shY - 28);
    ctx.restore();
    ctx.restore();
    // jump power ring above rider while charging
    if (S.charging && S.charge > 0.05) {
      ctx.lineWidth = 8; ctx.strokeStyle = "rgba(255,225,74,.9)"; ctx.beginPath();
      ctx.arc(px, py - 210 * s, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * S.charge); ctx.stroke();
    }
  }
  function drawParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var q = particles[i]; q.life -= dt; if (q.life <= 0) { particles.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 400 * dt;
      ctx.fillStyle = q.c + (q.life / q.max).toFixed(2) + ")"; ctx.beginPath(); ctx.arc(sx(q.x), sy(q.y), q.r * Math.max(0.6, cam.s), 0, 7); ctx.fill();
    }
  }

  /* ---------------- Loop ---------------- */
  var running = false, lastT = 0;
  function frame(ts) {
    if (!running) return;
    var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 1 / 60; lastT = ts;
    ensureWorld(S.x);
    var n = 3; for (var i = 0; i < n; i++) step(dt / n);
    $("jump-fill").style.height = Math.round(S.charge * 100) + "%";
    // camera: follow the ground under the rider; zoom out for really high jumps
    var gy = groundAt(S.x), ty = Math.min(gy, S.y), alt = Math.max(0, S.y - ty);
    cam.y += (ty - cam.y) * Math.min(1, dt * 4);
    var ts2 = Math.max(0.26, Math.min(baseS, (baseY - 110) / (alt + Math.max(0, S.vy) * 0.25 + 300)));
    cam.s += (ts2 - cam.s) * Math.min(1, dt * (ts2 < cam.s ? 8 : 2));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(); drawWorld(); drawParticles(dt); drawRider();
    requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { setLoop(rollLoop, 0); setLoop(grindLoop, 0); lastT = 0; } });
  cam.s = 1;
  // hooks for testing
  window.__skate = { state: function () { return S; }, trick: trickButton, jumpDown: jumpDown, jumpUp: jumpUp, ride: showRide, paint: showPaint, world: function () { return pieces.map(function (p) { return { kind: p.kind, x0: p.x0, x1: p.x1, lip: p.lip }; }); }, setRider: function (id) { riderId = id; }, stamp: function (s, x, y) { pushUndo(); drawStamp(s, x, y); renderDeck(); saveDeck(); } };
})();
