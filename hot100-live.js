// Hot 100 Renderer - BareBoard curated hardware ranking (v2.0)
// Card grid with category filters, search, and photos.
// Static, sourced, editorial. No fake movement, no live pulse.
(function() {
  var grid = document.getElementById('hot100-grid');
  var updatedEl = document.getElementById('hot100-updated');
  var methodEl = document.getElementById('hot100-methodology');
  var countEl = document.getElementById('hot100-count');
  var filterBar = document.getElementById('hot100-filters');
  var searchInput = document.getElementById('hot100-search');
  if (!grid) return;

  var allDevices = [];
  var activeCategory = 'all';
  var query = '';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function evidenceBadge(ev) {
    var colors = { confirmed: '#0a0', likely: '#a80', unconfirmed: '#888' };
    var c = colors[ev] || '#888';
    return '<span class="ev" style="color:' + c + ';font-weight:bold;">' + esc(ev) + '</span>';
  }

  function sourceLinks(sources) {
    if (!sources || !sources.length) return '';
    return sources.map(function(s, i) {
      var label = s.type ? esc(s.type) : ('source ' + (i + 1));
      var title = s.note ? ' title="' + esc(s.note) + '"' : '';
      return '<a href="' + esc(s.url) + '"' + title + ' target="_blank" rel="noopener">[' + label + ']</a>';
    }).join(' ');
  }

  function guideUrl(d) {
    var rg = d.repair_guide;
    if (!rg || rg.type === 'none' || !rg.verified) return null;
    return rg.archive_url || rg.source_url || null;
  }

  function guideLine(d) {
    var rg = d.repair_guide;
    var url = guideUrl(d);
    if (!url) return '<p class="hot-guide hot-guide--none">No verified repair guide found</p>';
    var who = rg.type === 'ifixit' ? 'iFixit' : 'the maker';
    return '<p class="hot-guide"><a class="guide-btn" href="' + esc(url) + '" target="_blank" rel="noopener">Repair guide &mdash; ' + esc(who) + '</a></p>';
  }

  function card(d) {
    var gUrl = guideUrl(d);
    var firstUrl = gUrl || ((d.sources && d.sources[0] && d.sources[0].url) ? d.sources[0].url : null);
    var name = firstUrl
      ? '<a href="' + esc(firstUrl) + '" target="_blank" rel="noopener">' + esc(d.name) + '</a>'
      : esc(d.name);
    var img = d.image
      ? '<img class="hot-thumb" src="' + esc(d.image) + '" alt="' + esc(d.name) + '" loading="lazy" referrerpolicy="no-referrer">'
      : '<div class="hot-thumb hot-thumb--none" aria-hidden="true"><span>BB</span></div>';
    return '<article class="card hot-card">' +
      '<div class="hot-rank">#' + esc(d.rank) + '</div>' +
      img +
      '<div class="hot-body">' +
        '<h2>' + name + '</h2>' +
        '<p class="hot-meta">' + esc(d.manufacturer) + ' &middot; ' + esc(d.category) + ' &middot; ' + evidenceBadge(d.evidence) + '</p>' +
        guideLine(d) +
        '<p class="hot-sources">' + sourceLinks(d.sources) + '</p>' +
      '</div>' +
    '</article>';
  }

  function matches(d) {
    if (activeCategory !== 'all' && d.category !== activeCategory) return false;
    if (query) {
      var hay = (d.name + ' ' + d.manufacturer + ' ' + d.category + ' ' + (d.why || '') + ' ' + ((d.aliases || []).join(' '))).toLowerCase();
      if (hay.indexOf(query) === -1) return false;
    }
    return true;
  }

  function render() {
    var devices = allDevices.filter(matches).sort(function(a, b) { return a.rank - b.rank; });
    grid.innerHTML = devices.length
      ? devices.map(card).join('')
      : '<p class="lede">No devices match the current filters.</p>';
    if (countEl) countEl.textContent = 'Showing ' + devices.length + ' of ' + allDevices.length + ' devices';
  }

  function buildFilters(devices) {
    if (!filterBar) return;
    var cats = [];
    devices.forEach(function(d) {
      if (cats.indexOf(d.category) === -1) cats.push(d.category);
    });
    cats.sort();
    var html = '<button type="button" class="pill pill--active" data-cat="all">All</button>' +
      cats.map(function(c) {
        return '<button type="button" class="pill" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
      }).join('');
    filterBar.innerHTML = html;
    filterBar.addEventListener('click', function(e) {
      var btn = e.target.closest('.pill');
      if (!btn) return;
      activeCategory = btn.getAttribute('data-cat');
      var pills = filterBar.querySelectorAll('.pill');
      for (var i = 0; i < pills.length; i++) pills[i].classList.remove('pill--active');
      btn.classList.add('pill--active');
      render();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      query = searchInput.value.trim().toLowerCase();
      render();
    });
  }

  fetch(grid.getAttribute('data-json') || '/hot100-live.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      allDevices = (data.devices || []).slice().sort(function(a, b) { return a.rank - b.rank; });
      buildFilters(allDevices);
      render();
      if (updatedEl && data.updated) updatedEl.textContent = 'Updated ' + esc(data.updated);
      if (methodEl) {
        var parts = [];
        if (data.methodology) parts.push('<p>' + esc(data.methodology) + '</p>');
        if (data.ranking_basis) parts.push('<p><em>' + esc(data.ranking_basis) + '</em></p>');
        if (data.evidence_labels) {
          parts.push('<p>Evidence labels: ' +
            Object.keys(data.evidence_labels).map(function(k) {
              return '<strong>' + esc(k) + '</strong> &mdash; ' + esc(data.evidence_labels[k]);
            }).join(' ') + '</p>');
        }
        methodEl.innerHTML = parts.join('');
      }
    })
    .catch(function() {
      grid.innerHTML = '<p class="lede">Could not load rankings.</p>';
    });
})();
