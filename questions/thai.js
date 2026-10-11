/* Thai: simple everyday words in Thai script, with English meanings.
   Levels 1-7 show a Thai word and ask for the English meaning.
   Levels 8-9 show an English word and ask for the Thai word.
   Level 10 uses very short phrases.
   Every Thai word here is listed in thai-review.md so a native
   speaker can check the spelling and the spoken tones. */
(function (root) {
  function item(id, level, prompt, answer, wrongs, explain, speak) {
    return {
      id: id,
      level: level,
      prompt: prompt,
      choices: [answer].concat(wrongs),
      answer: answer,
      explain: explain,
      speak: speak || prompt,
      speakLang: speak ? "th-TH" : "en-US"
    };
  }

  var items = [
    /* Level 1: first animals */
    item("t1a", 1, "What does แมว mean?", "cat", ["dog", "fish", "bird"], "แมว (maew) means cat.", "แมว"),
    item("t1b", 1, "What does หมา mean?", "dog", ["cat", "duck", "horse"], "หมา (maa) means dog.", "หมา"),
    item("t1c", 1, "What does ปลา mean?", "fish", ["bird", "cow", "cat"], "ปลา (plaa) means fish.", "ปลา"),
    item("t1d", 1, "What does นก mean?", "bird", ["fish", "dog", "frog"], "นก (nok) means bird.", "นก"),
    item("t1e", 1, "What does ไก่ mean?", "chicken", ["duck", "cat", "pig"], "ไก่ (gai) means chicken.", "ไก่"),
    item("t1f", 1, "What does ช้าง mean?", "elephant", ["tiger", "monkey", "horse"], "ช้าง (chaang) means elephant.", "ช้าง"),

    /* Level 2: numbers 1-6 */
    item("t2a", 2, "What number is หนึ่ง?", "1", ["2", "3", "5"], "หนึ่ง (nueng) is one.", "หนึ่ง"),
    item("t2b", 2, "What number is สอง?", "2", ["1", "3", "4"], "สอง (song) is two.", "สอง"),
    item("t2c", 2, "What number is สาม?", "3", ["2", "4", "6"], "สาม (saam) is three.", "สาม"),
    item("t2d", 2, "What number is สี่?", "4", ["3", "5", "1"], "สี่ (sii) is four.", "สี่"),
    item("t2e", 2, "What number is ห้า?", "5", ["4", "6", "2"], "ห้า (haa) is five.", "ห้า"),
    item("t2f", 2, "What number is หก?", "6", ["5", "3", "1"], "หก (hok) is six.", "หก"),

    /* Level 3: colors */
    item("t3a", 3, "What color is สีแดง?", "red", ["blue", "green", "yellow"], "สีแดง (sii daeng) means red.", "สีแดง"),
    item("t3b", 3, "What color is สีเขียว?", "green", ["red", "black", "white"], "สีเขียว (sii khiao) means green.", "สีเขียว"),
    item("t3c", 3, "What color is สีเหลือง?", "yellow", ["green", "red", "blue"], "สีเหลือง (sii lueang) means yellow.", "สีเหลือง"),
    item("t3d", 3, "What color is สีน้ำเงิน?", "blue", ["yellow", "white", "red"], "สีน้ำเงิน (sii nam ngoen) means blue.", "สีน้ำเงิน"),
    item("t3e", 3, "What color is สีขาว?", "white", ["black", "green", "red"], "สีขาว (sii khao) means white.", "สีขาว"),
    item("t3f", 3, "What color is สีดำ?", "black", ["white", "yellow", "blue"], "สีดำ (sii dam) means black.", "สีดำ"),

    /* Level 4: family */
    item("t4a", 4, "What does แม่ mean?", "mom", ["dad", "grandma", "baby"], "แม่ (mae) means mom.", "แม่"),
    item("t4b", 4, "What does พ่อ mean?", "dad", ["mom", "grandpa", "friend"], "พ่อ (pho) means dad.", "พ่อ"),
    item("t4c", 4, "What does ยาย mean?", "grandma (mom's mom)", ["grandpa (mom's dad)", "dad", "teacher"], "ยาย (yaai) is grandma on mom's side.", "ยาย"),
    item("t4d", 4, "What does ตา mean?", "grandpa (mom's dad)", ["grandma (mom's mom)", "mom", "friend"], "ตา (taa) is grandpa on mom's side.", "ตา"),
    item("t4e", 4, "What does พี่สาว mean?", "older sister", ["younger brother", "mom", "older brother"], "พี่สาว (phii saao) means older sister.", "พี่สาว"),
    item("t4f", 4, "What does น้องชาย mean?", "younger brother", ["older sister", "dad", "grandpa (mom's dad)"], "น้องชาย (nong chaai) means younger brother.", "น้องชาย"),

    /* Level 5: food and drink */
    item("t5a", 5, "What does ข้าว mean?", "rice", ["bread", "milk", "egg"], "ข้าว (khao) means rice.", "ข้าว"),
    item("t5b", 5, "What does น้ำ mean?", "water", ["milk", "juice", "soup"], "น้ำ (nam) means water.", "น้ำ"),
    item("t5c", 5, "What does นม mean?", "milk", ["water", "rice", "egg"], "นม (nom) means milk.", "นม"),
    item("t5d", 5, "What does ไข่ mean?", "egg", ["rice", "banana", "milk"], "ไข่ (khai) means egg.", "ไข่"),
    item("t5e", 5, "What does กล้วย mean?", "banana", ["mango", "apple", "egg"], "กล้วย (gluai) means banana.", "กล้วย"),
    item("t5f", 5, "What does มะม่วง mean?", "mango", ["banana", "rice", "grapes"], "มะม่วง (ma muang) means mango.", "มะม่วง"),

    /* Level 6: more animals */
    item("t6a", 6, "What does ม้า mean?", "horse", ["cow", "dog", "elephant"], "ม้า (maa, high tone) means horse.", "ม้า"),
    item("t6b", 6, "What does วัว mean?", "cow", ["horse", "duck", "monkey"], "วัว (wua) means cow.", "วัว"),
    item("t6c", 6, "What does ลิง mean?", "monkey", ["tiger", "rabbit", "cat"], "ลิง (ling) means monkey.", "ลิง"),
    item("t6d", 6, "What does เสือ mean?", "tiger", ["lion", "monkey", "elephant"], "เสือ (suea) means tiger.", "เสือ"),
    item("t6e", 6, "What does กระต่าย mean?", "rabbit", ["mouse", "duck", "dog"], "กระต่าย (gra taai) means rabbit.", "กระต่าย"),
    item("t6f", 6, "What does เป็ด mean?", "duck", ["chicken", "fish", "bird"], "เป็ด (pet) means duck.", "เป็ด"),

    /* Level 7: numbers 7-10 and bigger */
    item("t7a", 7, "What number is เจ็ด?", "7", ["8", "6", "9"], "เจ็ด (jet) is seven.", "เจ็ด"),
    item("t7b", 7, "What number is แปด?", "8", ["7", "9", "10"], "แปด (paet) is eight.", "แปด"),
    item("t7c", 7, "What number is เก้า?", "9", ["8", "10", "6"], "เก้า (gao) is nine.", "เก้า"),
    item("t7d", 7, "What number is สิบ?", "10", ["9", "7", "20"], "สิบ (sip) is ten.", "สิบ"),
    item("t7e", 7, "What number is ยี่สิบ?", "20", ["10", "12", "100"], "ยี่สิบ (yii sip) is twenty.", "ยี่สิบ"),
    item("t7f", 7, "What number is ร้อย?", "100", ["10", "20", "1000"], "ร้อย (roi) is one hundred.", "ร้อย"),

    /* Level 8: English word, pick the Thai word */
    item("t8a", 8, "Which Thai word means hello?", "สวัสดี", ["ขอบคุณ", "บ้าน", "เพื่อน"], "สวัสดี (sa wat dii) means hello.", "สวัสดี"),
    item("t8b", 8, "Which Thai word means thank you?", "ขอบคุณ", ["สวัสดี", "หนังสือ", "โรงเรียน"], "ขอบคุณ (khop khun) means thank you.", "ขอบคุณ"),
    item("t8c", 8, "Which Thai word means house?", "บ้าน", ["โรงเรียน", "เพื่อน", "ครู"], "บ้าน (baan) means house or home.", "บ้าน"),
    item("t8d", 8, "Which Thai word means school?", "โรงเรียน", ["บ้าน", "หนังสือ", "ขอบคุณ"], "โรงเรียน (rong rian) means school.", "โรงเรียน"),
    item("t8e", 8, "Which Thai word means book?", "หนังสือ", ["ดินสอ", "ครู", "บ้าน"], "หนังสือ (nang sue) means book.", "หนังสือ"),
    item("t8f", 8, "Which Thai word means friend?", "เพื่อน", ["ครู", "แม่", "สวัสดี"], "เพื่อน (phuean) means friend.", "เพื่อน"),

    /* Level 9: more English to Thai */
    item("t9a", 9, "Which Thai word means purple?", "สีม่วง", ["สีชมพู", "สีส้ม", "สีน้ำตาล"], "สีม่วง (sii muang) means purple.", "สีม่วง"),
    item("t9b", 9, "Which Thai word means pink?", "สีชมพู", ["สีม่วง", "สีแดง", "สีส้ม"], "สีชมพู (sii chom phuu) means pink.", "สีชมพู"),
    item("t9c", 9, "Which Thai word means orange (the color)?", "สีส้ม", ["สีเหลือง", "สีชมพู", "สีน้ำตาล"], "สีส้ม (sii som) means orange.", "สีส้ม"),
    item("t9d", 9, "Which Thai word means tree?", "ต้นไม้", ["ดอกไม้", "บ้าน", "ดาว"], "ต้นไม้ (ton mai) means tree.", "ต้นไม้"),
    item("t9e", 9, "Which Thai word means flower?", "ดอกไม้", ["ต้นไม้", "ดาว", "น้ำ"], "ดอกไม้ (dok mai) means flower.", "ดอกไม้"),
    item("t9f", 9, "Which Thai word means teacher?", "ครู", ["เพื่อน", "พ่อ", "หนังสือ"], "ครู (khruu) means teacher.", "ครู"),

    /* Level 10: tiny phrases */
    item("t10a", 10, "What does แมวสีดำ mean?", "a black cat", ["a white cat", "a black dog", "a red fish"], "แมว is cat. สีดำ is black. In Thai the color comes after the thing.", "แมวสีดำ"),
    item("t10b", 10, "What does หมาสองตัว mean?", "two dogs", ["two cats", "three dogs", "one dog"], "หมา is dog. สอง is two. ตัว is the counting word for animals.", "หมาสองตัว"),
    item("t10c", 10, "What does ฉันรักแม่ mean?", "I love mom.", ["I love dad.", "Mom loves me.", "I see mom."], "ฉัน is I. รัก is love. แม่ is mom.", "ฉันรักแม่"),
    item("t10d", 10, "What does กินข้าว mean?", "eat (a meal)", ["drink water", "go to school", "read a book"], "กิน is eat. ข้าว is rice. กินข้าว means to eat a meal.", "กินข้าว"),
    item("t10e", 10, "What does ดื่มนม mean?", "drink milk", ["eat rice", "drink water", "buy milk"], "ดื่ม is drink. นม is milk.", "ดื่มนม"),
    item("t10f", 10, "What does ไปโรงเรียน mean?", "go to school", ["come home", "read a book", "see a friend"], "ไป is go. โรงเรียน is school.", "ไปโรงเรียน")
  ];

  root.Q_THAI = items;
  if (typeof module !== "undefined" && module.exports) module.exports = items;
})(typeof globalThis !== "undefined" ? globalThis : this);
