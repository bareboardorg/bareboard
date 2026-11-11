/* Most Wanted — render the board from /data/most-wanted.json.
   The JSON is the registry of record; the static list in most-wanted.html
   is the no-JS fallback and is replaced by this render when the fetch
   succeeds. On any failure the static list stays — the board never blanks.
   No fetch leaves the origin; CSP connect-src 'self' covers it. */
(function () {
  'use strict';

  var list = document.getElementById('mw-board');
  if (!list) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function entryHtml(e) {
    return '<li>' +
      '<h3>' + esc(e.name) + '</h3>' +
      '<p><strong>Sought for:</strong> ' + esc(e.soughtFor) + '</p>' +
      '<p><strong>Why it matters:</strong> ' + esc(e.whyItMatters) + '</p>' +
      '<p><strong>Priority:</strong> ' + esc(e.priority) + '</p>' +
      '</li>';
  }

  fetch('/data/most-wanted.json')
    .then(function (r) {
      if (!r.ok) throw new Error('most-wanted.json: HTTP ' + r.status);
      return r.json();
    })
    .then(function (board) {
      if (!board || !Array.isArray(board.entries) || board.entries.length === 0) return;
      list.innerHTML = board.entries.map(entryHtml).join('');
      list.setAttribute('data-rendered-from', 'data/most-wanted.json');
    })
    .catch(function () { /* static fallback stays */ });
})();
