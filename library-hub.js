/* Library Hub — one searchable index over every collected document.
   Data: /data/library-index.json (built by tools/build-library-index.mjs).
   Search + category pills + platform select over the full index.
   No fetch leaves the origin; CSP connect-src 'self' covers it. */
(function () {
  'use strict';

  var searchInput = document.getElementById('hub-search');
  var platformSel = document.getElementById('hub-platform');
  var catFilter = document.getElementById('hub-cat-filter');
  var countEl = document.getElementById('hub-count');
  var tbody = document.getElementById('hub-rows');
  var noResults = document.getElementById('hub-no-results');
  if (!searchInput || !platformSel || !catFilter || !tbody) return;

  var CATEGORY_LABELS = [
    ['all', 'All'],
    ['manual', 'Manuals'],
    ['schematic', 'Schematics'],
    ['documentation', 'Documentation'],
    ['datasheet', 'Datasheets'],
    ['lawsuit', 'Lawsuits'],
    ['fda', 'FDA'],
    ['fcc', 'FCC'],
    ['other', 'Other']
  ];
  var LABEL = {};
  CATEGORY_LABELS.forEach(function (pair) { LABEL[pair[0]] = pair[1]; });

  var state = { q: '', cat: 'all', platform: 'all' };
  var docs = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtBytes(n) {
    if (n == null) return '\u2014';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function matches(d) {
    if (state.cat !== 'all' && d.category !== state.cat) return false;
    if (state.platform !== 'all' && d.platform !== state.platform) return false;
    if (state.q) {
      var hay = [d.title, d.maker, d.model, d.platform,
        LABEL[d.category] || d.category, d.doc_type]
        .join(' ').toLowerCase().replace(/[-_]+/g, ' ');
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  }

  function render() {
    var shown = docs.filter(matches);
    var html = '';
    shown.forEach(function (d) {
      var href = d.url || d.source_url || '';
      var ext = !d.url;
      html += '<tr><td><a href="' + esc(href) + '"' +
        (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
        esc(d.title) + (ext ? ' \u2197' : '') + '</a>' +
        (d.model ? '<br><span class="small">' + esc(d.model) + '</span>' : '') +
        '</td><td>' + esc(d.maker || '\u2014') +
        '</td><td>' + esc(d.platform || '\u2014') +
        '</td><td>' + esc(LABEL[d.category] || d.category) +
        '</td><td>' + esc(d.doc_type || '\u2014') +
        '</td><td>' + (ext ? 'External' : fmtBytes(d.bytes)) +
        '</td></tr>';
    });
    tbody.innerHTML = html;
    if (countEl) {
      countEl.textContent = 'Showing ' + shown.length + ' of ' +
        docs.length + ' documents';
    }
    if (noResults) noResults.hidden = shown.length !== 0;
  }

  function buildFilters() {
    var counts = {};
    var platforms = {};
    docs.forEach(function (d) {
      counts[d.category] = (counts[d.category] || 0) + 1;
      if (d.platform) platforms[d.platform] = true;
    });
    catFilter.innerHTML = '';
    CATEGORY_LABELS.forEach(function (pair) {
      var key = pair[0];
      var n = key === 'all' ? docs.length : (counts[key] || 0);
      if (key !== 'all' && !n) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.cat = key;
      btn.className = 'pill' + (state.cat === key ? ' pill--active' : '');
      btn.textContent = pair[1] + ' (' + n + ')';
      btn.setAttribute('aria-pressed', state.cat === key ? 'true' : 'false');
      catFilter.appendChild(btn);
    });
    var names = Object.keys(platforms).sort();
    platformSel.innerHTML = '<option value="all">All platforms</option>';
    names.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      platformSel.appendChild(opt);
    });
  }

  catFilter.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('button[data-cat]') : null;
    if (!btn) return;
    state.cat = btn.dataset.cat;
    Array.prototype.forEach.call(catFilter.querySelectorAll('button'), function (b) {
      var on = b.dataset.cat === state.cat;
      b.className = 'pill' + (on ? ' pill--active' : '');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    render();
  });
  searchInput.addEventListener('input', function () {
    state.q = searchInput.value.trim().toLowerCase().replace(/[-_]+/g, ' ');
    render();
  });
  platformSel.addEventListener('change', function () {
    state.platform = platformSel.value;
    render();
  });

  if (countEl) countEl.textContent = 'Loading the index\u2026';
  fetch('/data/library-index.json')
    .then(function (r) {
      if (!r.ok) throw new Error('index fetch failed: ' + r.status);
      return r.json();
    })
    .then(function (data) {
      docs = (data && data.documents) || [];
      buildFilters();
      render();
    })
    .catch(function () {
      if (countEl) {
        countEl.textContent = 'The index could not be loaded. ' +
          'Browse the shelves instead: The Library, the Datasheet Index, ' +
          'and Rare Manuals (links above).';
      }
      if (noResults) noResults.hidden = false;
    });
})();
