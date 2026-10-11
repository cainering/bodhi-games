/* Bonkers Digs: tap dirt to dig, find bones, count out loud.
   No timers, no losing: every hole has something, and every round ends with a cheer. */
(function () {
  var NUM = ["zero", "one", "two", "three", "four", "five", "six"];
  var SURPRISES = [
    { pic: "🧦", name: "a stinky sock", say: "A stinky sock! P U! Silly Bonkers!" },
    { pic: "🦆", name: "a rubber duck", say: "A rubber duck! Quack quack!" },
    { pic: "🎾", name: "a ball", say: "A ball! Bonkers loves balls! Boing!" },
    { pic: "👟", name: "a shoe", say: "A shoe! Whose shoe is that? Hee hee!" },
    { pic: "💎", name: "treasure", say: "Shiny treasure! Ooooh!" },
    { pic: "🪱", name: "a wiggly worm", say: "A wiggly worm! Wiggle wiggle!" },
    { pic: "🌟", name: "a star", say: "A gold star! Twinkle!" },
    { pic: "🥕", name: "a carrot", say: "A carrot! Crunch crunch!" }
  ];
  var CHEERS = ["Woof woof! You did it!", "BONK! Great digging!", "Yay! Bonkers is so happy!"];
  var SPOTS = 6;
  var goals = [3, 2, 4, 3, 5];
  var round = 0, goal = 3, found = 0, busy = false, lastSay = "";
  var yard = document.getElementById("dig-yard");
  var sayEl = document.getElementById("dig-say");
  var countEl = document.getElementById("dig-count");
  var cheer = document.getElementById("dig-cheer");
  var cheerText = document.getElementById("dig-cheer-text");

  /* Speech: slow, friendly, English. */
  function speak(text, done) {
    lastSay = text;
    var synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") { if (done) setTimeout(done, 600); return; }
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.85; u.pitch = 1.15;
      var called = false;
      var finish = function () { if (!called) { called = true; if (done) done(); } };
      u.onend = finish; u.onerror = finish;
      synth.speak(u);
      setTimeout(finish, 1200 + text.length * 90); /* safety if onend never fires */
    } catch (e) { if (done) setTimeout(done, 600); }
  }
  function show(text, done) { sayEl.textContent = text; speak(text, done); }

  /* Soft, silly sound effects made with Web Audio (quiet, short, no loud bangs). */
  var ctx = null;
  function audio() {
    if (!ctx) { var A = window.AudioContext || window.webkitAudioContext; if (A) { try { ctx = new A(); } catch (e) {} } }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(type, f1, f2, dur, vol) {
    var c = audio(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function scratch() {
    var c = audio(); if (!c) return;
    for (var i = 0; i < 3; i++) {
      (function (k) {
        var len = Math.floor(c.sampleRate * 0.08), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
        for (var j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / len);
        var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
        f.type = "lowpass"; f.frequency.value = 900; g.gain.value = 0.12;
        s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime + k * 0.12);
      })(i);
    }
  }
  var sfx = {
    dig: scratch,
    bone: function () { tone("sine", 300, 900, 0.35, 0.18); setTimeout(function () { tone("sine", 500, 1100, 0.25, 0.12); }, 180); },
    silly: function () { tone("triangle", 600, 180, 0.45, 0.16); },
    yay: function () { [523, 659, 784].forEach(function (f, i) { setTimeout(function () { tone("sine", f, f, 0.3, 0.14); }, i * 170); }); }
  };

  function drawCount() {
    countEl.innerHTML = "";
    for (var i = 0; i < goal; i++) {
      var s = document.createElement("span");
      s.className = "slot" + (i < found ? " got" : "");
      s.textContent = "🦴";
      countEl.appendChild(s);
    }
    countEl.setAttribute("aria-label", found + " of " + goal + " bones");
  }

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function newRound() {
    goal = goals[round % goals.length]; found = 0; busy = false;
    cheer.hidden = true;
    var extras = shuffle(SURPRISES.slice()).slice(0, SPOTS - goal);
    var items = [];
    for (var i = 0; i < goal; i++) items.push({ bone: true, pic: "🦴" });
    items = shuffle(items.concat(extras));
    yard.innerHTML = "";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "spot"; b.setAttribute("aria-label", "Dig here");
      b.addEventListener("click", function () { dig(b, it); });
      yard.appendChild(b);
    });
    drawCount();
    show("Woof! Help me find " + NUM[goal] + " bones! Tap the dirt to dig!");
  }

  function dig(btn, it) {
    if (busy || btn.classList.contains("open")) return;
    busy = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    btn.classList.add("digging"); sfx.dig();
    setTimeout(function () {
      btn.classList.remove("digging"); btn.classList.add("open");
      btn.innerHTML = '<span class="found">' + it.pic + '</span>';
      btn.setAttribute("aria-label", it.bone ? "a bone" : it.name);
      if (it.bone) {
        found++; drawCount(); sfx.bone();
        var n = NUM[found], word = found === 1 ? "bone" : "bones";
        var line = "A bone! " + n.charAt(0).toUpperCase() + n.slice(1) + " " + word + "!";
        if (found >= goal) {
          show(line, function () { finish(); });
        } else {
          show(line, function () { busy = false; });
          setTimeout(function () { busy = false; }, 900);
        }
      } else {
        sfx.silly();
        show(it.say, function () { busy = false; });
        setTimeout(function () { busy = false; }, 900);
      }
    }, 550);
  }

  function finish() {
    var counting = [];
    for (var i = 1; i <= goal; i++) counting.push(NUM[i]);
    var c = CHEERS[round % CHEERS.length];
    var text = c + " " + counting.join(", ") + "! " + NUM[goal].charAt(0).toUpperCase() + NUM[goal].slice(1) + " bones!";
    cheerText.textContent = c + " 🦴 × " + goal;
    cheer.hidden = false; sfx.yay(); speak(text);
    round++;
  }

  document.getElementById("dig-again").addEventListener("click", function () {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    newRound();
  });
  document.getElementById("dig-hear").addEventListener("click", function () {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    speak(lastSay || sayEl.textContent);
  });
  newRound();
})();
