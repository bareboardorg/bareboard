/* Protocol Reverse Engineering notes — fills #proto-cards from
   protocol-re-notes.json, one card per protocol.
 *
 * This script is included on many pages, but only protocols.html has the
 * container, so it quietly does nothing everywhere else. */
(function () {
  "use strict";

  var container = document.getElementById("proto-cards");
  if (!container) return;

  function resourceList(items) {
    if (!items || items.length === 0) return "";
    var rows = items.map(function (item) {
      var out = '<li><a href="' + BB.esc(item.url) + '" rel="noopener">' + BB.esc(item.name) + "</a>";
      if (item.note) out += ' <span class="src">' + BB.esc(item.note) + "</span>";
      return out + "</li>";
    });
    return "<h3>Community resources</h3><ul>" + rows.join("") + "</ul>";
  }

  function card(entry) {
    var unknown = entry.still_unknown
      ? "<h3>Still unknown</h3><p>" + BB.esc(entry.still_unknown) + "</p>"
      : "";
    return '<article class="card">' +
      '<span class="kicker">' + BB.esc(entry.company) + "</span>" +
      "<h2>" + BB.esc(entry.protocol) + " " + BB.evBadge(entry.evidence) + "</h2>" +
      "<p>" + BB.esc(entry.what_it_does) + "</p>" +
      "<h3>Reverse engineered</h3><p>" + BB.esc(entry.reverse_engineered) + "</p>" +
      unknown +
      resourceList(entry.resources) +
      "</article>";
  }

  BB.loadJson("protocol-re-notes.json",
    function (data) {
      var entries = (data && data.entries) || [];
      container.innerHTML = entries.map(card).join("") || "<p>No protocols found.</p>";
    },
    function (err) {
      container.innerHTML = "<p>Could not load protocol-re-notes.json (" + BB.esc(err.message) + ").</p>";
    });
})();
