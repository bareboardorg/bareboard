/* Planned Obsolescence Archive — fills #obs-cards from
   obsolescence-archive.json, one card per case. */
(function () {
  "use strict";

  var container = document.getElementById("obs-cards");

  function linkList(links) {
    if (!links || links.length === 0) return "";
    var items = links.map(function (link) {
      var text = BB.esc(link.publisher || link.note || link.url);
      var out = '<li><a href="' + BB.esc(link.url) + '" rel="noopener">' + text + "</a>";
      if (link.note) out += ' <span class="src">' + BB.esc(link.note) + "</span>";
      return out + "</li>";
    });
    return "<h3>Sources</h3><ul>" + items.join("") + "</ul>";
  }

  function card(entry) {
    return '<article class="card">' +
      '<span class="kicker">' + BB.esc(entry.company) + " &middot; " + BB.esc(entry.date) + "</span>" +
      "<h2>" + BB.esc(entry.title) + "</h2>" +
      "<p>" + BB.evBadge(entry.evidence) + ' <span class="src">Device: ' + BB.esc(entry.device) + "</span></p>" +
      "<p><strong>What happened:</strong> " + BB.esc(entry.what_happened) + "</p>" +
      "<p><strong>Outcome:</strong> " + BB.esc(entry.outcome) + "</p>" +
      linkList(entry.sources) +
      "</article>";
  }

  BB.loadJson("obsolescence-archive.json",
    function (data) {
      var entries = (data && data.entries) || [];
      container.innerHTML = entries.map(card).join("") || "<p>No cases found.</p>";
    },
    function (err) {
      container.innerHTML = "<p>Could not load obsolescence-archive.json (" + BB.esc(err.message) + ").</p>";
    });
})();
