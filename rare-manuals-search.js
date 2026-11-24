/* Rare Manuals — search box plus decade and rarity pills over the
   static list of manual entries on rare-manuals.html. No fetch: the list
   is already in the page, and this script only shows and hides it. */
(function () {
  "use strict";

  var searchBox = document.getElementById("rm-search");
  var pillBar = document.getElementById("rm-filters");
  var countLine = document.getElementById("rm-count");
  var manuals = Array.prototype.slice.call(document.querySelectorAll("article.manual-entry"));
  if (manuals.length === 0) return;

  var chosenDecade = "all";
  var chosenRarity = "all";
  var query = "";

  function visible(entry) {
    if (chosenDecade !== "all" && entry.getAttribute("data-decade") !== chosenDecade) return false;
    if (chosenRarity !== "all" && entry.getAttribute("data-rarity") !== chosenRarity) return false;
    if (query && entry.textContent.toLowerCase().indexOf(query) === -1) return false;
    return true;
  }

  function refresh() {
    var shown = 0;
    manuals.forEach(function (entry) {
      var show = visible(entry);
      entry.style.display = show ? "" : "none";
      if (show) shown++;
    });
    /* A decade heading hides when none of its entries are showing. */
    var headings = document.querySelectorAll("h2[data-decade]");
    for (var i = 0; i < headings.length; i++) {
      var decade = headings[i].getAttribute("data-decade");
      var anyShown = manuals.some(function (entry) {
        return entry.getAttribute("data-decade") === decade && entry.style.display !== "none";
      });
      headings[i].style.display = anyShown ? "" : "none";
    }
    if (countLine) {
      countLine.textContent = "Showing " + shown + " of " + manuals.length + " manuals";
    }
  }

  function distinctValues(attr) {
    var found = [];
    manuals.forEach(function (entry) {
      var value = entry.getAttribute(attr);
      if (value && found.indexOf(value) === -1) found.push(value);
    });
    return found;
  }

  function pillGroup(label, values, allLabel, attr) {
    var pills = '<button type="button" class="pill pill--active" data-' + attr + '="all">' +
      BB.esc(allLabel) + "</button>";
    pills += values.map(function (value) {
      return '<button type="button" class="pill" data-' + attr + '="' + BB.esc(value) + '">' +
        BB.esc(value) + "</button>";
    }).join("");
    return '<div role="group" aria-label="' + BB.esc(label) + ' filter">' +
      "<span>" + BB.esc(label) + ": </span>" + pills + "</div>";
  }

  function buildPills() {
    if (!pillBar) return;
    pillBar.innerHTML =
      pillGroup("Decade", distinctValues("data-decade"), "All decades", "decade") +
      pillGroup("Rarity", distinctValues("data-rarity"), "All", "rarity");

    pillBar.addEventListener("click", function (event) {
      var pill = event.target.closest(".pill");
      if (!pill) return;
      var decade = pill.getAttribute("data-decade");
      var rarity = pill.getAttribute("data-rarity");
      var attr = null;
      if (decade !== null) {
        chosenDecade = decade;
        attr = "data-decade";
      } else if (rarity !== null) {
        chosenRarity = rarity;
        attr = "data-rarity";
      }
      if (!attr) return;
      var siblings = pillBar.querySelectorAll(".pill[" + attr + "]");
      for (var i = 0; i < siblings.length; i++) siblings[i].classList.remove("pill--active");
      pill.classList.add("pill--active");
      refresh();
    });
  }

  if (searchBox) {
    searchBox.addEventListener("input", function () {
      query = searchBox.value.trim().toLowerCase();
      refresh();
    });
  }

  buildPills();
  refresh();
})();
