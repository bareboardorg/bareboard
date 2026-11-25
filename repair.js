/* Repair Guides — fills #repair-cards from repair-guides.json.
   Guides are shown worst repairability score first, so the devices that
   fight their owners hardest are the first thing a visitor sees. */
(function () {
  "use strict";

  var container = document.getElementById("repair-cards");

  function scorePill(score) {
    var tier = score <= 3 ? "score-bad" : score <= 6 ? "score-mid" : "score-ok";
    return '<span class="badge ' + tier + '">' + BB.esc(String(score)) + "/10</span>";
  }

  function bulletList(items) {
    if (!items || items.length === 0) return "";
    return "<ul>" + items.map(function (item) {
      return "<li>" + BB.esc(item) + "</li>";
    }).join("") + "</ul>";
  }

  function sourceList(refs) {
    if (!refs || refs.length === 0) return "";
    var rows = refs.map(function (ref) {
      return '<li><a href="' + BB.esc(ref.url) + '" rel="noopener">' +
        BB.esc(ref.label || ref.url) + "</a></li>";
    });
    return "<h3>Sources</h3><ul>" + rows.join("") + "</ul>";
  }

  function card(guide) {
    return '<article class="card">' +
      '<span class="kicker">' + BB.esc(guide.manufacturer) + " &middot; " + BB.esc(String(guide.year)) + "</span>" +
      "<h2>" + BB.esc(guide.device) + " " + scorePill(guide.ifixit_score) + "</h2>" +
      '<p class="src">' + BB.esc(guide.score_note || "") + " (score: " + BB.esc(guide.score_source || "iFixit") + ")</p>" +
      "<h3>Anti-repair tactics</h3>" + bulletList(guide.anti_repair_design) +
      "<h3>Tools needed</h3>" + bulletList(guide.tools_needed) +
      sourceList(guide.sources) +
      "</article>";
  }

  BB.loadJson("repair-guides.json",
    function (data) {
      var guides = ((data && data.guides) || []).slice().sort(function (a, b) {
        return a.ifixit_score - b.ifixit_score;
      });
      container.innerHTML = guides.map(card).join("") || "<p>No guides found.</p>";
    },
    function (err) {
      container.innerHTML = "<p>Could not load repair-guides.json (" + BB.esc(err.message) + ").</p>";
    });
})();
