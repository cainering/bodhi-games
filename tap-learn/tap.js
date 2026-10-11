/* Tap games for little ones.
   - No wrong answers: tapping a different picture just names it kindly.
   - No timers, no scores, no losing screens.
   - Short rounds (window.TAP_CONFIG.roundSize), each ending with a cheer.
   - Words are spoken slowly in English, then Hebrew and Thai when switched on
     and when the device has a voice for that language.
   - Calm chime only (soft sine tone). Nothing flashes. */
(function () {
  var CFG = window.TAP_CONFIG || {};
  var WORDS = window.TAP_WORDS;
  var ROUND = CFG.roundSize || 3;
  var CHOICES = CFG.choices || 3;
  var RATE = CFG.rate || 0.7;
  var GAMES = CFG.games || Object.keys(WORDS);
  var COUNT_MAX = CFG.countMax || 3;
  var LKEY = (CFG.key || "tap") + "-langs";
  var app = document.getElementById("tap-app");

  /* ---------- languages ---------- */
  var langs = { en: true, he: CFG.he !== false, th: CFG.th !== false };
  try { var saved = JSON.parse(localStorage.getItem(LKEY) || "null"); if (saved) { langs.he = !!saved.he; langs.th = !!saved.th; } } catch (e) {}
  function saveLangs() { try { localStorage.setItem(LKEY, JSON.stringify(langs)); } catch (e) {} }

  var VOICE_LANG = { en: "en-US", he: "he-IL", th: "th-TH" };
  function voiceFor(code) {
    if (!window.speechSynthesis) return null;
    var want = code.slice(0, 2);
    var vs = window.speechSynthesis.getVoices();
    for (var i = 0; i < vs.length; i++) if ((vs[i].lang || "").toLowerCase().indexOf(want) === 0) return vs[i];
    return null;
  }
  function say(parts, interrupt) {
    /* parts: [{text, lang}] spoken in order. Missing Hebrew/Thai voices are skipped,
       so Hebrew or Thai letters are never read by an English voice. */
    if (!window.speechSynthesis) return;
    try {
      if (interrupt !== false) window.speechSynthesis.cancel();
      parts.forEach(function (p) {
        if (!p || !p.text) return;
        var v = voiceFor(p.lang);
        if (!v && p.lang !== "en") return;
        var u = new SpeechSynthesisUtterance(p.text);
        u.lang = v ? v.lang : VOICE_LANG[p.lang] || "en-US";
        if (v) u.voice = v;
        u.rate = RATE;
        u.pitch = 1.05;
        window.speechSynthesis.speak(u);
      });
    } catch (e) { /* no voice is fine */ }
  }
  function sayWord(item, extra) {
    var parts = [{ text: item.en, lang: "en" }];
    if (langs.he && item.he) parts.push({ text: item.he, lang: "he" });
    if (langs.th && item.th) parts.push({ text: item.th, lang: "th" });
    if (item.sound) parts.push({ text: item.sound, lang: "en" });
    if (extra) parts = parts.concat(extra);
    say(parts);
  }

  /* ---------- calm chime ---------- */
  var actx = null;
  function chime(notes) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      (notes || [523, 659]).forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.22;
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.65);
      });
    } catch (e) { /* audio is optional */ }
  }

  /* ---------- pictures ---------- */
  var SHAPES = {
    circle: '<circle cx="50" cy="50" r="42"/>',
    square: '<rect x="10" y="10" width="80" height="80" rx="6"/>',
    triangle: '<polygon points="50,8 94,90 6,90"/>',
    star: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/>',
    heart: '<path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 47 14 50 22 C53 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88Z"/>'
  };
  function picture(item) {
    var el = document.createElement("span");
    if (item.color) { el.className = "swatch"; el.style.background = item.color; }
    else if (item.shape) el.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" fill="#5b8def" stroke="#1d4e96" stroke-width="4">' + SHAPES[item.shape] + "</svg>";
    else if (item.letter) { el.className = "letter"; el.textContent = item.letter; el.lang = "he"; }
    else if (item.n) { el.className = "apples"; el.textContent = new Array(item.n + 1).join(item.pic); }
    else el.textContent = item.pic;
    return el;
  }

  /* ---------- helpers ---------- */
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function askText(game, item) {
    var t = game.ask.replace("{en}", item.en);
    t = t.replace("{are}", item.n === 1 ? "is" : "are").replace("{is}", /s$/.test(item.en) ? "are" : "is");
    if (item.n) t = t.replace(item.en, item.en + (item.n === 1 ? " apple" : " apples"));
    return t;
  }
  function itemsFor(id) {
    var g = WORDS[id];
    if (id === "count") return g.items.filter(function (it) { return it.n <= COUNT_MAX; });
    return g.items;
  }

  /* ---------- top bar ---------- */
  function topBar(showHome) {
    var bar = el("div", "tap-top");
    if (showHome) {
      var home = el("a", "tap-home", "🏠 Home");
      home.href = "#";
      home.addEventListener("click", function (e) { e.preventDefault(); location.hash = ""; });
      bar.appendChild(home);
    } else if (CFG.siteHome) {
      var back = el("a", "tap-home", "← " + (CFG.siteHomeLabel || "Home"));
      back.href = CFG.siteHome;
      bar.appendChild(back);
    } else bar.appendChild(el("span"));
    var group = el("div", "tap-langs");
    [["en", "EN"], ["he", "עב"], ["th", "ไทย"]].forEach(function (pair) {
      var b = el("button", "tap-lang", pair[1]);
      b.type = "button";
      b.setAttribute("aria-label", { en: "English", he: "Hebrew", th: "Thai" }[pair[0]]);
      b.setAttribute("aria-pressed", langs[pair[0]] ? "true" : "false");
      if (pair[0] === "en") b.disabled = true;
      else b.addEventListener("click", function () {
        langs[pair[0]] = !langs[pair[0]]; saveLangs();
        b.setAttribute("aria-pressed", langs[pair[0]] ? "true" : "false");
      });
      group.appendChild(b);
    });
    bar.appendChild(group);
    return bar;
  }

  /* ---------- menu ---------- */
  function showMenu() {
    app.innerHTML = "";
    app.appendChild(topBar(false));
    app.appendChild(el("h1", "tap-title", CFG.title || "Tap and Listen"));
    var menu = el("div", "tap-menu");
    GAMES.forEach(function (id) {
      var g = WORDS[id];
      var a = el("a", "tap-tile");
      a.href = "#" + id;
      a.setAttribute("data-game", id);
      var big = el("span", "big", g.emoji);
      if (id === "alephbet") big.lang = "he";
      a.appendChild(big);
      a.appendChild(el("span", "", g.title));
      a.addEventListener("click", function () { say([{ text: g.title, lang: "en" }]); });
      menu.appendChild(a);
    });
    app.appendChild(menu);
  }

  /* ---------- a round ---------- */
  function playGame(id) {
    var game = WORDS[id];
    var pool = itemsFor(id);
    var targets = shuffle(pool).slice(0, Math.min(ROUND, pool.length));
    var step = 0;

    function showStep() {
      var target = targets[step];
      var others = shuffle(pool.filter(function (it) { return it.id !== target.id; })).slice(0, CHOICES - 1);
      var choices = shuffle([target].concat(others));
      var busy = false;
      app.innerHTML = "";
      app.appendChild(topBar(true));
      var stage = el("div", "tap-stage");
      var ask = el("div", "tap-ask");
      var q = askText(game, target);
      ask.appendChild(el("p", "", q));
      var again = el("button", "tap-again", "🔊");
      again.type = "button";
      again.setAttribute("aria-label", "Say it again");
      again.addEventListener("click", function () { say([{ text: q, lang: "en" }]); });
      ask.appendChild(again);
      stage.appendChild(ask);
      var grid = el("div", "tap-grid");
      var word = el("div", "tap-word");
      choices.forEach(function (item) {
        var b = el("button", "tap-choice");
        b.type = "button";
        b.setAttribute("data-id", item.id);
        b.setAttribute("aria-label", item.en);
        b.appendChild(picture(item));
        b.addEventListener("click", function () {
          if (busy) return;
          showWord(word, item);
          if (item.id === target.id) {
            busy = true;
            b.classList.add("found");
            chime([523, 659]);
            sayWord(item);
            setTimeout(function () {
              step += 1;
              if (step >= targets.length) showCheer(id);
              else showStep();
            }, CFG.pause || 4200);
          } else {
            /* Not a mistake: name what was tapped, then gently ask again. */
            sayWord(item, [{ text: q, lang: "en" }]);
          }
        });
        grid.appendChild(b);
      });
      stage.appendChild(grid);
      stage.appendChild(word);
      var dots = el("ul", "tap-dots");
      for (var i = 0; i < targets.length; i++) dots.appendChild(el("li", i < step ? "on" : ""));
      stage.appendChild(dots);
      app.appendChild(stage);
      setTimeout(function () { say([{ text: q, lang: "en" }]); }, 300);
    }

    function showWord(box, item) {
      box.innerHTML = "";
      box.appendChild(el("span", "en", item.en));
      if (langs.he && item.he) { var h = el("span", "he", item.he); h.lang = "he"; box.appendChild(h); }
      if (langs.th && item.th) { var t = el("span", "th", item.th); t.lang = "th"; box.appendChild(t); }
    }

    showStep();
  }

  function showCheer(id) {
    var game = WORDS[id];
    app.innerHTML = "";
    app.appendChild(topBar(true));
    var box = el("div", "tap-cheer");
    box.appendChild(el("div", "party", "🎉"));
    box.appendChild(el("h2", "", "Yay! You did it!"));
    var row = el("div", "row");
    var again = el("button", "tap-big-btn go", "🔁 Again");
    again.type = "button";
    again.addEventListener("click", function () { playGame(id); });
    var home = el("button", "tap-big-btn", "🏠 Home");
    home.type = "button";
    home.addEventListener("click", function () { location.hash = ""; });
    row.appendChild(again); row.appendChild(home);
    box.appendChild(row);
    app.appendChild(box);
    chime([523, 659, 784]);
    var c = window.TAP_CHEERS;
    var parts = [{ text: c.en, lang: "en" }];
    if (langs.he) parts.push({ text: c.he, lang: "he" });
    if (langs.th) parts.push({ text: c.th, lang: "th" });
    if (game.cheer) { parts.push({ text: game.cheer.en, lang: "en" }); if (langs.he) parts.push({ text: game.cheer.he, lang: "he" }); }
    say(parts);
  }

  function route() {
    var id = (location.hash || "").replace("#", "");
    if (id && WORDS[id] && GAMES.indexOf(id) !== -1) playGame(id);
    else showMenu();
  }
  window.addEventListener("hashchange", route);
  if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = function () {};
  route();
})();
