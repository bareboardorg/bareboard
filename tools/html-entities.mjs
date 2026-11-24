#!/usr/bin/env node
/* HTML-entity decoding, shared by the build tools.
 *
 * Both build-library-index.mjs and build-sitemap.mjs read titles out of
 * page markup, so both need entities decoded the same way. The one
 * implementation lives here; the tools import it. Dependency-free. */

const NAMED_ENTITIES = new Map([
  ["amp", "&"], ["lt", "<"], ["gt", ">"], ["quot", '"'], ["apos", "'"],
  ["nbsp", " "], ["mdash", "\u2014"], ["ndash", "\u2013"],
  ["rsquo", "\u2019"], ["lsquo", "\u2018"], ["rdquo", "\u201d"],
  ["ldquo", "\u201c"], ["hellip", "\u2026"], ["middot", "\u00b7"],
  ["copy", "\u00a9"], ["reg", "\u00ae"], ["trade", "\u2122"],
  ["deg", "\u00b0"], ["times", "\u00d7"], ["micro", "\u00b5"],
  ["Omega", "\u03a9"], ["omega", "\u03c9"],
]);

/* Decodes numeric references (decimal and hex) and the named entities
   this site's pages actually use. A named entity outside the table is
   left exactly as written. */
export function decodeEntities(text) {
  return String(text).replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (whole, body) => {
    if (body[0] === "#") {
      const point = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return String.fromCodePoint(point);
    }
    return NAMED_ENTITIES.has(body) ? NAMED_ENTITIES.get(body) : whole;
  });
}
