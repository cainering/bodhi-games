/* Bodhi's buddies: Tommy the Tiger, Bonkers the Dog, Mr. Smash, and
   Muscles McFeathers. Tapping a buddy says hello out loud. On quiz pages
   the host emoji is swapped for a buddy picture. */
(function () {
  var base = /\/(level-test|practice|tap-learn)\//.test(location.pathname) ? "../" : "";
  var BUDDIES = [
    { name: "Tommy", img: "assets/buddies/tommy.jpg" },
    { name: "Bonkers", img: "assets/buddies/bonkers.jpg" },
    { name: "Mr. Smash", img: "assets/buddies/smash.jpg" },
    { name: "Muscles McFeathers", img: "assets/buddies/muscles.jpg" }
  ];
  var turn = Math.floor(Math.random() * BUDDIES.length);

  function say(text) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* no voice is fine */ }
  }

  document.querySelectorAll(".buddy[data-say]").forEach(function (btn) {
    btn.addEventListener("click", function () { say(btn.getAttribute("data-say")); });
  });

  function swapFaces() {
    document.querySelectorAll(".mascot-face").forEach(function (face) {
      if (face.querySelector("img")) return;
      var b = BUDDIES[turn % BUDDIES.length];
      turn += 1;
      face.textContent = "";
      var img = document.createElement("img");
      img.className = "buddy-face";
      img.src = base + b.img;
      img.alt = b.name;
      face.appendChild(img);
    });
  }
  /* A buddy cheers him on above every question (Treasure Map and Practice). */
  var CHEER = ["You can do it, Bodhi!", "Let's go, Bodhi!", "I believe in you!", "Tap the answer!"];
  var YAY = ["Yay! Great job!", "WOW! You did it!", "High five, Bodhi!"];
  var TRY = ["Oops! Try again!", "Almost! One more try!"];
  var cheerTurn = Math.floor(Math.random() * 3);
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function cheerOn() {
    var app = document.getElementById("app");
    if (!app) return;
    var card = app.querySelector(".q-card");
    var row = app.querySelector(".buddy-cheer");
    if (!card) { return; }
    if (!row) {
      var b = BUDDIES[cheerTurn % 3];
      cheerTurn += 1;
      row = document.createElement("div");
      row.className = "buddy-cheer";
      var img = document.createElement("img");
      img.src = base + b.img; img.alt = b.name;
      var bubble = document.createElement("p");
      bubble.className = "bubble";
      bubble.setAttribute("aria-live", "polite");
      var label = app.querySelector(".mascot p");
      bubble.textContent = pick(CHEER);
      if (label) { var small = document.createElement("span"); small.className = "label"; small.textContent = label.textContent; bubble.appendChild(small); }
      row.appendChild(img); row.appendChild(bubble);
      app.insertBefore(row, card);
    }
    var bub = row.querySelector(".bubble");
    var state = card.querySelector(".q-choice.right") ? "yay" : card.querySelector(".q-choice.tried") ? "try" : "go";
    if (row.getAttribute("data-state") !== state) {
      row.setAttribute("data-state", state);
      var keep = bub.querySelector(".label");
      if (state !== "go") {
        bub.textContent = state === "yay" ? pick(YAY) : pick(TRY);
        if (keep) bub.appendChild(keep);
      }
      row.classList.toggle("happy", state === "yay");
    }
  }
  function refresh() { swapFaces(); cheerOn(); }
  refresh();
  if (window.MutationObserver && document.body) {
    new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
})();
