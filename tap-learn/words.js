/* Words for the tap games. en is always spoken. he and th are spoken
   only when that language is switched on AND the device has a voice for it.
   Every Thai word here is listed in thai-review.md for a native check. */
window.TAP_WORDS = {
  animals: {
    title: "Animals", emoji: "🐮", ask: "Where is the {en}?",
    items: [
      { id: "cow", en: "cow", he: "פָּרָה", th: "วัว", pic: "🐮", sound: "Moo" },
      { id: "dog", en: "dog", he: "כֶּלֶב", th: "หมา", pic: "🐶", sound: "Woof woof" },
      { id: "cat", en: "cat", he: "חָתוּל", th: "แมว", pic: "🐱", sound: "Meow" },
      { id: "duck", en: "duck", he: "בַּרְוָז", th: "เป็ด", pic: "🦆", sound: "Quack quack" },
      { id: "sheep", en: "sheep", he: "כִּבְשָׂה", th: "แกะ", pic: "🐑", sound: "Baa" },
      { id: "lion", en: "lion", he: "אַרְיֵה", th: "สิงโต", pic: "🦁", sound: "Roar" },
      { id: "fish", en: "fish", he: "דָּג", th: "ปลา", pic: "🐟", sound: "Blub blub" },
      { id: "bird", en: "bird", he: "צִפּוֹר", th: "นก", pic: "🐦", sound: "Tweet tweet" }
    ]
  },
  colors: {
    title: "Colors", emoji: "🎨", ask: "Where is {en}?",
    items: [
      { id: "red", en: "red", he: "אָדֹם", th: "สีแดง", color: "#e53935" },
      { id: "blue", en: "blue", he: "כָּחֹל", th: "สีน้ำเงิน", color: "#1e63d6" },
      { id: "green", en: "green", he: "יָרֹק", th: "สีเขียว", color: "#2e9e4f" },
      { id: "yellow", en: "yellow", he: "צָהֹב", th: "สีเหลือง", color: "#fdd835" },
      { id: "orange", en: "orange", he: "כָּתֹם", th: "สีส้ม", color: "#fb8c00" },
      { id: "purple", en: "purple", he: "סָגֹל", th: "สีม่วง", color: "#8e44ad" }
    ]
  },
  shapes: {
    title: "Shapes", emoji: "🔺", ask: "Where is the {en}?",
    items: [
      { id: "circle", en: "circle", he: "עִיגּוּל", th: "วงกลม", shape: "circle" },
      { id: "square", en: "square", he: "רִיבּוּעַ", th: "สี่เหลี่ยม", shape: "square" },
      { id: "triangle", en: "triangle", he: "מְשֻׁלָּשׁ", th: "สามเหลี่ยม", shape: "triangle" },
      { id: "star", en: "star", he: "כּוֹכָב", th: "ดาว", shape: "star" },
      { id: "heart", en: "heart", he: "לֵב", th: "หัวใจ", shape: "heart" }
    ]
  },
  count: {
    title: "Count", emoji: "🍎", ask: "Where {are} {en}?",
    items: [
      { id: "n1", n: 1, en: "one", he: "אַחַת", th: "หนึ่ง", pic: "🍎" },
      { id: "n2", n: 2, en: "two", he: "שְׁתַּיִם", th: "สอง", pic: "🍎" },
      { id: "n3", n: 3, en: "three", he: "שָׁלוֹשׁ", th: "สาม", pic: "🍎" },
      { id: "n4", n: 4, en: "four", he: "אַרְבַּע", th: "สี่", pic: "🍎" },
      { id: "n5", n: 5, en: "five", he: "חָמֵשׁ", th: "ห้า", pic: "🍎" }
    ]
  },
  shabbat: {
    title: "Shabbat", emoji: "🕯️", ask: "Where {is} the {en}?",
    items: [
      { id: "candles", en: "Shabbat candles", he: "נֵרוֹת שַׁבָּת", th: "เทียน", pic: "🕯️🕯️" },
      { id: "challah", en: "challah", he: "חַלָּה", th: "ขนมปังฮาลลาห์", pic: "🍞" },
      { id: "kiddush", en: "kiddush cup", he: "כּוֹס קִדּוּשׁ", th: "ถ้วยคิดดุช", pic: "🍷" },
      { id: "torah", en: "Torah", he: "תּוֹרָה", th: "โตราห์", pic: "📜" }
    ],
    cheer: { en: "Shabbat Shalom!", he: "שַׁבָּת שָׁלוֹם" }
  },
  alephbet: {
    title: "Aleph-Bet", emoji: "א", ask: "Where is {en}?",
    items: [
      { id: "alef", en: "alef", he: "אָלֶף", letter: "א" },
      { id: "bet", en: "bet", he: "בֵּית", letter: "ב" },
      { id: "gimel", en: "gimel", he: "גִּימֶל", letter: "ג" },
      { id: "dalet", en: "dalet", he: "דָּלֶת", letter: "ד" },
      { id: "shin", en: "shin", he: "שִׁין", letter: "ש" }
    ]
  }
};

/* Cheers at the end of a round, spoken in each language that is on. */
window.TAP_CHEERS = { en: "Yay! You did it!", he: "כָּל הַכָּבוֹד", th: "เก่งมาก" };
window.TAP_GENTLE = { en: "That's the {en}.", again: "Let's find the {en}." };
