/* Draws one multiple-choice question. Hebrew is RTL. The speaker
   button appears only when the device has a voice for that language. */
(function (root) {
  var shuffle = root.QShuffle;
  if (!shuffle && typeof require === "function") shuffle = require("./shuffle.js");

  function hasHebrew(text) {
    return /[\u0590-\u05FF]/.test(text || "");
  }

  function hasThai(text) {
    return /[\u0E00-\u0E7F]/.test(text || "");
  }

  function opts() {
    return (root.KIDS_SETTINGS && root.KIDS_SETTINGS.quiz) || {};
  }

  function hasCyrillic(text) {
    return /[\u0400-\u04FF]/.test(text || "");
  }

  function voiceFor(lang) {
    if (!window.speechSynthesis || !lang) return null;
    var voices = window.speechSynthesis.getVoices();
    var want = String(lang).slice(0, 2).toLowerCase();
    var i;
    for (i = 0; i < voices.length; i++) {
      var code = (voices[i].lang || "").toLowerCase();
      if (code.indexOf(want) === 0) return voices[i];
    }
    return null;
  }

  function speak(text, lang, keep) {
    try {
      if (!window.speechSynthesis || !text) return;
      var voice = voiceFor(lang);
      if (!voice) return;
      if (!keep) window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      utter.lang = voice.lang;
      utter.voice = voice;
      if (opts().speechRate) utter.rate = opts().speechRate;
      window.speechSynthesis.speak(utter);
    } catch (err) {
      /* No voice is fine. The words stay on the screen. */
    }
  }

  function decorate(el, text) {
    if (hasHebrew(text)) {
      el.classList.add("q-he");
      el.dir = "rtl";
      el.lang = "he";
    } else if (hasThai(text)) {
      el.classList.add("q-th");
      el.lang = "th";
    } else if (hasCyrillic(text)) {
      el.classList.add("q-ru");
      el.lang = "ru";
    }
  }

  function render(parent, question, onChoice) {
    parent.innerHTML = "";
    parent.setAttribute("data-answer", question.answer);
    parent.setAttribute("data-qid", question.id);
    var prompt = document.createElement("p");
    prompt.className = "q-prompt";
    prompt.textContent = question.prompt;
    decorate(prompt, question.prompt);
    parent.appendChild(prompt);

    var hear = document.createElement("button");
    hear.type = "button";
    hear.className = "q-speak";
    hear.textContent = "Hear it";
    hear.hidden = !voiceFor(question.speakLang);
    function readAll() {
      speak(question.speak || question.prompt, question.speakLang);
      if (!opts().readChoices) return;
      var plain = question.choices.every(function (c) { return !hasHebrew(c) && !hasThai(c) && !hasCyrillic(c); });
      if (plain) speak(question.choices.join(". ") + ".", "en-US", true);
      else question.choices.forEach(function (c) {
        speak(c, hasHebrew(c) ? "he-IL" : hasThai(c) ? "th-TH" : "en-US", true);
      });
    }
    hear.addEventListener("click", readAll);
    if (opts().readAloud) {
      hear.textContent = "🔊 Hear it";
      hear.classList.add("q-speak-big");
      window.setTimeout(readAll, 250);
    }
    parent.appendChild(hear);
    if (window.speechSynthesis && hear.hidden) {
      window.speechSynthesis.onvoiceschanged = function () {
        hear.hidden = !voiceFor(question.speakLang);
      };
    }

    var choices = document.createElement("div");
    choices.className = "q-choices";
    shuffle(question.choices).forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "q-choice";
      button.textContent = choice;
      button.setAttribute("data-choice", choice);
      decorate(button, choice);
      button.addEventListener("click", function () {
        if (opts().gentleRetry && !parent._retried && choice !== question.answer) {
          parent._retried = choice;
          button.disabled = true;
          button.classList.add("tried");
          var n = parent.querySelector("[data-note]");
          if (n) n.textContent = opts().oopsText || "Oops! Try again. You've got this.";
          if (opts().readAloud) speak("Oops! Try again.", "en-US");
          return;
        }
        if (opts().gentleRetry && parent._retried) {
          parent._secondTry = choice;
          onChoice(parent._retried, button);
          return;
        }
        onChoice(choice, button);
      });
      choices.appendChild(button);
    });
    parent.appendChild(choices);
    var note = document.createElement("p");
    note.className = "q-note";
    note.setAttribute("data-note", "1");
    parent.appendChild(note);
  }

  function lock(parent, choice, question, correct) {
    var buttons = parent.querySelectorAll(".q-choice");
    var i;
    if (opts().gentleRetry) {
      for (i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        if (buttons[i].getAttribute("data-choice") === question.answer) buttons[i].classList.add("right");
      }
      var soft = parent.querySelector("[data-note]");
      if (soft) {
        var lead2 = correct ? "Yes! " : (parent._secondTry === question.answer ? "You found it! " : "Good try! The answer is " + question.answer + ". ");
        soft.textContent = lead2 + (question.explain || "");
        if (opts().readAloud && !/[\u0590-\u05FF\u0E00-\u0E7F]/.test(lead2)) speak(correct ? "Yes!" : (parent._secondTry === question.answer ? "You found it!" : "Good try!"), "en-US");
      }
      return;
    }
    for (i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (buttons[i].getAttribute("data-choice") === question.answer) buttons[i].classList.add("right");
      else if (buttons[i].getAttribute("data-choice") === choice) buttons[i].classList.add("wrong");
    }
    var note = parent.querySelector("[data-note]");
    if (!note) return;
    var why = question.explain || "";
    if (!window.JoyceStyle || typeof window.JoyceStyle.t !== "function") {
      note.textContent = (correct ? "Yes! " : "Almost! ") + why;
      return;
    }
    var lead = correct
      ? window.JoyceStyle.t("ask.yes", "Yes! ")
      : window.JoyceStyle.t("ask.no", "Almost! ");
    note.textContent = lead + why;
  }

  root.Ask = { render: render, lock: lock, voiceFor: voiceFor, _shuffle: shuffle };
  if (typeof module !== "undefined" && module.exports) module.exports = root.Ask;
})(typeof globalThis !== "undefined" ? globalThis : this);
