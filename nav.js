/* BareBoard navigation — Apple-style glass bar with a Finder column
 * browser (Miller columns) in every dropdown.
 *
 * Each top-level word opens a floating glass card. Inside the card,
 * column zero is the section's own link list (parsed from the page's
 * static markup, which stays as the no-JS fallback). Selecting an item
 * that has children opens a new glass column immediately to its right
 * with those children; deeper selections cascade further right. Every
 * column scrolls independently. Leaves are plain links.
 *
 * The child lists come from the site's real link graph: the hub pages'
 * own outbound links (devices index -> device hubs, autopsy index ->
 * autopsies, foundry -> the four curriculum levels -> their lessons).
 * Nothing here invents a page.
 *
 * Desktop: hover a bar word to open; hover inside the card to browse
 * columns (Finder-style hover selection); click a parent item to pin
 * its column open; click a leaf — or re-click a selected parent — to
 * follow its link. Keyboard: Enter/Space on a bar word opens; inside
 * the card, Up/Down move, Right expands, Left goes back a column,
 * Enter follows the link, Escape closes. Touch/small screens: the
 * card shows one column at a time and slides between levels, with a
 * back chevron at the top of each child column.
 *
 * To enable, add before </body> on each page:
 *   <script src="/nav.js" defer></script>
 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------------- the tree (real pages only) ---------------- */

  function L(label, href) { return { label: label, href: href }; }

  var DEVICES = [
    L('Echo Dot (5th Gen)', '/devices/echo-dot/'),
    L('ESP32 Family', '/devices/esp32/'),
    L('Flipper Zero', '/devices/flipper-zero/'),
    L('iPhone', '/devices/iphone/'),
    L('Kasa HS103 Smart Plug', '/devices/kasa-hs103/'),
    L('Kindle & Kobo E-Readers', '/devices/e-readers/'),
    L('Nest Mini (2nd Gen)', '/devices/nest-mini/'),
    L('Nintendo Switch Family', '/devices/nintendo-switch/'),
    L('Raspberry Pi Pico W', '/devices/pico-w/'),
    L('PlayStation Family', '/devices/playstation/'),
    L('Raspberry Pi Family', '/devices/raspberry-pi/'),
    L('Smart TVs & Streaming', '/devices/smart-tv/'),
    L('Sonoff Basic R3', '/devices/sonoff-basic-r3/'),
    L('TI-84 Plus Family', '/devices/ti-84-plus/'),
    L('Windows Laptops, Desktops & Surface', '/devices/windows-pcs/'),
    L('Wyze Cam v3', '/devices/wyze-cam-v3/'),
    L('Xbox Family', '/devices/xbox/'),
    L('Xfinity XB3 (TG1682G)', '/devices/xfinity-xb3/')
  ];

  var AUTOPSIES = [
    L('Xfinity XB3 — Full Autopsy', '/autopsy/xfinity-xb3/'),
    L('S7-300 CPU 315-2 DP', '/autopsy/s7-300-cpu-315-2dp.html')
  ];

  var LEVELS = [
    L('Level 0 — Silicon', '/level-0-silicon/'),
    L('Level 1 — Interconnect', '/level-1-interconnect/'),
    L('Level 2 — Controllers', '/level-2-controllers/'),
    L('Level 3 — Systems', '/level-3-systems/')
  ];

  /* Children keyed by the item's own href (hash/query stripped). */
  var KIDS = {
    '/devices/': DEVICES,
    '/autopsy/': AUTOPSIES,
    '/devices/xfinity-xb3/': [
      L('Full Autopsy', '/autopsy/xfinity-xb3/')
    ],
    '/foundry.html': LEVELS,
    '/level-0-silicon/': [
      L('Fabs & Lithography Nodes', '/level-0-silicon/lithography-nodes.html'),
      L('Secure Elements & Roots of Trust', '/level-0-silicon/secure-elements.html')
    ],
    '/level-1-interconnect/': [
      L('Bus Standards & Protocols', '/level-1-interconnect/bus-standards.html')
    ],
    '/level-2-controllers/': [
      L('Firmware & Flash', '/level-2-controllers/firmware-flash.html')
    ],
    '/level-3-systems/': [
      L('Autopsy 001: Siemens S7-300', '/level-3-systems/autopsy-001-s7-300.html'),
      L('Autopsy 002: Philips IntelliVue', '/level-3-systems/autopsy-002-intellivue.html'),
      L('Autopsy 003: Allen-Bradley ControlLogix', '/level-3-systems/autopsy-003-controllogix.html')
    ],
    '/watchmen.html': [
      L('Audit Checklist', '/watchmen/audit-checklist.html')
    ]
  };

  function norm(href) {
    return (href || '').split('#')[0].split('?')[0];
  }

  function kidsOf(item) {
    var out = [];
    var seen = {};
    var map = KIDS[norm(item.href)];
    if (map) map.forEach(function (k) { seen[norm(k.href)] = 1; out.push(k); });
    if (item.parsedKids) item.parsedKids.forEach(function (k) {
      if (!seen[norm(k.href)]) { seen[norm(k.href)] = 1; out.push(k); }
    });
    return out.length ? out : null;
  }

  /* ---------------- shared shell ---------------- */

  var BAR_ITEM = '.site-nav nav > ul > li.has-children';
  var HOVER_DELAY = 120;   // ms before a hover opens a panel
  var BROWSE_DELAY = 70;   // ms hover intent inside the card
  function mq(query) {
    if (window.matchMedia) return window.matchMedia(query);
    return { matches: false, addEventListener: function () {}, addListener: function () {} };
  }
  var mqMobile = mq('(max-width: 820px)');
  var mqReduce = mq('(prefers-reduced-motion: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)').matches;

  function isMobile() { return mqMobile.matches; }
  function reduceMotion() { return mqReduce.matches; }

  /* Apple-style curtain behind an open panel: page dims softly.
   * Injected here so no page markup is needed. */
  var curtain = document.createElement('div');
  curtain.className = 'nav-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(curtain);
  curtain.addEventListener('click', function () { closeAll(null); });

  function syncCurtain() {
    curtain.classList.toggle('on', anyOpen());
  }

  function barLink(li) { return li.querySelector(':scope > a'); }
  function panelOf(li) { return li.querySelector(':scope > .col-panel'); }
  function isOpen(li) { return li.classList.contains('open'); }

  function anyOpen() {
    return document.querySelector(BAR_ITEM + '.open') !== null;
  }

  /* ---------------- panel open / close ---------------- */

  function closePanel(li) {
    li.classList.remove('open');
    var a = barLink(li);
    if (a) a.setAttribute('aria-expanded', 'false');
    syncCurtain();
  }

  function closeAll(except) {
    document.querySelectorAll(BAR_ITEM).forEach(function (li) {
      if (li !== except) closePanel(li);
    });
    // Search panel is a sibling concern; never show both at once.
    var sp = document.getElementById('search-panel');
    if (sp && sp.classList.contains('open') && window.BareBoardSearch) {
      window.BareBoardSearch.close();
    }
    syncCurtain();
  }

  /* Position the glass card: its left edge lines up under the trigger
   * word, clamped so the card never leaves the viewport. On small
   * screens CSS gives the card fixed side margins instead. */
  function alignPanel(li) {
    var link = barLink(li);
    var panel = panelOf(li);
    if (!link || !panel) return;
    var header = link.closest('.site-nav');
    if (!header) return;
    var hr = header.getBoundingClientRect();
    // Mobile: the panel is position:fixed in CSS (escapes the scrolling
    // nav row), so pin its top just below the sticky header.
    if (isMobile()) {
      panel.style.top = hr.bottom.toFixed(1) + 'px';
    } else {
      panel.style.top = '';
    }
    var inner = panel.querySelector('.dropdown-inner');
    if (!inner) return;
    if (isMobile()) { inner.style.marginLeft = ''; return; }
    var lr = link.getBoundingClientRect();
    var want = lr.left - 10; // card padding tucks the column under the word
    var cardW = inner.offsetWidth;
    var maxLeft = window.innerWidth - cardW - 12;
    var left = Math.max(12, Math.min(want, maxLeft));
    inner.style.marginLeft = left.toFixed(1) + 'px';
  }

  function openPanel(li) {
    closeAll(li);
    enhance(li);
    alignPanel(li);
    li.classList.add('open');
    var a = barLink(li);
    if (a) a.setAttribute('aria-expanded', 'true');
    syncCurtain();
  }

  /* ---------------- Finder column browser ---------------- */

  /* Capture a panel's static column (the no-JS fallback markup) as
   * data, then take over rendering. Two static shapes exist:
   * .finder-col (with a .finder-col-head) and .dropdown-col (bare
   * list, where li.dropdown-sub marks a child of the item above it). */
  function enhance(li) {
    var panel = panelOf(li);
    if (!panel || panel._bbState) return;
    var inner = panel.querySelector('.dropdown-inner');
    var src = panel.querySelector('.finder-col') ||
              panel.querySelector('.dropdown-col');
    if (!inner || !src) return;

    var items = [];
    var headText = '';
    src.querySelectorAll(':scope > li').forEach(function (n) {
      if (n.classList.contains('finder-col-head')) {
        headText = n.textContent.trim();
        return;
      }
      var a = n.querySelector('a');
      if (!a) return;
      var item = { label: a.textContent.trim(), href: a.getAttribute('href') || '' };
      if (n.classList.contains('dropdown-sub') && items.length) {
        var parent = items[items.length - 1];
        parent.parsedKids = parent.parsedKids || [];
        parent.parsedKids.push(item);
      } else {
        items.push(item);
      }
    });
    var trigger = barLink(li);
    if (!headText && trigger) headText = trigger.textContent.trim();

    var st = {
      head: headText,
      headHref: trigger ? (trigger.getAttribute('href') || '') : '',
      items: items,
      path: [] // selected item index per column depth
    };
    panel._bbState = st;

    // Swap the static list for the live column strip.
    var finder = document.createElement('div');
    finder.className = 'finder';
    var track = document.createElement('div');
    track.className = 'finder-track';
    finder.appendChild(track);
    st.finder = finder;
    st.track = track;
    inner.textContent = '';
    inner.appendChild(finder);
    track.appendChild(buildColumn(st, 0, st.head, st.headHref, st.items));
    wirePanel(panel, st);
  }

  /* Items rendered at a given depth, walking the selection path. */
  function itemsAt(st, depth) {
    var items = st.items;
    for (var d = 0; d < depth; d++) {
      var sel = items[st.path[d]];
      if (!sel) return null;
      items = kidsOf(sel);
      if (!items) return null;
    }
    return items;
  }

  function buildColumn(st, depth, head, headHref, items) {
    var col = document.createElement('ul');
    col.className = 'finder-col';
    col.setAttribute('data-depth', String(depth));

    if (depth > 0) {
      var backRow = document.createElement('li');
      backRow.className = 'finder-back-row';
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'finder-back';
      back.setAttribute('data-back', String(depth));
      var parentItems = itemsAt(st, depth - 1);
      var parentSel = parentItems ? parentItems[st.path[depth - 1]] : null;
      back.textContent = '\u2039 ' + (parentSel ? parentSel.label : st.head);
      backRow.appendChild(back);
      col.appendChild(backRow);
    }

    var headLi = document.createElement('li');
    headLi.className = 'finder-col-head';
    if (depth > 0 && headHref) {
      var ha = document.createElement('a');
      ha.className = 'finder-col-head-link';
      ha.href = headHref;
      ha.textContent = head;
      headLi.appendChild(ha);
    } else {
      headLi.textContent = head;
    }
    col.appendChild(headLi);

    items.forEach(function (item, idx) {
      var li = document.createElement('li');
      if (kidsOf(item)) li.className = 'has-kids';
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      a.setAttribute('data-depth', String(depth));
      a.setAttribute('data-idx', String(idx));
      li.appendChild(a);
      col.appendChild(li);
    });
    return col;
  }

  function markSelected(st, depth) {
    var col = st.track.children[depth];
    if (!col) return;
    var idx = st.path[depth];
    col.querySelectorAll(':scope > li').forEach(function (li) {
      var a = li.querySelector('a[data-idx]');
      if (!a) return;
      li.classList.toggle('selected', Number(a.getAttribute('data-idx')) === idx);
    });
  }

  /* The Miller move: select an item; its children appear in a new
   * column to the right; anything deeper is discarded. */
  function select(st, depth, idx) {
    var changed = st.path[depth] !== idx || st.path.length !== depth + 1;
    st.path.length = depth;
    st.path[depth] = idx;
    var colCount = st.track.children.length;
    for (var d = 0; d < colCount; d++) markSelected(st, d);
    while (st.track.children.length > depth + 1) {
      st.track.removeChild(st.track.lastElementChild);
    }
    var items = itemsAt(st, depth);
    var item = items ? items[idx] : null;
    var kids = item ? kidsOf(item) : null;
    if (kids) {
      st.track.appendChild(buildColumn(st, depth + 1, item.label, item.href, kids));
    }
    afterBrowse(st);
    return changed;
  }

  function popLevel(st) {
    if (!st.path.length) return;
    st.path.pop();
    while (st.track.children.length > st.path.length + 1) {
      st.track.removeChild(st.track.lastElementChild);
    }
    for (var d = 0; d < st.track.children.length; d++) markSelected(st, d);
    afterBrowse(st);
  }

  /* After any browse change: reveal the newest column on desktop,
   * slide to it on small screens. */
  function afterBrowse(st) {
    // The card grows with each new column; keep it inside the viewport.
    var owner = st.finder.closest('li.has-children');
    if (owner && !isMobile()) alignPanel(owner);
    if (isMobile()) {
      var depth = st.track.children.length - 1;
      st.track.style.transform = 'translateX(' + (-100 * depth) + '%)';
    } else {
      st.track.style.transform = '';
      var f = st.finder;
      var target = f.scrollWidth - f.clientWidth;
      if (target > 0) {
        if (reduceMotion()) f.scrollLeft = target;
        else f.scrollTo({ left: target, behavior: 'smooth' });
      }
    }
  }

  function focusItem(st, depth, idx) {
    var col = st.track.children[depth];
    if (!col) return;
    var a = col.querySelector('a[data-idx="' + idx + '"]');
    if (a) a.focus();
  }

  function wirePanel(panel, st) {
    var browseTimer = null;

    function itemFromEvent(e) {
      var a = e.target.closest ? e.target.closest('a[data-idx]') : null;
      if (!a || !panel.contains(a)) return null;
      return { a: a, depth: Number(a.getAttribute('data-depth')), idx: Number(a.getAttribute('data-idx')) };
    }

    // Hover browsing (fine pointers): hovering an item selects it,
    // Finder-style, and its children cascade in.
    if (finePointer) {
      panel.addEventListener('mouseover', function (e) {
        var hit = itemFromEvent(e);
        if (!hit) return;
        if (hit.a.closest('li') === hit.a.parentNode &&
            hit.a.parentNode.classList.contains('selected')) return;
        if (browseTimer) clearTimeout(browseTimer);
        browseTimer = setTimeout(function () {
          if (st.path[hit.depth] !== hit.idx) select(st, hit.depth, hit.idx);
        }, BROWSE_DELAY);
      });
      panel.addEventListener('mouseleave', function () {
        if (browseTimer) clearTimeout(browseTimer);
      });
    }

    panel.addEventListener('click', function (e) {
      var back = e.target.closest ? e.target.closest('[data-back]') : null;
      if (back && panel.contains(back)) {
        e.preventDefault();
        popLevel(st);
        return;
      }
      var hit = itemFromEvent(e);
      if (!hit) return;
      var items = itemsAt(st, hit.depth);
      var item = items ? items[hit.idx] : null;
      // Keyboard-generated clicks (detail 0) always follow the link.
      if (e.detail === 0 || !item) return;
      if (kidsOf(item)) {
        if (st.path[hit.depth] === hit.idx &&
            st.track.children.length > hit.depth + 1) {
          return; // already expanded: follow the link natively
        }
        e.preventDefault();
        select(st, hit.depth, hit.idx);
      }
      // Leaves follow their link natively.
    });

    panel.addEventListener('keydown', function (e) {
      var hit = itemFromEvent(e);
      if (!hit) return;
      var depth = hit.depth, idx = hit.idx;
      var items = itemsAt(st, depth);
      if (!items) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var n = idx + (e.key === 'ArrowDown' ? 1 : -1);
        if (n < 0 || n >= items.length) return;
        select(st, depth, n);
        focusItem(st, depth, n);
      } else if (e.key === 'ArrowRight') {
        var item = items[idx];
        if (item && kidsOf(item)) {
          e.preventDefault();
          select(st, depth, idx);
          focusItem(st, depth + 1, 0);
        }
      } else if (e.key === 'ArrowLeft') {
        if (depth > 0) {
          e.preventDefault();
          var parentIdx = st.path[depth - 1];
          select(st, depth - 1, parentIdx);
          focusItem(st, depth - 1, parentIdx);
        }
      } else if (e.key === ' ') {
        // Space activates like a click for links.
        e.preventDefault();
        var it = items[idx];
        if (it && kidsOf(it) && st.path[depth] !== idx) select(st, depth, idx);
        else hit.a.click();
      }
    });
  }

  /* ---------------- bar wiring ---------------- */

  document.querySelectorAll(BAR_ITEM).forEach(function (li) {
    var link = barLink(li);
    var panel = panelOf(li);
    if (!link || !panel) return;
    var hoverTimer = null;

    function cancelHover() {
      if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    }

    if (finePointer) {
      li.addEventListener('mouseenter', function () {
        cancelHover();
        if (anyOpen()) {
          // A panel is already showing: switch to this word at once.
          openPanel(li);
        } else {
          hoverTimer = setTimeout(function () { openPanel(li); }, HOVER_DELAY);
        }
      });
      li.addEventListener('mouseleave', function () {
        cancelHover();
        // Grace period so the pointer can travel down into the card.
        hoverTimer = setTimeout(function () { closePanel(li); }, HOVER_DELAY);
      });
      panel.addEventListener('mouseenter', cancelHover);
      panel.addEventListener('mouseleave', function () {
        cancelHover();
        hoverTimer = setTimeout(function () { closePanel(li); }, HOVER_DELAY);
      });
    }

    // Click / tap: toggle. First tap opens, second follows the link.
    link.addEventListener('click', function (e) {
      if (e.detail === 0) return; // keyboard activation: handled in keydown
      if (isOpen(li)) return; // second tap/click: follow the link natively
      e.preventDefault();
      openPanel(li);
    });

    link.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!isOpen(li)) {
          e.preventDefault();
          openPanel(li);
          var p = panelOf(li);
          if (p && p._bbState) focusItem(p._bbState, 0, 0);
        }
        // Already open: Enter/Space follow the link natively.
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen(li)) openPanel(li);
        var pp = panelOf(li);
        if (pp && pp._bbState) focusItem(pp._bbState, 0, 0);
      } else if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        closePanel(li);
        link.focus();
      }
    });
  });

  // Keep alignment correct if the viewport changes while a panel is open.
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.querySelectorAll(BAR_ITEM + '.open').forEach(function (li) {
        alignPanel(li);
        var p = panelOf(li);
        if (p && p._bbState) afterBrowse(p._bbState);
      });
    }, 150);
  });
  // On mobile the panel is fixed under the sticky header; re-pin on scroll.
  var scrollTick = false;
  window.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () {
      scrollTick = false;
      if (isMobile()) {
        document.querySelectorAll(BAR_ITEM + '.open').forEach(alignPanel);
      }
    });
  }, { passive: true });

  // Escape anywhere closes everything.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') closeAll(null);
  });

  // Clicking outside the nav closes everything.
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.site-nav')) closeAll(null);
  });
})();
