/* Most Wanted board — fills #mw-board from /data/most-wanted.json.
 *
 * most-wanted.html already carries a static list for visitors without
 * JavaScript. When the JSON loads, this replaces that list with the live
 * registry. When anything fails, the static list simply stays put: the
 * board is never left blank by a failed request. The fetch never leaves
 * this origin. */
(function () {
  "use strict";

  var board = document.getElementById("mw-board");
  if (!board) return;

  function renderEntry(entry) {
    var rows = [
      ["Sought for:", entry.soughtFor],
      ["Why it matters:", entry.whyItMatters],
      ["Priority:", entry.priority]
    ];
    var body = rows.map(function (row) {
      return "<p><strong>" + row[0] + "</strong> " + BB.esc(row[1]) + "</p>";
    }).join("");
    return "<li><h3>" + BB.esc(entry.name) + "</h3>" + body + "</li>";
  }

  fetch("/data/most-wanted.json")
    .then(function (response) {
      if (!response.ok) throw new Error("most-wanted.json: HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      var entries = data && data.entries;
      if (!Array.isArray(entries) || entries.length === 0) return;
      board.innerHTML = entries.map(renderEntry).join("");
      board.setAttribute("data-rendered-from", "data/most-wanted.json");
    })
    .catch(function () { /* leave the static list in place */ });
})();
