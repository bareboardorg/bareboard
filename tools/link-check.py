#!/usr/bin/env python3
"""Original from-scratch internal link checker for a static site tree.

Walks a directory (default: current working directory, or argv[1]),
reads every .html page, and verifies that every internal href/src
target exists in the tree, using the same resolution rules GitHub
Pages serves with:

  - a link to a directory resolves when that directory has index.html
  - an extensionless link /foo resolves when foo.html exists or when
    foo/index.html exists

External links (http:, https:, protocol-relative //, mailto:, tel:,
javascript:, data:) and fragment-only links (#...) are skipped.
Fragments (#...) and query strings (?... ) are stripped before a
link is resolved.

Pages under SKIP_DIRS are not checked: they are verbatim archived
copies of third-party public records (for example FDA recall pages),
and their root-relative links point at the original publisher's
site, not at this one, so they cannot resolve locally by design.

Output: one line per broken link, then a summary count.
Exit code: 0 when no broken links, 1 when any link is broken.

Standard library only.
"""

import os
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

SKIP_SCHEMES = ("http://", "https://", "//", "mailto:", "tel:",
                "javascript:", "data:")

# Repo-relative directories whose pages are verbatim archived copies
# of third-party documents, not site pages. Their links belong to the
# original publisher's site and are out of scope for this checker.
SKIP_DIRS = ("library/collected-public-docs/",)


class LinkCollector(HTMLParser):
    """Collects (attribute, value, line) for href/src attributes."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("href", "src") and value:
                line, _col = self.getpos()
                self.links.append((value, line))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def is_external(raw):
    """True when a link value points outside the site or nowhere."""
    value = raw.strip()
    if not value:
        return True
    lowered = value.lower()
    if lowered.startswith(SKIP_SCHEMES):
        return True
    if value.startswith("#"):
        return True
    return False


def resolve_target(root, page_dir, raw):
    """Resolve an internal link to a path inside root, or None.

    Returns (candidate_path, display_path) where candidate_path is
    the filesystem path the link points at (possibly a directory or
    an extensionless path) and display_path is the repo-relative
    form used in reports. Returns None when the link is empty after
    stripping its fragment/query, or when it escapes above the root.
    """
    path = urlsplit(raw.strip()).path
    path = unquote(path)
    if not path:
        return None
    if path.startswith("/"):
        joined = os.path.normpath(os.path.join(root, path.lstrip("/")))
    else:
        joined = os.path.normpath(os.path.join(page_dir, path))
    if os.path.commonpath([root, joined]) != root:
        return None
    display = os.path.relpath(joined, root)
    return joined, display


def target_exists(candidate):
    """True when a resolved target is servable by GitHub Pages."""
    if os.path.isfile(candidate):
        return True
    if os.path.isdir(candidate):
        return os.path.isfile(os.path.join(candidate, "index.html"))
    # Extensionless link: /foo serves foo.html or foo/index.html.
    if os.path.isfile(candidate + ".html"):
        return True
    return os.path.isfile(os.path.join(candidate, "index.html"))


def check_tree(root):
    """Check every .html page under root. Returns list of problems.

    Each problem is (page_relative_path, line, link, target_display).
    """
    problems = []
    pages = 0
    skipped = 0
    checked = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames.sort()
        for name in sorted(filenames):
            if not name.endswith(".html"):
                continue
            full = os.path.join(dirpath, name)
            rel_page = os.path.relpath(full, root)
            if rel_page.startswith(SKIP_DIRS):
                skipped += 1
                continue
            pages += 1
            try:
                with open(full, "r", encoding="utf-8", errors="replace") as handle:
                    text = handle.read()
            except OSError as exc:
                problems.append((rel_page, 0, "", "unreadable page: %s" % exc))
                continue
            collector = LinkCollector()
            try:
                collector.feed(text)
            except Exception:
                # A malformed page still yields whatever was collected.
                pass
            page_dir = os.path.dirname(full)
            for raw, line in collector.links:
                if is_external(raw):
                    continue
                resolved = resolve_target(root, page_dir, raw)
                if resolved is None:
                    # Empty after stripping, or escapes the site root.
                    if urlsplit(raw.strip()).path:
                        problems.append((rel_page, line, raw,
                                         "(escapes site root)"))
                    continue
                checked += 1
                candidate, display = resolved
                if not target_exists(candidate):
                    problems.append((rel_page, line, raw, display))
    return problems, pages, skipped, checked


def main(argv):
    root = os.path.abspath(argv[1]) if len(argv) > 1 else os.getcwd()
    if not os.path.isdir(root):
        print("link-check: not a directory: %s" % root, file=sys.stderr)
        return 2
    problems, pages, skipped, checked = check_tree(root)
    for page, line, link, target in problems:
        if line:
            print("%s: line %d: %s -> %s (missing)" % (page, line, link, target))
        else:
            print("%s: %s" % (page, target))
    print("checked %d internal links across %d pages "
          "(%d archived pages skipped): %d broken"
          % (checked, pages, skipped, len(problems)))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
