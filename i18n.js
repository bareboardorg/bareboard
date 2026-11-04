/* BareBoard multilingual switcher.
   External file on purpose: the site CSP is script-src 'self', so no inline
   code is needed and no CSP change is required. Dictionaries live in
   /i18n/<lang>.json (same origin, allowed by default-src 'self'). */
(function () {
  "use strict";

  var LANGS = [
    { code: "en", name: "English", dir: "ltr" },
    { code: "af", name: "Afrikaans", dir: "ltr" },
    { code: "am", name: "አማርኛ", dir: "ltr" },
    { code: "ar", name: "العربية", dir: "rtl" },
    { code: "az", name: "Azərbaycanca", dir: "ltr" },
    { code: "be", name: "Беларуская", dir: "ltr" },
    { code: "bg", name: "Български", dir: "ltr" },
    { code: "bn", name: "বাংলা", dir: "ltr" },
    { code: "bs", name: "Bosanski", dir: "ltr" },
    { code: "ca", name: "Català", dir: "ltr" },
    { code: "cs", name: "Čeština", dir: "ltr" },
    { code: "da", name: "Dansk", dir: "ltr" },
    { code: "de", name: "Deutsch", dir: "ltr" },
    { code: "el", name: "Ελληνικά", dir: "ltr" },
    { code: "es", name: "Español", dir: "ltr" },
    { code: "eu", name: "Euskara", dir: "ltr" },
    { code: "fa", name: "فارسی", dir: "rtl" },
    { code: "fi", name: "Suomi", dir: "ltr" },
    { code: "fil", name: "Filipino", dir: "ltr" },
    { code: "fr", name: "Français", dir: "ltr" },
    { code: "he", name: "עברית", dir: "rtl" },
    { code: "hi", name: "हिन्दी", dir: "ltr" },
    { code: "hr", name: "Hrvatski", dir: "ltr" },
    { code: "hu", name: "Magyar", dir: "ltr" },
    { code: "hy", name: "Հայերեն", dir: "ltr" },
    { code: "id", name: "Bahasa Indonesia", dir: "ltr" },
    { code: "it", name: "Italiano", dir: "ltr" },
    { code: "ja", name: "日本語", dir: "ltr" },
    { code: "kk", name: "Қазақша", dir: "ltr" },
    { code: "ko", name: "한국어", dir: "ltr" },
    { code: "ms", name: "Bahasa Melayu", dir: "ltr" },
    { code: "nl", name: "Nederlands", dir: "ltr" },
    { code: "no", name: "Norsk", dir: "ltr" },
    { code: "pl", name: "Polski", dir: "ltr" },
    { code: "pt", name: "Português", dir: "ltr" },
    { code: "ro", name: "Română", dir: "ltr" },
    { code: "ru", name: "Русский", dir: "ltr" },
    { code: "sk", name: "Slovenčina", dir: "ltr" },
    { code: "sq", name: "Shqip", dir: "ltr" },
    { code: "sr", name: "Српски", dir: "ltr" },
    { code: "sv", name: "Svenska", dir: "ltr" },
    { code: "sw", name: "Kiswahili", dir: "ltr" },
    { code: "ta", name: "தமிழ்", dir: "ltr" },
    { code: "th", name: "ไทย", dir: "ltr" },
    { code: "tr", name: "Türkçe", dir: "ltr" },
    { code: "uk", name: "Українська", dir: "ltr" },
    { code: "ur", name: "اردو", dir: "rtl" },
    { code: "vi", name: "Tiếng Việt", dir: "ltr" },
    { code: "zh", name: "中文", dir: "ltr" }
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
