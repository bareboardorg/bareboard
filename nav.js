/* Site navigation — a frosted-glass bar whose dropdowns are column
 * navigators.
 *
 * Each top-level word opens a floating glass card. Column zero of the
 * card is the section's own link list, read out of the page's static
 * markup (which stays in place as the no-JavaScript fallback). Picking
 * an item that has children opens a new glass column directly to its
 * right holding those children; deeper picks cascade further right.
 * Every column scrolls on its own. Items without children are links.
 *
 * The child lists come from the site's real link graph: hub pages'
 * own outbound links (devices index to device hubs, autopsy index to
 * autopsies, foundry to the four curriculum levels to their lessons).
 * Nothing here invents a page.
 *
 * Desktop: hover a bar word to open; hover inside the card to browse
 * (hovering an item picks it); click a parent item to pin its column
 * open; click a leaf — or re-click a picked parent — to follow its
 * link. Keyboard: Enter/Space on a bar word opens; inside the card,
 * Up/Down move, Right expands, Left steps back a column, Enter follows
 * the link, Escape closes. Touch/small screens: the card shows one
 * column at a time and slides between levels, with a back chevron at
 * the top of each child column.
 *
 * Pages opt in with:
 *   <script src="/nav.js" defer></script>
 */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ----- the link graph (real pages only) ----- */

  function link(label, href) {
    return { label: label, href: href };
  }

  var DEVICE_HUBS = [
    link("AirPods", "/devices/airpods/"),
    link("Apple TV", "/devices/apple-tv/"),
    link("Apple Watch", "/devices/apple-watch/"),
    link("Chromebooks", "/devices/chromebooks/"),
    link("CPAP Machines", "/devices/cpap/"),
    link("DJI Drones", "/devices/dji-drones/"),
    link("E-Bike Controllers", "/devices/ebike-controllers/"),
    link("Echo Dot (5th Gen)", "/devices/echo-dot/"),
    link("ESP32 Family", "/devices/esp32/"),
    link("EV Chargers", "/devices/ev-chargers/"),
    link("Flipper Zero", "/devices/flipper-zero/"),
    link("GoPro", "/devices/gopro/"),
    link("Hearing Aids", "/devices/hearing-aids/"),
    link("iPad", "/devices/ipad/"),
    link("iPhone", "/devices/iphone/"),
    link("Kasa HS103 Smart Plug", "/devices/kasa-hs103/"),
    link("Kindle & Kobo E-Readers", "/devices/e-readers/"),
    link("Mesh Wi-Fi", "/devices/mesh-wifi/"),
    link("Nest Mini (2nd Gen)", "/devices/nest-mini/"),
    link("Nintendo Switch Family", "/devices/nintendo-switch/"),
    link("Raspberry Pi Pico W", "/devices/pico-w/"),
    link("PlayStation Family", "/devices/playstation/"),
    link("Raspberry Pi Family", "/devices/raspberry-pi/"),
    link("Robot Vacuums", "/devices/robot-vacuums/"),
    link("Smart Locks", "/devices/smart-locks/"),
    link("Smart Thermostats", "/devices/smart-thermostats/"),
    link("Smart TVs & Streaming", "/devices/smart-tv/"),
    link("Solar Basics", "/devices/solar-basics/"),
    link("Sonoff Basic R3", "/devices/sonoff-basic-r3/"),
    link("TI-84 Plus Family", "/devices/ti-84-plus/"),
    link("Windows Laptops, Desktops & Surface", "/devices/windows-pcs/"),
    link("Wyze Cam v3", "/devices/wyze-cam-v3/"),
    link("Xbox Family", "/devices/xbox/"),
    link("Xfinity XB3 (TG1682G)", "/devices/xfinity-xb3/")
  ];

  var AUTOPSY_PAGES = [
    link("Xfinity XB3 — Full Autopsy", "/autopsy/xfinity-xb3/"),
    link("S7-300 CPU 315-2 DP", "/autopsy/s7-300-cpu-315-2dp.html")
  ];

  var CURRICULUM_LEVELS = [
    link("Level 0 — Silicon", "/level-0-silicon/"),
    link("Level 1 — Interconnect", "/level-1-interconnect/"),
    link("Level 2 — Controllers", "/level-2-controllers/"),
    link("Level 3 — Systems", "/level-3-systems/")
  ];

  /* Children keyed by the parent item's own href (hash/query stripped). */
  var CHILDREN = {
    "/devices/": DEVICE_HUBS,
    "/autopsy/": AUTOPSY_PAGES,
    "/devices/xfinity-xb3/": [
      link("Full Autopsy", "/autopsy/xfinity-xb3/")
    ],
    "/foundry.html": CURRICULUM_LEVELS,
    "/level-0-silicon/": [
      link("Fabs & Lithography Nodes", "/level-0-silicon/lithography-nodes.html"),
      link("Secure Elements & Roots of Trust", "/level-0-silicon/secure-elements.html")
    ],
    "/level-1-interconnect/": [
      link("Bus Standards & Protocols", "/level-1-interconnect/bus-standards.html")
    ],
    "/level-2-controllers/": [
      link("Firmware & Flash", "/level-2-controllers/firmware-flash.html")
    ],
    "/level-3-systems/": [
      link("Autopsy 001: Siemens S7-300", "/level-3-systems/autopsy-001-s7-300.html"),
      link("Autopsy 002: Philips IntelliVue", "/level-3-systems/autopsy-002-intellivue.html"),
      link("Autopsy 003: Allen-Bradley ControlLogix", "/level-3-systems/autopsy-003-controllogix.html")
    ],
    "/watchmen.html": [
      link("Audit Checklist", "/watchmen/audit-checklist.html")
    ]
  };

  function bareHref(href) {
    return (href || "").split("#")[0].split("?")[0];
  }

  /* Paths compared as pages: /devices/iphone/, /devices/iphone/index.html
     and /devices/iphone are the same page; / is the home page. */
  function normalPath(path) {
    var p = bareHref(path || "");
    if (p.slice(-10) === "index.html") p = p.slice(0, -10);
    if (p.length > 1 && p.slice(-1) === "/") p = p.slice(0, -1);
    return p || "/";
  }

  function isCurrent(href) {
    return normalPath(href) === normalPath(window.location.pathname);
  }

  /* A item's children: the graph's list first, then any children parsed
     out of the page's static markup, de-duplicated by href. */
  function childrenOf(item) {
    var found = [];
    var seen = {};
    var fromGraph = CHILDREN[bareHref(item.href)];
    if (fromGraph) {
      fromGraph.forEach(function (child) {
        seen[bareHref(child.href)] = true;
        found.push(child);
      });
    }
    if (item.parsedKids) {
      item.parsedKids.forEach(function (child) {
        if (!seen[bareHref(child.href)]) {
          seen[bareHref(child.href)] = true;
          found.push(child);
        }
      });
    }
    return found.length ? found : null;
  }

  /* ----- shared shell ----- */

  var BAR_SELECTOR = ".site-nav nav > ul > li.has-children";
  var OPEN_HOVER_MS = 120;  // pause before a hover opens a panel
  var BROWSE_HOVER_MS = 70; // hover intent pause inside the card
  var RESIZE_MS = 150;

  function media(query) {
    if (window.matchMedia) return window.matchMedia(query);
    return { matches: false, addEventListener: function () {}, addListener: function () {} };
  }
  var smallScreen = media("(max-width: 820px)");
  var lowMotion = media("(prefers-reduced-motion: reduce)");
  var hasFinePointer = media("(hover: hover) and (pointer: fine)").matches;

  function onSmallScreen() { return smallScreen.matches; }
  function wantsLowMotion() { return lowMotion.matches; }

  /* Dimming curtain behind an open panel: the page dims softly.
     Built here so no page markup is needed. */
  var curtain = document.createElement("div");
  curtain.className = "nav-curtain";
  curtain.setAttribute("aria-hidden", "true");
  document.body.appendChild(curtain);
  curtain.addEventListener("click", function () { closeEverything(null); });

  function triggerLink(item) { return item.querySelector(":scope > a"); }
  function cardOf(item) { return item.querySelector(":scope > .col-panel"); }
  function panelOpen(item) { return item.classList.contains("open"); }

  function somethingOpen() {
    return document.querySelector(BAR_SELECTOR + ".open") !== null;
  }

  function refreshCurtain() {
    curtain.classList.toggle("on", somethingOpen());
  }

  /* ----- panel open / close ----- */

  function closeOne(item) {
    item.classList.remove("open");
    var anchor = triggerLink(item);
    if (anchor) anchor.setAttribute("aria-expanded", "false");
    refreshCurtain();
  }

  function closeEverything(except) {
    document.querySelectorAll(BAR_SELECTOR).forEach(function (item) {
      if (item !== except) closeOne(item);
    });
    /* Search is a sibling concern; the search panel and a nav panel are
       never shown at the same time. */
    var searchPanel = document.getElementById("search-panel");
    if (searchPanel && searchPanel.classList.contains("open") && window.BareBoardSearch) {
      window.BareBoardSearch.close();
    }
    refreshCurtain();
  }

  /* Line the glass card up under its trigger word, clamped so it never
     leaves the viewport. On small screens the stylesheet gives the card
     fixed side margins instead, and its top is pinned just under the
     sticky header (the card is position:fixed there, so it escapes the
     scrolling nav row). */
  function placeCard(item) {
    var anchor = triggerLink(item);
    var panel = cardOf(item);
    if (!anchor || !panel) return;
    var header = anchor.closest(".site-nav");
    if (!header) return;
    var headerBox = header.getBoundingClientRect();
    if (onSmallScreen()) {
      panel.style.top = headerBox.bottom.toFixed(1) + "px";
    } else {
      panel.style.top = "";
    }
    var inner = panel.querySelector(".dropdown-inner");
    if (!inner) return;
    if (onSmallScreen()) {
      inner.style.marginLeft = "";
      return;
    }
    var anchorBox = anchor.getBoundingClientRect();
    var want = anchorBox.left - 10; /* card padding tucks the column under the word */
    var cardWidth = inner.offsetWidth;
    var farthest = window.innerWidth - cardWidth - 12;
    var left = Math.max(12, Math.min(want, farthest));
    inner.style.marginLeft = left.toFixed(1) + "px";
  }

  function openOne(item) {
    closeEverything(item);
    upgrade(item);
    placeCard(item);
    item.classList.add("open");
    var anchor = triggerLink(item);
    if (anchor) anchor.setAttribute("aria-expanded", "true");
    refreshCurtain();
  }

  /* ----- the column navigator ----- */

  /* Read a panel's static column (the no-JS fallback markup) into data,
     then take over rendering. Two static shapes exist: .colnav-col
     (with a .colnav-col-head) and .dropdown-col (a bare list, where an
     li.dropdown-sub is a child of the item above it). */
  function upgrade(item) {
    var panel = cardOf(item);
    if (!panel || panel._bbNav) return;
    var inner = panel.querySelector(".dropdown-inner");
    var source = panel.querySelector(".colnav-col") ||
      panel.querySelector(".dropdown-col");
    if (!inner || !source) return;

    var topItems = [];
    var heading = "";
    source.querySelectorAll(":scope > li").forEach(function (node) {
      if (node.classList.contains("colnav-col-head")) {
        heading = node.textContent.trim();
        return;
      }
      var anchor = node.querySelector("a");
      if (!anchor) return;
      var entry = {
        label: anchor.textContent.trim(),
        href: anchor.getAttribute("href") || ""
      };
      if (node.classList.contains("dropdown-sub") && topItems.length) {
        var parent = topItems[topItems.length - 1];
        parent.parsedKids = parent.parsedKids || [];
        parent.parsedKids.push(entry);
      } else {
        topItems.push(entry);
      }
    });
    var trigger = triggerLink(item);
    if (!heading && trigger) heading = trigger.textContent.trim();

    var state = {
      head: heading,
      headHref: trigger ? (trigger.getAttribute("href") || "") : "",
      items: topItems,
      path: [] /* picked item index per column depth */
    };
    panel._bbNav = state;

    /* Swap the static list for the live column strip. */
    var navigator = document.createElement("div");
    navigator.className = "colnav";
    var strip = document.createElement("div");
    strip.className = "colnav-track";
    navigator.appendChild(strip);
    state.nav = navigator;
    state.strip = strip;
    inner.textContent = "";
    inner.appendChild(navigator);
    strip.appendChild(renderColumn(state, 0, state.head, state.headHref, state.items));
    wireCard(panel, state);
  }

  /* The items shown at a depth, following the picked path down. */
  function columnItems(state, depth) {
    var items = state.items;
    for (var d = 0; d < depth; d++) {
      var picked = items[state.path[d]];
      if (!picked) return null;
      items = childrenOf(picked);
      if (!items) return null;
    }
    return items;
  }

  function renderColumn(state, depth, heading, headingHref, items) {
    var column = document.createElement("ul");
    column.className = "colnav-col";
    column.setAttribute("data-depth", String(depth));

    if (depth > 0) {
      var backRow = document.createElement("li");
      backRow.className = "colnav-back-row";
      var backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "colnav-back";
      backButton.setAttribute("data-back", String(depth));
      var parents = columnItems(state, depth - 1);
      var parent = parents ? parents[state.path[depth - 1]] : null;
      backButton.textContent = "\u2039 " + (parent ? parent.label : state.head);
      backRow.appendChild(backButton);
      column.appendChild(backRow);
    }

    var headRow = document.createElement("li");
    headRow.className = "colnav-col-head";
    if (depth > 0 && headingHref) {
      var headLink = document.createElement("a");
      headLink.className = "colnav-col-head-link";
      headLink.href = headingHref;
      headLink.textContent = heading;
      if (isCurrent(headingHref)) headLink.setAttribute("aria-current", "page");
      headRow.appendChild(headLink);
    } else {
      headRow.textContent = heading;
    }
    column.appendChild(headRow);

    items.forEach(function (entry, index) {
      var row = document.createElement("li");
      if (childrenOf(entry)) row.className = "has-kids";
      var anchor = document.createElement("a");
      anchor.href = entry.href;
      anchor.textContent = entry.label;
      anchor.setAttribute("data-depth", String(depth));
      anchor.setAttribute("data-idx", String(index));
      if (isCurrent(entry.href)) anchor.setAttribute("aria-current", "page");
      row.appendChild(anchor);
      column.appendChild(row);
    });
    return column;
  }

  function paintSelection(state, depth) {
    var column = state.strip.children[depth];
    if (!column) return;
    var picked = state.path[depth];
    column.querySelectorAll(":scope > li").forEach(function (row) {
      var anchor = row.querySelector("a[data-idx]");
      if (!anchor) return;
      row.classList.toggle("selected", Number(anchor.getAttribute("data-idx")) === picked);
    });
  }

  /* Pick an item: its children appear in a fresh column to the right and
     anything deeper is thrown away. */
  function pick(state, depth, index) {
    var changed = state.path[depth] !== index || state.path.length !== depth + 1;
    state.path.length = depth;
    state.path[depth] = index;
    var total = state.strip.children.length;
    for (var d = 0; d < total; d++) paintSelection(state, d);
    while (state.strip.children.length > depth + 1) {
      state.strip.removeChild(state.strip.lastElementChild);
    }
    var items = columnItems(state, depth);
    var entry = items ? items[index] : null;
    var kids = entry ? childrenOf(entry) : null;
    if (kids) {
      state.strip.appendChild(renderColumn(state, depth + 1, entry.label, entry.href, kids));
    }
    settleAfterBrowse(state);
    return changed;
  }

  function stepBack(state) {
    if (!state.path.length) return;
    state.path.pop();
    while (state.strip.children.length > state.path.length + 1) {
      state.strip.removeChild(state.strip.lastElementChild);
    }
    for (var d = 0; d < state.strip.children.length; d++) paintSelection(state, d);
    settleAfterBrowse(state);
  }

  /* After any browse change: bring the newest column into view — slide
     to it on small screens, scroll to it on desktop. The card grows with
     each new column, so re-clamp it inside the viewport too. */
  function settleAfterBrowse(state) {
    var owner = state.nav.closest("li.has-children");
    if (owner && !onSmallScreen()) placeCard(owner);
    if (onSmallScreen()) {
      var depth = state.strip.children.length - 1;
      state.strip.style.transform = "translateX(" + (-100 * depth) + "%)";
    } else {
      state.strip.style.transform = "";
      var frame = state.nav;
      var overflow = frame.scrollWidth - frame.clientWidth;
      if (overflow > 0) {
        if (wantsLowMotion()) frame.scrollLeft = overflow;
        else frame.scrollTo({ left: overflow, behavior: "smooth" });
      }
    }
  }

  function focusCell(state, depth, index) {
    var column = state.strip.children[depth];
    if (!column) return;
    var anchor = column.querySelector('a[data-idx="' + index + '"]');
    if (anchor) anchor.focus();
  }

  function wireCard(panel, state) {
    var hoverTimer = null;

    function locate(event) {
      var anchor = event.target.closest ? event.target.closest("a[data-idx]") : null;
      if (!anchor || !panel.contains(anchor)) return null;
      return {
        anchor: anchor,
        depth: Number(anchor.getAttribute("data-depth")),
        index: Number(anchor.getAttribute("data-idx"))
      };
    }

    /* Hover browsing (fine pointers only): hovering an item picks it and
       its children cascade in. */
    if (hasFinePointer) {
      panel.addEventListener("mouseover", function (event) {
        var hit = locate(event);
        if (!hit) return;
        var row = hit.anchor.parentNode;
        if (hit.anchor.closest("li") === row && row.classList.contains("selected")) return;
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
          if (state.path[hit.depth] !== hit.index) pick(state, hit.depth, hit.index);
        }, BROWSE_HOVER_MS);
      });
      panel.addEventListener("mouseleave", function () {
        if (hoverTimer) clearTimeout(hoverTimer);
      });
    }

    panel.addEventListener("click", function (event) {
      var back = event.target.closest ? event.target.closest("[data-back]") : null;
      if (back && panel.contains(back)) {
        event.preventDefault();
        stepBack(state);
        return;
      }
      var hit = locate(event);
      if (!hit) return;
      var items = columnItems(state, hit.depth);
      var entry = items ? items[hit.index] : null;
      /* Clicks synthesized by the keyboard (detail 0) always follow the
         link, as do clicks on items that no longer exist. */
      if (event.detail === 0 || !entry) return;
      if (childrenOf(entry)) {
        if (state.path[hit.depth] === hit.index &&
          state.strip.children.length > hit.depth + 1) {
          return; /* already expanded: follow the link natively */
        }
        event.preventDefault();
        pick(state, hit.depth, hit.index);
      }
      /* Leaves follow their link natively. */
    });

    panel.addEventListener("keydown", function (event) {
      var hit = locate(event);
      if (!hit) return;
      var depth = hit.depth;
      var index = hit.index;
      var items = columnItems(state, depth);
      if (!items) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        var next = index + (event.key === "ArrowDown" ? 1 : -1);
        if (next < 0 || next >= items.length) return;
        pick(state, depth, next);
        focusCell(state, depth, next);
      } else if (event.key === "ArrowRight") {
        var entry = items[index];
        if (entry && childrenOf(entry)) {
          event.preventDefault();
          pick(state, depth, index);
          focusCell(state, depth + 1, 0);
        }
      } else if (event.key === "ArrowLeft") {
        if (depth > 0) {
          event.preventDefault();
          var parentIndex = state.path[depth - 1];
          pick(state, depth - 1, parentIndex);
          focusCell(state, depth - 1, parentIndex);
        }
      } else if (event.key === " ") {
        /* Space works like a click for links. */
        event.preventDefault();
        var current = items[index];
        if (current && childrenOf(current) && state.path[depth] !== index) {
          pick(state, depth, index);
        } else {
          hit.anchor.click();
        }
      }
    });
  }

  /* ----- bar wiring ----- */

  document.querySelectorAll(BAR_SELECTOR).forEach(function (item) {
    var anchor = triggerLink(item);
    var panel = cardOf(item);
    if (!anchor || !panel) return;
    var timer = null;

    function clearTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function scheduleClose() {
      clearTimer();
      timer = setTimeout(function () { closeOne(item); }, OPEN_HOVER_MS);
    }

    if (hasFinePointer) {
      item.addEventListener("mouseenter", function () {
        clearTimer();
        if (somethingOpen()) {
          /* A card is already showing: switch to this word at once. */
          openOne(item);
        } else {
          timer = setTimeout(function () { openOne(item); }, OPEN_HOVER_MS);
        }
      });
      /* A grace period lets the pointer travel down into the card. */
      item.addEventListener("mouseleave", scheduleClose);
      panel.addEventListener("mouseenter", clearTimer);
      panel.addEventListener("mouseleave", scheduleClose);
    }

    /* Click / tap toggles: the first tap opens, the second follows the
       link. */
    anchor.addEventListener("click", function (event) {
      if (event.detail === 0) return; /* keyboard activation: see keydown */
      if (panelOpen(item)) return; /* second tap/click: follow natively */
      event.preventDefault();
      openOne(item);
    });

    anchor.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        if (!panelOpen(item)) {
          event.preventDefault();
          openOne(item);
          var card = cardOf(item);
          if (card && card._bbNav) focusCell(card._bbNav, 0, 0);
        }
        /* Already open: Enter/Space follow the link natively. */
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!panelOpen(item)) openOne(item);
        var openCard = cardOf(item);
        if (openCard && openCard._bbNav) focusCell(openCard._bbNav, 0, 0);
      } else if (event.key === "Escape" || event.key === "Esc") {
        event.preventDefault();
        closeOne(item);
        anchor.focus();
      }
    });
  });

  /* Keep the card lined up if the viewport changes while one is open. */
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.querySelectorAll(BAR_SELECTOR + ".open").forEach(function (item) {
        placeCard(item);
        var card = cardOf(item);
        if (card && card._bbNav) settleAfterBrowse(card._bbNav);
      });
    }, RESIZE_MS);
  });

  /* On small screens the card is fixed under the sticky header, so
     re-pin it while scrolling. */
  var scrollQueued = false;
  window.addEventListener("scroll", function () {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      if (onSmallScreen()) {
        document.querySelectorAll(BAR_SELECTOR + ".open").forEach(placeCard);
      }
    });
  }, { passive: true });

  /* Escape anywhere closes everything. */
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.key === "Esc") closeEverything(null);
  });

  /* Clicking outside the nav closes everything. */
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".site-nav")) closeEverything(null);
  });

  /* Mark the current page's link in the static nav markup. Screen
     readers announce it; the stylesheet gives it the same quiet
     highlight as a selected item. */
  document.querySelectorAll(".site-nav a").forEach(function (anchor) {
    if (isCurrent(anchor.getAttribute("href"))) {
      anchor.setAttribute("aria-current", "page");
    }
  });
})();
