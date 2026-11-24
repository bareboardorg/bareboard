/* Datasheet index — search box plus category pills over the
   "Complete datasheet index" section (#all-datasheets) on datasheets.html.
   Everything filtered here is already in the page; there is no fetch. */
(function () {
  "use strict";

  var root = document.getElementById("all-datasheets");
  var searchBox = document.getElementById("ds-search");
  var pillBar = document.getElementById("ds-cat-filter");
  var countLine = document.getElementById("ds-count");
  var emptyNote = document.getElementById("ds-no-results");
  if (!root || !searchBox || !pillBar) return;

  /* One category per direct child <section> that holds a datasheet table. */
  var categories = Array.prototype.slice.call(root.querySelectorAll(":scope > section[id]"))
    .filter(function (section) {
      return section.querySelector("table.datasheet-table");
    });

  var selectedCat = "all";
  var query = "";

  function headingBase(heading) {
    return heading.textContent.replace(/\s*\(\d+(\/\d+)?\)\s*$/, "").trim();
  }

  function makePill(cat, label, pressed) {
    var pill = document.createElement("button");
    pill.type = "button";
    pill.dataset.cat = cat;
    pill.className = pressed ? "active" : "";
    pill.setAttribute("aria-pressed", pressed ? "true" : "false");
    if (label !== null) pill.textContent = label;
    return pill;
  }

  /* The "all" pill intentionally carries no label: that is how the page
     has always rendered it (an empty first pill), and the rewrite keeps
     the page looking exactly the same. */
  pillBar.appendChild(makePill("all", null, true));
  categories.forEach(function (section) {
    var heading = section.querySelector("h2");
    var label = heading ? headingBase(heading) : section.id;
    pillBar.appendChild(makePill(section.id, label, false));
  });
  var pills = Array.prototype.slice.call(pillBar.querySelectorAll("button"));

  pillBar.addEventListener("click", function (event) {
    var pill = event.target.closest("button");
    if (!pill) return;
    selectedCat = pill.dataset.cat;
    pills.forEach(function (other) {
      var on = other === pill;
      other.classList.toggle("active", on);
      other.setAttribute("aria-pressed", on ? "true" : "false");
    });
    refresh();
  });

  searchBox.addEventListener("input", function () {
    query = searchBox.value.trim().toLowerCase();
    refresh();
  });

  function refresh() {
    var shownTotal = 0;
    var rowTotal = 0;

    categories.forEach(function (section) {
      var inCategory = selectedCat === "all" || selectedCat === section.id;
      var rows = Array.prototype.slice.call(
        section.querySelectorAll("table.datasheet-table tbody tr"));
      var shownHere = 0;
      rows.forEach(function (row) {
        rowTotal++;
        var textMatch = !query || (row.textContent || "").toLowerCase().indexOf(query) !== -1;
        var show = inCategory && textMatch;
        row.hidden = !show;
        if (show) shownHere++;
      });
      /* A section with no visible rows hides itself entirely. */
      section.hidden = shownHere === 0;
      var heading = section.querySelector("h2");
      if (heading) {
        var base = headingBase(heading);
        heading.textContent = shownHere !== rows.length
          ? base + " (" + shownHere + "/" + rows.length + ")"
          : base + " (" + rows.length + ")";
      }
      shownTotal += shownHere;
    });

    /* The prose-only "no public datasheet" note is not a category table:
       it shows while browsing All (or its own id) when the query matches
       its text, and it is never counted in the totals. */
    var note = document.getElementById("no-public-datasheet");
    if (note) {
      var noteInCat = selectedCat === "all" || selectedCat === "no-public-datasheet";
      var noteMatches = !query || (note.textContent || "").toLowerCase().indexOf(query) !== -1;
      note.hidden = !(noteInCat && noteMatches);
    }

    if (countLine) {
      countLine.textContent = (query || selectedCat !== "all")
        ? "Showing " + shownTotal + " of " + rowTotal + " datasheets"
        : rowTotal + " datasheets indexed";
    }
    if (emptyNote) emptyNote.hidden = shownTotal !== 0;
  }

  refresh();
})();
