/* Shared file enumeration for the site's build tools.
   One implementation, used by every builder that walks the tree. */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/* Every *.html under dir, in sorted order, as absolute paths. */
export function collectHtml(dir, found) {
  const entries = readdirSync(dir).sort();
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectHtml(full, found);
    else if (name.endsWith(".html")) found.push(full);
  }
  return found;
}
