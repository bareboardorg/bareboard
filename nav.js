/* BareBoard Apple-style dropdown navigation.
 *
 * Slim top bar; each item with children opens a full-width frosted panel
 * beneath the bar. The panel's content column aligns under its own trigger
 * word (per-item alignment, measured live). The column interior is a clean
 * single Finder-style link column.
 *
 * Desktop: hovering a menu word opens its panel; moving to a new word
 * smoothly switches the open panel's content; moving away from the nav
 * closes it. Touch: tap toggles. Keyboard: Enter/Space toggles, Escape
 * closes, arrows move within a panel.
 * Without JS, panels open on hover/focus (pure CSS, see style.css).
 * To enable, add before </body> on each page:
 *   <script src="/nav.js" defer></script>
 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var BAR_ITEM = '.site-nav nav > ul > li.has-children';
  var HOVER_DELAY = 120; // ms before a hover opens a panel (avoids flicker)

  /* Apple-style curtain behind an open panel: page blurs and dims.
   * Injected here so no page markup is needed. */
  var curtain = document.createElement('div');
  curtain.className = 'nav-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(curtain);
  curtain.addEventListener('click', function () { closeAll(null); });

  function syncCurtain() {
    curtain.classList.toggle('on', anyOpen());
  }

  function barLink(li) {
    return li.querySelector(':scope > a');
  }

  function panelOf(li) {
    return li.querySelector(':scope > .col-panel');
  }

  function isOpen(li) {
    return li.classList.contains('open');
  }

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

  /* Per-trigger alignment: the dropdown column's text lines up under the
   * trigger word. Measured live so it survives font/layout differences. */
  function alignPanel(li) {
    var link = barLink(li);
    var panel = panelOf(li);
    if (!link || !panel) return;
    var header = link.closest('.site-nav');
    if (!header) return;
    var hr = header.getBoundingClientRect();
    var lr = link.getBoundingClientRect();
    // Mobile: the panel is position:fixed (escapes the scrolling nav row),
    // so pin its top just below the sticky header.
    if (window.innerWidth <= 560) {
      panel.style.top = hr.bottom.toFixed(1) + 'px';
    } else {
      panel.style.top = '';
    }
    var inner = panel.querySelector('.dropdown-inner');
    if (!inner) return;
    // Text-to-text alignment: the column's link text starts at
    // inner-padding + the column link's own left padding, so add the
    // trigger link's left padding to the measured offset.
    var linkPad = parseFloat(window.getComputedStyle(link).paddingLeft) || 0;
    var offset = Math.max(0, lr.left - hr.left) + linkPad;
    inner.style.paddingLeft = offset.toFixed(1) + 'px';
  }

  function openPanel(li) {
    closeAll(li);
    alignPanel(li);
    li.classList.add('open');
    var a = barLink(li);
    if (a) a.setAttribute('aria-expanded', 'true');
    syncCurtain();
  }

  function anyOpen() {
    return document.querySelector(BAR_ITEM + '.open') !== null;
  }

  // True on touch-primary devices; hover intent only applies to fine pointers.
  var finePointer = window.matchMedia
    ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
    : false;

  document.querySelectorAll(BAR_ITEM).forEach(function (li) {
    var link = barLink(li);
    var panel = panelOf(li);
    if (!link || !panel) return;
    var hoverTimer = null;

    function cancelHover() {
      if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    }

    // --- Desktop hover: open on hover; switching words swaps content ---
    if (finePointer) {
      li.addEventListener('mouseenter', function () {
        cancelHover();
        if (anyOpen()) {
          // A panel is already showing: switch to this word's links at once.
          openPanel(li);
        } else {
          hoverTimer = setTimeout(function () { openPanel(li); }, HOVER_DELAY);
        }
      });
      li.addEventListener('mouseleave', function () {
        cancelHover();
        // Grace period so the pointer can travel down into the panel.
        hoverTimer = setTimeout(function () { closePanel(li); }, HOVER_DELAY);
      });
      panel.addEventListener('mouseenter', cancelHover);
      panel.addEventListener('mouseleave', function () {
        cancelHover();
        hoverTimer = setTimeout(function () { closePanel(li); }, HOVER_DELAY);
      });
    }

    // --- Click / tap: toggle. First tap opens, second follows the link. ---
    link.addEventListener('click', function (e) {
      if (e.detail === 0) return; // keyboard activation: handled in keydown
      if (isOpen(li)) return; // second tap/click: follow the link natively
      e.preventDefault();
      openPanel(li);
    });

    // --- Keyboard ---
    link.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!isOpen(li)) {
          e.preventDefault();
          openPanel(li);
          var first = panel.querySelector('a');
          if (first) first.focus();
        }
        // Already open: Enter/Space follow the link natively.
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen(li)) openPanel(li);
        var f = panel.querySelector('a');
        if (f) f.focus();
      } else if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        closePanel(li);
        link.focus();
      }
    });

    // ArrowUp/ArrowDown move between links inside an open panel.
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var links = Array.prototype.slice.call(panel.querySelectorAll('a'));
      var i = links.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      var n = i + (e.key === 'ArrowDown' ? 1 : -1);
      if (n >= 0 && n < links.length) links[n].focus();
      else if (n < 0) link.focus();
    });
  });

  // Keep alignment correct if the viewport changes while a panel is open.
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.querySelectorAll(BAR_ITEM + '.open').forEach(alignPanel);
    }, 150);
  });
  // On mobile the panel is fixed under the sticky header; re-pin on scroll.
  var scrollTick = false;
  window.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () {
      scrollTick = false;
      if (window.innerWidth <= 560) {
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
