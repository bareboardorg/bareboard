/* BareBoard multilingual switcher.
   External file on purpose: the site CSP is script-src 'self', so no inline
   code is needed and no CSP change is required. Dictionaries live in
   /i18n/<lang>.json (same origin, allowed by default-src 'self'). */
(function () {
  "use strict";

  var LANGS = [
    { code: "en", name: "English", dir: "ltr" },
    { code: "ab", name: "Аҧсуа", dir: "ltr" },
    { code: "ace", name: "Bahsa Acèh", dir: "ltr" },
    { code: "ach", name: "Acholi", dir: "ltr" },
    { code: "af", name: "Afrikaans", dir: "ltr" },
    { code: "ak", name: "Akan", dir: "ltr" },
    { code: "alz", name: "Alur", dir: "ltr" },
    { code: "am", name: "አማርኛ", dir: "ltr" },
    { code: "ar", name: "العربية", dir: "rtl" },
    { code: "as", name: "অসমীয়া", dir: "ltr" },
    { code: "awa", name: "अवधी", dir: "ltr" },
    { code: "ay", name: "Aymara", dir: "ltr" },
    { code: "az", name: "Azərbaycanca", dir: "ltr" },
    { code: "ba", name: "Башҡорт", dir: "ltr" },
    { code: "bal", name: "بلوچی", dir: "rtl" },
    { code: "ban", name: "Basa Bali", dir: "ltr" },
    { code: "bbc", name: "Batak Toba", dir: "ltr" },
    { code: "bci", name: "Baoulé", dir: "ltr" },
    { code: "be", name: "Беларуская", dir: "ltr" },
    { code: "bem", name: "Bemba", dir: "ltr" },
    { code: "bew", name: "Betawi", dir: "ltr" },
    { code: "bg", name: "Български", dir: "ltr" },
    { code: "bho", name: "भोजपुरी", dir: "ltr" },
    { code: "bik", name: "Bikol", dir: "ltr" },
    { code: "bm", name: "Bamanankan", dir: "ltr" },
    { code: "bn", name: "বাংলা", dir: "ltr" },
    { code: "br", name: "Brezhoneg", dir: "ltr" },
    { code: "bs", name: "Bosanski", dir: "ltr" },
    { code: "bts", name: "Batak Simalungun", dir: "ltr" },
    { code: "btx", name: "Karo", dir: "ltr" },
    { code: "bua", name: "Буряад", dir: "ltr" },
    { code: "ca", name: "Català", dir: "ltr" },
    { code: "ce", name: "Нохчийн", dir: "ltr" },
    { code: "ceb", name: "Cebuano", dir: "ltr" },
    { code: "cgg", name: "Kiga", dir: "ltr" },
    { code: "ch", name: "Chamoru", dir: "ltr" },
    { code: "chk", name: "Chuukese", dir: "ltr" },
    { code: "ckb", name: "کوردیی ناوەندی", dir: "rtl" },
    { code: "cnh", name: "Hakha Chin", dir: "ltr" },
    { code: "co", name: "Corsu", dir: "ltr" },
    { code: "crh", name: "Qırım Tili", dir: "ltr" },
    { code: "cs", name: "Čeština", dir: "ltr" },
    { code: "cv", name: "Чӑваш", dir: "ltr" },
    { code: "cy", name: "Cymraeg", dir: "ltr" },
    { code: "da", name: "Dansk", dir: "ltr" },
    { code: "de", name: "Deutsch", dir: "ltr" },
    { code: "din", name: "Dinka", dir: "ltr" },
    { code: "doi", name: "डोगरी", dir: "ltr" },
    { code: "dov", name: "Dombe", dir: "ltr" },
    { code: "dv", name: "ދިވެހި", dir: "rtl" },
    { code: "dyu", name: "Dyula", dir: "ltr" },
    { code: "dz", name: "རྫོང་ཁ", dir: "ltr" },
    { code: "ee", name: "Eʋegbe", dir: "ltr" },
    { code: "el", name: "Ελληνικά", dir: "ltr" },
    { code: "eo", name: "Esperanto", dir: "ltr" },
    { code: "es", name: "Español", dir: "ltr" },
    { code: "et", name: "Eesti", dir: "ltr" },
    { code: "eu", name: "Euskara", dir: "ltr" },
    { code: "fa", name: "فارسی", dir: "rtl" },
    { code: "ff", name: "Fulani", dir: "ltr" },
    { code: "fi", name: "Suomi", dir: "ltr" },
    { code: "fil", name: "Filipino", dir: "ltr" },
    { code: "fon", name: "Fon", dir: "ltr" },
    { code: "fr", name: "Français", dir: "ltr" },
    { code: "fur", name: "Furlan", dir: "ltr" },
    { code: "fy", name: "Frysk", dir: "ltr" },
    { code: "ga", name: "Gaeilge", dir: "ltr" },
    { code: "gd", name: "Gàidhlig", dir: "ltr" },
    { code: "gl", name: "Galego", dir: "ltr" },
    { code: "gom", name: "कोंकणी", dir: "ltr" },
    { code: "gu", name: "ગુજરાતી", dir: "ltr" },
    { code: "gv", name: "Gaelg", dir: "ltr" },
    { code: "ha", name: "Hausa", dir: "ltr" },
    { code: "haw", name: "ʻŌlelo Hawaiʻi", dir: "ltr" },
    { code: "he", name: "עברית", dir: "rtl" },
    { code: "hi", name: "हिन्दी", dir: "ltr" },
    { code: "hil", name: "Hilagaynon", dir: "ltr" },
    { code: "hmn", name: "Hmong", dir: "ltr" },
    { code: "hr", name: "Hrvatski", dir: "ltr" },
    { code: "ht", name: "Kreyòl Ayisyen", dir: "ltr" },
    { code: "hu", name: "Magyar", dir: "ltr" },
    { code: "hy", name: "Հայերեն", dir: "ltr" },
    { code: "id", name: "Bahasa Indonesia", dir: "ltr" },
    { code: "ig", name: "Igbo", dir: "ltr" },
    { code: "ilo", name: "Ilokano", dir: "ltr" },
    { code: "is", name: "Íslenska", dir: "ltr" },
    { code: "it", name: "Italiano", dir: "ltr" },
    { code: "ja", name: "日本語", dir: "ltr" },
    { code: "jam", name: "Jamaican Patois", dir: "ltr" },
    { code: "jv", name: "Basa Jawa", dir: "ltr" },
    { code: "ka", name: "ქართული", dir: "ltr" },
    { code: "kac", name: "Jinghpaw", dir: "ltr" },
    { code: "kg", name: "Kikongo", dir: "ltr" },
    { code: "kha", name: "Khasi", dir: "ltr" },
    { code: "kk", name: "Қазақша", dir: "ltr" },
    { code: "kl", name: "Kalaallisut", dir: "ltr" },
    { code: "km", name: "ខ្មែរ", dir: "ltr" },
    { code: "kn", name: "ಕನ್ನಡ", dir: "ltr" },
    { code: "ko", name: "한국어", dir: "ltr" },
    { code: "kr", name: "Kanuri", dir: "ltr" },
    { code: "ktu", name: "Kituba", dir: "ltr" },
    { code: "ku", name: "Kurdî", dir: "ltr" },
    { code: "kv", name: "Коми", dir: "ltr" },
    { code: "ky", name: "Кыргызча", dir: "ltr" },
    { code: "la", name: "Latina", dir: "ltr" },
    { code: "lb", name: "Lëtzebuergesch", dir: "ltr" },
    { code: "lg", name: "Luganda", dir: "ltr" },
    { code: "li", name: "Limburgs", dir: "ltr" },
    { code: "lij", name: "Ligurian", dir: "ltr" },
    { code: "lmo", name: "Lombard", dir: "ltr" },
    { code: "ln", name: "Lingála", dir: "ltr" },
    { code: "lo", name: "ລາວ", dir: "ltr" },
    { code: "lt", name: "Lietuvių", dir: "ltr" },
    { code: "ltg", name: "Latgalian", dir: "ltr" },
    { code: "luo", name: "Dholuo", dir: "ltr" },
    { code: "lus", name: "Mizo ṭawng", dir: "ltr" },
    { code: "lv", name: "Latviešu", dir: "ltr" },
    { code: "mad", name: "Madhura", dir: "ltr" },
    { code: "mai", name: "मैथिली", dir: "ltr" },
    { code: "mam", name: "Mam", dir: "ltr" },
    { code: "mfe", name: "Kreol Morisien", dir: "ltr" },
    { code: "mg", name: "Malagasy", dir: "ltr" },
    { code: "mh", name: "Kajin M̧ajeļ", dir: "ltr" },
    { code: "mhr", name: "Марий", dir: "ltr" },
    { code: "mi", name: "Te Reo Māori", dir: "ltr" },
    { code: "min", name: "Minangkabau", dir: "ltr" },
    { code: "mk", name: "Македонски", dir: "ltr" },
    { code: "mn", name: "Монгол", dir: "ltr" },
    { code: "ms", name: "Bahasa Melayu", dir: "ltr" },
    { code: "mt", name: "Malti", dir: "ltr" },
    { code: "mwr", name: "मारवाडी", dir: "ltr" },
    { code: "my", name: "မြန်မာ", dir: "ltr" },
    { code: "ne", name: "नेपाली", dir: "ltr" },
    { code: "new", name: "Nepalbhasa", dir: "ltr" },
    { code: "nhe", name: "Nahuatl", dir: "ltr" },
    { code: "nl", name: "Nederlands", dir: "ltr" },
    { code: "no", name: "Norsk", dir: "ltr" },
    { code: "nr", name: "Ndebele", dir: "ltr" },
    { code: "nso", name: "Sepedi", dir: "ltr" },
    { code: "nus", name: "Nuer", dir: "ltr" },
    { code: "ny", name: "Chichewa", dir: "ltr" },
    { code: "oc", name: "Occitan", dir: "ltr" },
    { code: "om", name: "Afaan Oromoo", dir: "ltr" },
    { code: "or", name: "ଓଡ଼ିଆ", dir: "ltr" },
    { code: "os", name: "Ирон", dir: "ltr" },
    { code: "pa", name: "ਪੰਜਾਬੀ", dir: "ltr" },
    { code: "pag", name: "Pangasinan", dir: "ltr" },
    { code: "pam", name: "Kapampangan", dir: "ltr" },
    { code: "pap", name: "Papiamento", dir: "ltr" },
    { code: "pl", name: "Polski", dir: "ltr" },
    { code: "ps", name: "پښتو", dir: "rtl" },
    { code: "pt", name: "Português", dir: "ltr" },
    { code: "qu", name: "Runasimi", dir: "ltr" },
    { code: "rn", name: "Kirundi", dir: "ltr" },
    { code: "ro", name: "Română", dir: "ltr" },
    { code: "rom", name: "Romani", dir: "ltr" },
    { code: "ru", name: "Русский", dir: "ltr" },
    { code: "rw", name: "Kinyarwanda", dir: "ltr" },
    { code: "sa", name: "संस्कृतम्", dir: "ltr" },
    { code: "sah", name: "Саха", dir: "ltr" },
    { code: "sat", name: "Santali", dir: "ltr" },
    { code: "scn", name: "Sicilianu", dir: "ltr" },
    { code: "sd", name: "سنڌي", dir: "rtl" },
    { code: "se", name: "Davvisámegiella", dir: "ltr" },
    { code: "sg", name: "Sango", dir: "ltr" },
    { code: "shn", name: "ရှမ်း", dir: "ltr" },
    { code: "si", name: "සිංහල", dir: "ltr" },
    { code: "sk", name: "Slovenčina", dir: "ltr" },
    { code: "sl", name: "Slovenščina", dir: "ltr" },
    { code: "sm", name: "Gagana Samoa", dir: "ltr" },
    { code: "sn", name: "chiShona", dir: "ltr" },
    { code: "so", name: "Soomaali", dir: "ltr" },
    { code: "sq", name: "Shqip", dir: "ltr" },
    { code: "sr", name: "Српски", dir: "ltr" },
    { code: "ss", name: "Siswati", dir: "ltr" },
    { code: "st", name: "Sesotho", dir: "ltr" },
    { code: "su", name: "Basa Sunda", dir: "ltr" },
    { code: "sv", name: "Svenska", dir: "ltr" },
    { code: "sw", name: "Kiswahili", dir: "ltr" },
    { code: "szl", name: "Ślōnski", dir: "ltr" },
    { code: "ta", name: "தமிழ்", dir: "ltr" },
    { code: "tcy", name: "ತುಳು", dir: "ltr" },
    { code: "te", name: "తెలుగు", dir: "ltr" },
    { code: "tet", name: "Tetun", dir: "ltr" },
    { code: "tg", name: "Тоҷикӣ", dir: "ltr" },
    { code: "th", name: "ไทย", dir: "ltr" },
    { code: "ti", name: "ትግርኛ", dir: "ltr" },
    { code: "tiv", name: "Tiv", dir: "ltr" },
    { code: "tk", name: "Türkmençe", dir: "ltr" },
    { code: "tn", name: "Setswana", dir: "ltr" },
    { code: "to", name: "Lea Faka-Tonga", dir: "ltr" },
    { code: "tpi", name: "Tok Pisin", dir: "ltr" },
    { code: "tr", name: "Türkçe", dir: "ltr" },
    { code: "trp", name: "Kokborok", dir: "ltr" },
    { code: "ts", name: "Xitsonga", dir: "ltr" },
    { code: "tum", name: "Tumbuka", dir: "ltr" },
    { code: "tw", name: "Twi", dir: "ltr" },
    { code: "udm", name: "Удмурт", dir: "ltr" },
    { code: "ug", name: "ئۇيغۇرچە", dir: "rtl" },
    { code: "uk", name: "Українська", dir: "ltr" },
    { code: "ur", name: "اردو", dir: "rtl" },
    { code: "uz", name: "Oʻzbekcha", dir: "ltr" },
    { code: "ve", name: "Tshivenda", dir: "ltr" },
    { code: "vec", name: "Venetan", dir: "ltr" },
    { code: "vi", name: "Tiếng Việt", dir: "ltr" },
    { code: "war", name: "Waray", dir: "ltr" },
    { code: "wo", name: "Wolof", dir: "ltr" },
    { code: "xh", name: "isiXhosa", dir: "ltr" },
    { code: "yi", name: "ייִדיש", dir: "rtl" },
    { code: "yo", name: "Yorùbá", dir: "ltr" },
    { code: "yue", name: "粵語", dir: "ltr" },
    { code: "zh", name: "中文", dir: "ltr" },
    { code: "zh-TW", name: "繁體中文", dir: "ltr" },
    { code: "zu", name: "isiZulu", dir: "ltr" }
  ];
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  var originals = []; // {node, text} or {el, attr, text}
  var current = "en";
  var dict = null;
  var selectEl = null;

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }

  function remember(node, attr) {
    for (var i = 0; i < originals.length; i++) {
      if (originals[i].node === node && originals[i].attr === attr) return;
    }
    originals.push({ node: node, attr: attr, text: attr ? node.getAttribute(attr) : node.nodeValue });
  }

  function restore() {
    for (var i = 0; i < originals.length; i++) {
      var o = originals[i];
      if (o.attr) { o.node.setAttribute(o.attr, o.text); }
      else { o.node.nodeValue = o.text; }
    }
  }

  function translateTextNode(node) {
    var raw = node.nodeValue;
    if (!raw) return;
    var key = norm(raw);
    if (!key || !dict[key]) return;
    remember(node, null);
    var lead = raw.match(/^\s*/)[0];
    var trail = raw.match(/\s*$/)[0];
    node.nodeValue = lead + dict[key] + trail;
  }

  function applyDict() {
    if (!dict) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentNode;
        while (p && p.nodeType === 1) {
          if (SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return norm(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(translateTextNode);

    // Attributes: alt / title / aria-label / placeholder
    var attrs = ["alt", "title", "aria-label", "placeholder"];
    var els = document.body.querySelectorAll("[alt],[title],[aria-label],[placeholder]");
    els.forEach(function (el) {
      attrs.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        var key = norm(el.getAttribute(a) || "");
        if (key && dict[key]) { remember(el, a); el.setAttribute(a, dict[key]); }
      });
    });

    // Page <title>
    var tKey = norm(document.title || "");
    if (tKey && dict[tKey]) document.title = dict[tKey];
  }

  function setLang(code, save) {
    var meta = null;
    LANGS.forEach(function (l) { if (l.code === code) meta = l; });
    if (!meta) { code = "en"; meta = LANGS[0]; }
    current = code;
    if (save) { try { localStorage.setItem("bb-lang", code); } catch (e) {} }
    document.documentElement.setAttribute("lang", code === "zh" ? "zh-CN" : code);
    document.documentElement.setAttribute("dir", meta.dir);
    if (selectEl) selectEl.value = code;
    restore();
    if (code === "en") { dict = null; return; }
    fetch("/i18n/" + code + ".json", { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (json) { if (current === code) { dict = json; applyDict(); } })
      .catch(function () { /* dictionary missing: page stays in English */ });
  }

  function buildSelector() {
    var host = document.querySelector(".nav-inner") || document.querySelector("header") || document.body;
    var wrap = document.createElement("div");
    wrap.className = "bb-lang";
    var label = document.createElement("label");
    label.className = "bb-lang-label";
    label.setAttribute("for", "bb-lang-select");
    label.textContent = "Language";
    selectEl = document.createElement("select");
    selectEl.id = "bb-lang-select";
    selectEl.className = "bb-lang-select";
    selectEl.setAttribute("aria-label", "Language");
    LANGS.forEach(function (l) {
      var opt = document.createElement("option");
      opt.value = l.code;
      opt.textContent = l.name;
      selectEl.appendChild(opt);
    });
    selectEl.addEventListener("change", function () { setLang(selectEl.value, true); });
    wrap.appendChild(label);
    wrap.appendChild(selectEl);
    host.appendChild(wrap);
  }

  function init() {
    buildSelector();
    var saved = null;
    try { saved = localStorage.getItem("bb-lang"); } catch (e) {}
    var rawTag = (navigator.language || "en").toLowerCase();
    var auto = rawTag.split("-")[0];
    // Filipino browsers may report a 3-letter tag; check the full tag first.
    var initial = saved || (LANGS.some(function (l) { return l.code === rawTag; }) ? rawTag : auto) || "en";
    var known = LANGS.some(function (l) { return l.code === initial; });
    setLang(known ? initial : "en", false);
    // Late-inserted content (nav/search scripts) gets a second pass.
    setTimeout(function () { if (dict) applyDict(); }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
