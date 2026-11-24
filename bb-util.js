/* Shared page helpers, kept in exactly one place.
 *
 * Every page script on the site needs to put untrusted text (JSON fields,
 * error messages) into the page without letting it break out of its HTML
 * context. That job lives here, once, under window.BB — no page script
 * carries its own copy. The same goes for fetching a same-origin JSON
 * file: one loader, one response check, used by every page script that
 * fills its cards from data.
 *
 * Pages load this file before their own page script; both are deferred,
 * so BB exists by the time any page script runs. No dependencies. */

(function () {
  "use strict";

  /* The five characters with special meaning inside HTML text or inside a
     double-quoted attribute value, and what each one becomes. One pass
     over the input, one lookup per match. */
  var REPLACEMENTS = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  var UNSAFE = /[&<>"']/g;

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(UNSAFE, function (ch) {
      return REPLACEMENTS[ch];
    });
  }

  /* Small evidence pill. "confirmed" gets the green style; every other
     value gets the amber style. The colors are defined in style.css. */
  function evidenceBadge(level) {
    var style = level === "confirmed" ? "b-confirmed" : "b-likely";
    return '<span class="badge ' + style + '">' + escapeHtml(level) + "</span>";
  }

  /* Fetch a same-origin JSON file and hand the parsed data to onData,
     or the failure to onError. The response check lives here once: a
     non-2xx answer is an error, not a page of HTML parsed as JSON. */
  function loadJson(url, onData, onError) {
    fetch(url, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(onData)
      .catch(onError);
  }

  window.BB = { esc: escapeHtml, evBadge: evidenceBadge, loadJson: loadJson };
})();
