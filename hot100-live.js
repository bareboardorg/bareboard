/* Hot 100 — card grid for the curated hardware ranking, fed by
   hot100-live.json (or the JSON named in the grid's data-json attribute).
   Category pills plus a search box filter the grid; cards always sort by
   rank. The list is editorial and static: nothing here pretends to move. */
(function () {
  "use strict";

  var grid = document.getElementById("hot100-grid");
  var updatedLine = document.getElementById("hot100-updated");
  var methodBox = document.getElementById("hot100-methodology");
  var countLine = document.getElementById("hot100-count");
  var pillBar = document.getElementById("hot100-filters");
  var searchBox = document.getElementById("hot100-search");
  if (!grid) return;

  var devices = [];
  var chosenCategory = "all";
  var query = "";

  /* Evidence pill. The colors come from style.css (.ev-* classes): the
     page policy blocks style attributes, including ones set through
     innerHTML, so the class has to carry the color. */
  function evidencePill(level) {
    var styles = {
      confirmed: "ev-confirmed",
      likely: "ev-likely",
      unconfirmed: "ev-unconfirmed"
    };
    return '<span class="ev ' + (styles[level] || "ev-unconfirmed") + '">' +
      BB.esc(level) + "</span>";
  }

  function sourceLinks(refs) {
    if (!refs || refs.length === 0) return "";
    return refs.map(function (ref, i) {
      var label = ref.type ? BB.esc(ref.type) : "source " + (i + 1);
      var note = ref.note ? ' title="' + BB.esc(ref.note) + '"' : "";
      return '<a href="' + BB.esc(ref.url) + '"' + note +
        ' target="_blank" rel="noopener">[' + label + "]</a>";
    }).join(" ");
  }

  /* A repair guide only earns its button when it exists, is a real type,
     and has been verified. Unverified or absent guides get no link. */
  function verifiedGuideUrl(device) {
    var guide = device.repair_guide;
    if (!guide || guide.type === "none" || !guide.verified) return null;
    return guide.archive_url || guide.source_url || null;
  }

  function guideRow(device) {
    var url = verifiedGuideUrl(device);
    if (!url) {
      return '<p class="hot-guide hot-guide--none">No verified repair guide found</p>';
    }
    var who = device.repair_guide.type === "ifixit" ? "iFixit" : "the maker";
    return '<p class="hot-guide"><a class="guide-btn" href="' + BB.esc(url) +
      '" target="_blank" rel="noopener">Repair guide &mdash; ' + BB.esc(who) + "</a></p>";
  }

  function deviceCard(device) {
    var guide = verifiedGuideUrl(device);
    var firstSource = device.sources && device.sources[0] && device.sources[0].url;
    var titleUrl = guide || firstSource || null;
    var title = titleUrl
      ? '<a href="' + BB.esc(titleUrl) + '" target="_blank" rel="noopener">' + BB.esc(device.name) + "</a>"
      : BB.esc(device.name);
    var thumb = device.image
      ? '<img class="hot-thumb" src="' + BB.esc(device.image) + '" alt="' + BB.esc(device.name) +
        '" loading="lazy" referrerpolicy="no-referrer">'
      : '<div class="hot-thumb hot-thumb--none" aria-hidden="true"><span>BB</span></div>';
    var demand = device.user_demand_score
      ? '<p class="hot-uds">User demand score: ' + BB.esc(device.user_demand_score.score) + " / 10</p>"
      : "";
    return '<article class="card hot-card">' +
      '<div class="hot-rank">#' + BB.esc(device.rank) + "</div>" +
      thumb +
      '<div class="hot-body">' +
      "<h2>" + title + "</h2>" +
      '<p class="hot-meta">' + BB.esc(device.manufacturer) + " &middot; " + BB.esc(device.category) +
      " &middot; " + evidencePill(device.evidence) + "</p>" +
      demand +
      guideRow(device) +
      '<p class="hot-sources">' + sourceLinks(device.sources) + "</p>" +
      "</div></article>";
  }

  function passes(device) {
    if (chosenCategory !== "all" && device.category !== chosenCategory) return false;
    if (query) {
      var haystack = [device.name, device.manufacturer, device.category,
        device.why || "", (device.aliases || []).join(" ")].join(" ").toLowerCase();
      if (haystack.indexOf(query) === -1) return false;
    }
    return true;
  }

  function byRank(a, b) { return a.rank - b.rank; }

  function render() {
    var shown = devices.filter(passes).sort(byRank);
    grid.innerHTML = shown.length
      ? shown.map(deviceCard).join("")
      : '<p class="lede">No devices match the current filters.</p>';
    if (countLine) {
      countLine.textContent = "Showing " + shown.length + " of " + devices.length + " devices";
    }
  }

  function buildCategoryPills() {
    if (!pillBar) return;
    var categories = [];
    devices.forEach(function (device) {
      if (categories.indexOf(device.category) === -1) categories.push(device.category);
    });
    categories.sort();
    var markup = '<button type="button" class="pill pill--active" data-cat="all">All</button>' +
      categories.map(function (category) {
        return '<button type="button" class="pill" data-cat="' + BB.esc(category) + '">' +
          BB.esc(category) + "</button>";
      }).join("");
    pillBar.innerHTML = markup;
    pillBar.addEventListener("click", function (event) {
      var pill = event.target.closest(".pill");
      if (!pill) return;
      chosenCategory = pill.getAttribute("data-cat");
      var pills = pillBar.querySelectorAll(".pill");
      for (var i = 0; i < pills.length; i++) pills[i].classList.remove("pill--active");
      pill.classList.add("pill--active");
      render();
    });
  }

  function showMethodology(data) {
    if (!methodBox) return;
    var parts = [];
    if (data.methodology) parts.push("<p>" + BB.esc(data.methodology) + "</p>");
    if (data.ranking_basis) parts.push("<p><em>" + BB.esc(data.ranking_basis) + "</em></p>");
    if (data.evidence_labels) {
      var labels = Object.keys(data.evidence_labels).map(function (key) {
        return "<strong>" + BB.esc(key) + "</strong> &mdash; " + BB.esc(data.evidence_labels[key]);
      }).join(" ");
      parts.push("<p>Evidence labels: " + labels + "</p>");
    }
    methodBox.innerHTML = parts.join("");
  }

  if (searchBox) {
    searchBox.addEventListener("input", function () {
      query = searchBox.value.trim().toLowerCase();
      render();
    });
  }

  fetch(grid.getAttribute("data-json") || "/hot100-live.json")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      devices = ((data && data.devices) || []).slice().sort(byRank);
      buildCategoryPills();
      render();
      if (updatedLine && data.updated) updatedLine.textContent = "Updated " + BB.esc(data.updated);
      showMethodology(data);
    })
    .catch(function () {
      grid.innerHTML = '<p class="lede">Could not load rankings.</p>';
    });
})();
