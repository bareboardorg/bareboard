/* Chip Database — table view over chip-database.json with live search
   and manufacturer / function / evidence filters. */
(function () {
  "use strict";

  var rowsEl = document.getElementById("chip-rows");
  var countEl = document.getElementById("chip-count");
  var searchEl = document.getElementById("chip-search");
  var mfrEl = document.getElementById("chip-mfr");
  var funcEl = document.getElementById("chip-func");
  var evEl = document.getElementById("chip-ev");
  var entries = [];

  /* Fill a <select> with the sorted distinct values of one field. */
  function populateOptions(select, values) {
    var distinct = values.filter(function (value, index, self) {
      return value && self.indexOf(value) === index;
    }).sort();
    distinct.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function passesFilters(entry) {
    var query = searchEl.value.trim().toLowerCase();
    if (query) {
      var haystack = [entry.chip, entry.device, entry.chip_manufacturer, entry["function"]]
        .join(" ").toLowerCase();
      if (haystack.indexOf(query) === -1) return false;
    }
    if (mfrEl.value && entry.chip_manufacturer !== mfrEl.value) return false;
    if (funcEl.value && entry["function"] !== funcEl.value) return false;
    if (evEl.value && entry.evidence !== evEl.value) return false;
    return true;
  }

  function rowHtml(entry) {
    return "<tr><td><strong>" + BB.esc(entry.chip) + "</strong></td>" +
      "<td>" + BB.esc(entry.device) + "</td>" +
      '<td class="cat">' + BB.esc(entry.chip_manufacturer) + "</td>" +
      "<td>" + BB.esc(entry["function"]) + "</td>" +
      "<td>" + BB.evBadge(entry.evidence) + "</td>" +
      '<td class="src">' + BB.esc(entry.source) + "</td></tr>";
  }

  function render() {
    var visible = entries.filter(passesFilters);
    rowsEl.innerHTML = visible.length
      ? visible.map(rowHtml).join("")
      : '<tr><td colspan="6">No chips match the current filters.</td></tr>';
    countEl.textContent = "Showing " + visible.length + " of " + entries.length + " chips.";
  }

  [searchEl, mfrEl, funcEl, evEl].forEach(function (control) {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  fetch("chip-database.json", { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      entries = (data && data.entries) || [];
      populateOptions(mfrEl, entries.map(function (e) { return e.chip_manufacturer; }));
      populateOptions(funcEl, entries.map(function (e) { return e["function"]; }));
      render();
    })
    .catch(function (err) {
      rowsEl.innerHTML = '<tr><td colspan="6">Could not load chip-database.json (' +
        BB.esc(err.message) + ").</td></tr>";
    });
})();
