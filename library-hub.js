/* Library Hub — one searchable table over every collected document.
   The data is /data/library-index.json, built by tools/build-library-index.mjs.
   A search box, category pills, and a platform dropdown filter the table.
   The fetch never leaves this origin. */
(function () {
  "use strict";

  var searchBox = document.getElementById("hub-search");
  var platformMenu = document.getElementById("hub-platform");
  var pillBar = document.getElementById("hub-cat-filter");
  var countLine = document.getElementById("hub-count");
  var rowsEl = document.getElementById("hub-rows");
  var emptyNote = document.getElementById("hub-no-results");
  if (!searchBox || !platformMenu || !pillBar || !rowsEl) return;

  var CATEGORIES = [
    ["all", "All"],
    ["manual", "Manuals"],
    ["schematic", "Schematics"],
    ["documentation", "Documentation"],
    ["datasheet", "Datasheets"],
    ["lawsuit", "Lawsuits"],
    ["fda", "FDA"],
    ["fcc", "FCC"],
    ["other", "Other"]
  ];
  var LABELS = {};
  CATEGORIES.forEach(function (pair) { LABELS[pair[0]] = pair[1]; });

  var query = "";
  var chosenCat = "all";
  var chosenPlatform = "all";
  var docs = [];

  function humanSize(bytes) {
    if (bytes === null || bytes === undefined) return "\u2014";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  /* Search text is normalized so dashes and underscores read as spaces,
     matching how the query itself is normalized on input. */
  function searchableText(doc) {
    return [doc.title, doc.maker, doc.model, doc.platform,
      LABELS[doc.category] || doc.category, doc.doc_type]
      .join(" ").toLowerCase().replace(/[-_]+/g, " ");
  }

  function passes(doc) {
    if (chosenCat !== "all" && doc.category !== chosenCat) return false;
    if (chosenPlatform !== "all" && doc.platform !== chosenPlatform) return false;
    if (query && searchableText(doc).indexOf(query) === -1) return false;
    return true;
  }

  function docRow(doc) {
    var local = !!doc.url;
    var href = doc.url || doc.source_url || "";
    var link = '<a href="' + BB.esc(href) + '"' +
      (local ? "" : ' target="_blank" rel="noopener"') + ">" +
      BB.esc(doc.title) + (local ? "" : " \u2197") + "</a>";
    if (doc.model) link += '<br><span class="small">' + BB.esc(doc.model) + "</span>";
    return "<tr><td>" + link + "</td>" +
      "<td>" + BB.esc(doc.maker || "\u2014") + "</td>" +
      "<td>" + BB.esc(doc.platform || "\u2014") + "</td>" +
      "<td>" + BB.esc(LABELS[doc.category] || doc.category) + "</td>" +
      "<td>" + BB.esc(doc.doc_type || "\u2014") + "</td>" +
      "<td>" + (local ? humanSize(doc.bytes) : "External") + "</td></tr>";
  }

  function render() {
    var shown = docs.filter(passes);
    rowsEl.innerHTML = shown.map(docRow).join("");
    if (countLine) {
      countLine.textContent = "Showing " + shown.length + " of " + docs.length + " documents";
    }
    if (emptyNote) emptyNote.hidden = shown.length !== 0;
  }

  function buildFilters() {
    var perCategory = {};
    var platformSet = {};
    docs.forEach(function (doc) {
      perCategory[doc.category] = (perCategory[doc.category] || 0) + 1;
      if (doc.platform) platformSet[doc.platform] = true;
    });
    pillBar.innerHTML = "";
    CATEGORIES.forEach(function (pair) {
      var key = pair[0];
      var total = key === "all" ? docs.length : (perCategory[key] || 0);
      if (key !== "all" && total === 0) return;
      var pill = document.createElement("button");
      pill.type = "button";
      pill.dataset.cat = key;
      var active = chosenCat === key;
      pill.className = "pill" + (active ? " pill--active" : "");
      pill.textContent = pair[1] + " (" + total + ")";
      pill.setAttribute("aria-pressed", active ? "true" : "false");
      pillBar.appendChild(pill);
    });
    platformMenu.innerHTML = '<option value="all">All platforms</option>';
    Object.keys(platformSet).sort().forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      platformMenu.appendChild(option);
    });
  }

  pillBar.addEventListener("click", function (event) {
    var pill = event.target.closest ? event.target.closest("button[data-cat]") : null;
    if (!pill) return;
    chosenCat = pill.dataset.cat;
    Array.prototype.forEach.call(pillBar.querySelectorAll("button"), function (other) {
      var on = other.dataset.cat === chosenCat;
      other.className = "pill" + (on ? " pill--active" : "");
      other.setAttribute("aria-pressed", on ? "true" : "false");
    });
    render();
  });

  searchBox.addEventListener("input", function () {
    query = searchBox.value.trim().toLowerCase().replace(/[-_]+/g, " ");
    render();
  });

  platformMenu.addEventListener("change", function () {
    chosenPlatform = platformMenu.value;
    render();
  });

  if (countLine) countLine.textContent = "Loading the index\u2026";
  BB.loadJson("/data/library-index.json",
    function (data) {
      docs = (data && data.documents) || [];
      buildFilters();
      render();
    },
    function () {
      if (countLine) {
        countLine.textContent = "The index could not be loaded. " +
          "Browse the shelves instead: The Library, the Datasheet Index, " +
          "and Rare Manuals (links above).";
      }
      if (emptyNote) emptyNote.hidden = false;
    });
})();
