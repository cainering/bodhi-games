/* KidsVoice: plays pre-made neural-voice MP3 clips (audio/clips/<key>.mp3),
   and falls back to the browser voice (speechSynthesis) for any text that
   has no clip. Clips are synthetic voices only.
   Key = cyrb53 hash of "<lang>|<voice>|<text>" (text whitespace-collapsed).
   say(parts, opts): parts = [{ text, lang: "en"|"he"|"th"|"ja", voice?: "tommy" }]
   opts: interrupt (default true), rate/pitch (fallback only), skipMissing
   (fallback: skip non-English parts when the device has no voice), onend. */
(function (root) {
  function cyrb53(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57, ch, i;
    for (i = 0; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  function norm(t) {
    var s = String(t == null ? "" : t);
    if (s.normalize) s = s.normalize("NFC");
    return s.replace(/\s+/g, " ").trim();
  }
  function shortLang(l) { return String(l || "en").slice(0, 2).toLowerCase(); }
  function keyFor(text, lang, voice) { return cyrb53(shortLang(lang) + "|" + (voice || "") + "|" + norm(text)).toString(36); }
  var api = { key: keyFor, norm: norm, shortLang: shortLang };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/[^\/]*$/, "") : "audio/";
  var have = null, readyCbs = [];
  function markReady(list) {
    have = {};
    (list || []).forEach(function (k) { have[k] = 1; });
    var cbs = readyCbs; readyCbs = [];
    cbs.forEach(function (cb) { cb(); });
  }
  try {
    fetch(base + "manifest.json").then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) { markReady(m && m.clips); }, function () { markReady([]); });
  } catch (e) { markReady([]); }
  setTimeout(function () { if (!have) markReady([]); }, 2500);
  function whenReady(cb) { if (have) cb(); else readyCbs.push(cb); }

  var LANG = { en: "en-US", he: "he-IL", th: "th-TH", ja: "ja-JP", ru: "ru-RU" };
  var audio = null, queue = [], gen = 0, busy = false;
  function player() {
    if (!audio) { audio = new Audio(); audio.preload = "auto"; }
    return audio;
  }
  /* iOS: play once inside the first tap so later clips may start on their own. */
  var SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  function unlock() {
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("touchstart", unlock, true);
    if (busy) return;
    try { var a = player(); a.src = SILENT; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("touchstart", unlock, true);

  function deviceVoice(lang) {
    var s = root.speechSynthesis; if (!s) return null;
    var want = shortLang(lang), vs = s.getVoices() || [], i;
    for (i = 0; i < vs.length; i++) if ((vs[i].lang || "").toLowerCase().indexOf(want) === 0) return vs[i];
    return null;
  }
  function fallback(p, o, done) {
    var s = root.speechSynthesis;
    if (!s || typeof SpeechSynthesisUtterance === "undefined") return done();
    var v = deviceVoice(p.lang);
    if (!v && shortLang(p.lang) !== "en" && o.skipMissing !== false) return done();
    var finished = false;
    function fin() { if (!finished) { finished = true; clearTimeout(t); done(); } }
    var t = setTimeout(fin, 1500 + norm(p.text).length * 110);
    try {
      var u = new SpeechSynthesisUtterance(norm(p.text));
      u.lang = v ? v.lang : (LANG[shortLang(p.lang)] || "en-US");
      if (v) u.voice = v;
      if (o.rate) u.rate = o.rate;
      if (o.pitch) u.pitch = o.pitch;
      u.onend = fin; u.onerror = fin;
      s.speak(u);
    } catch (e) { fin(); }
  }
  function playClip(url, done) {
    var a = player(), settled = false, t;
    function fin(ok) {
      if (settled) return; settled = true; clearTimeout(t);
      a.onended = a.onerror = null; done(ok);
    }
    a.onended = function () { fin(true); };
    a.onerror = function () { fin(false); };
    t = setTimeout(function () { fin(true); }, 20000);
    try {
      a.src = url;
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function () { fin(false); });
    } catch (e) { fin(false); }
  }
  function next(my) {
    if (my !== gen) return;
    if (!queue.length) { busy = false; return; }
    busy = true;
    var item = queue.shift();
    if (item.done) { try { item.done(); } catch (e) {} return next(my); }
    whenReady(function () {
      if (my !== gen) return;
      var p = item.p, k = keyFor(p.text, p.lang, p.voice);
      if (have[k]) playClip(base + "clips/" + k + ".mp3", function (ok) {
        if (my !== gen) return;
        if (ok) next(my); else fallback(p, item.o, function () { next(my); });
      });
      else fallback(p, item.o, function () { next(my); });
    });
  }
  function cancel() {
    gen += 1; queue = []; busy = false;
    if (audio) { try { audio.onended = audio.onerror = null; audio.pause(); } catch (e) {} }
    try { if (root.speechSynthesis) root.speechSynthesis.cancel(); } catch (e) {}
  }
  function say(parts, o) {
    o = o || {};
    if (!Array.isArray(parts)) parts = [parts];
    if (o.interrupt !== false) cancel();
    parts.forEach(function (p) {
      if (typeof p === "string") p = { text: p, lang: "en" };
      if (p && norm(p.text)) queue.push({ p: p, o: o });
    });
    if (o.onend) queue.push({ done: o.onend });
    if (!busy) next(gen);
  }
  function has(text, lang, voice) { return !!(have && have[keyFor(text, lang, voice)]); }
  root.KidsVoice = { say: say, cancel: cancel, has: has, key: keyFor, ready: whenReady, speaking: function () { return busy; } };
})(typeof window !== "undefined" ? window : globalThis);
