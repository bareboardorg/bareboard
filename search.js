/* Site search — a static index, searched in the browser, no backend.
 *
 * The magnifier in the navigation bar opens a full-width frosted panel.
 * The index (search-index.json) is fetched the first time the panel opens
 * and kept for the rest of the page. Everything stays same-origin.
 *
 * Keyboard: "/" or Cmd/Ctrl+K opens the panel and focuses the box;
 * Escape closes it. Pages opt in with:
 *   <script src="/search.js" defer></script>
 */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var toggle = document.querySelector(".search-toggle");
  var panel = document.getElementById("search-panel");
  var box = document.getElementById("site-search");
  var results = document.getElementById("search-results");
  var closer = document.querySelector(".search-close");
  if (!toggle || !panel || !box || !results) return;

  var index = null;
  var loadFailed = false;
  var SHOWN = 8;
  var FADE_MS = 260;

  function foldNav() {
    document.querySelectorAll(".site-nav li.has-children.open").forEach(function (item) {
      item.classList.remove("open", "selected");
      var link = item.querySelector(":scope > a");
      if (link) link.setAttribute("aria-expanded", "false");
    });
  }

  function panelOpen() {
    return panel.classList.contains("open");
  }

  function showPanel() {
    foldNav();
    panel.hidden = false;
    /* Touch a layout property so the fade transition runs even when the
       panel was only just unhidden. */
    void panel.offsetWidth;
    panel.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    ensureIndex();
    box.focus();
  }

  function hidePanel() {
    if (!panelOpen()) return;
    panel.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    setTimeout(function () {
      if (!panelOpen()) {
        panel.hidden = true;
        results.innerHTML = "";
      }
    }, FADE_MS);
  }

  /* The navigation script closes search when it opens a dropdown panel. */
  window.BareBoardSearch = { open: showPanel, close: hidePanel, isOpen: panelOpen };

  function ensureIndex() {
    if (index || loadFailed) {
      if (index && box.value.trim()) runSearch(box.value);
      return;
    }
    fetch("/search-index.json")
      .then(function (response) {
        if (!response.ok) throw new Error("http " + response.status);
        return response.json();
      })
      .then(function (data) {
        index = data;
        if (box.value.trim()) runSearch(box.value);
      })
      .catch(function () {
        loadFailed = true;
        results.innerHTML = "";
        var note = document.createElement("li");
        note.className = "search-empty";
        note.textContent = "Search is unavailable right now.";
        results.appendChild(note);
      });
  }

  /* Ranking: a title hit counts most, then a heading hit, then body text,
     with a bonus when the title starts with the query. */
  function rank(entry, query) {
    var title = (entry.title || "").toLowerCase();
    var headings = (entry.headings || []).join(" ").toLowerCase();
    var body = (entry.text || "").toLowerCase();
    var total = 0;
    if (title.indexOf(query) !== -1) total += 10;
    if (headings.indexOf(query) !== -1) total += 5;
    if (body.indexOf(query) !== -1) total += 2;
    if (title.indexOf(query) === 0) total += 4;
    return total;
  }

  function excerpt(entry, query) {
    var body = entry.text || "";
    var at = body.toLowerCase().indexOf(query);
    if (at === -1) return body.slice(0, 140);
    var from = Math.max(0, at - 60);
    var piece = body.slice(from, from + 160);
    return (from > 0 ? "\u2026" : "") + piece +
      (from + 160 < body.length ? "\u2026" : "");
  }

  function runSearch(raw) {
    var query = raw.trim().toLowerCase();
    results.innerHTML = "";
    if (query.length < 2 || !index) return;
    var words = query.split(/\s+/);
    var found = [];
    index.forEach(function (entry) {
      var haystack = ((entry.title || "") + " " + (entry.headings || []).join(" ") +
        " " + (entry.text || "")).toLowerCase();
      var covers = words.every(function (word) { return haystack.indexOf(word) !== -1; });
      if (covers) found.push({ entry: entry, rank: rank(entry, query) });
    });
    found.sort(function (a, b) { return b.rank - a.rank; });
    showResults(found.slice(0, SHOWN), raw.trim());
  }

  function showResults(hits, query) {
    results.innerHTML = "";
    if (hits.length === 0) {
      var empty = document.createElement("li");
      empty.className = "search-empty";
      empty.textContent = "No results for \u201C" + query + "\u201D.";
      results.appendChild(empty);
      return;
    }
    hits.forEach(function (hit) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = hit.entry.url;
      var title = document.createElement("span");
      title.className = "res-title";
      title.textContent = hit.entry.title;
      var address = document.createElement("span");
      address.className = "res-url";
      address.textContent = "bareboard.org" + hit.entry.url;
      var snip = document.createElement("span");
      snip.className = "res-snippet";
      snip.textContent = excerpt(hit.entry, query.toLowerCase());
      link.appendChild(title);
      link.appendChild(address);
      link.appendChild(snip);
      item.appendChild(link);
      results.appendChild(item);
    });
  }

  function afterPause(fn, ms) {
    var timer = null;
    return function () {
      clearTimeout(timer);
      var args = arguments;
      timer = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }

  toggle.addEventListener("click", function () {
    if (panelOpen()) hidePanel();
    else showPanel();
  });
  if (closer) closer.addEventListener("click", hidePanel);

  box.addEventListener("input", afterPause(function () {
    runSearch(box.value);
  }, 120));

  document.addEventListener("keydown", function (event) {
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    var typing = /^(INPUT|TEXTAREA)$/.test(tag);
    var commandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
    if ((event.key === "/" && !typing) || commandK) {
      event.preventDefault();
      if (!panelOpen()) showPanel();
      else box.focus();
    } else if (event.key === "Escape" && panelOpen()) {
      event.preventDefault();
      hidePanel();
      toggle.focus();
    }
  });
})();
