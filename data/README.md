# Most Wanted — data

The armory's ledger. `most-wanted.html` is the board; this folder is the
board's memory. Everything here is plain JSON so anyone can read it, diff
it, and propose changes.

## Files

- `most-wanted.json` — the board itself. Array order in `entries` is rank
  order. `graduated` holds entries that were acquired and documented.
- `most-wanted.schema.json` — the exact shape of the board file.
- `submission.schema.json` — the exact shape of one community submission.
- `../tools/build-tracker.mjs` — validates `most-wanted.json` and
  regenerates `../most-wanted-tracker.csv` (the tracker the Registry page
  links to). Run it before committing any change here:
  `node tools/build-tracker.mjs`

## Entry lifecycle

```
wanted → claimed → on-the-bench → documented
```

- **wanted** — on the board, nobody has committed to it yet.
- **claimed** — a named contributor has committed (`claim.by`,
  `claim.date`). A claim is a promise to document, not ownership of the
  topic; stale claims can be released by the board with a history note.
- **on-the-bench** — hardware in hand, examination under way.
- **documented** — the autopsy/device page is published. The entry moves
  from `entries` to `graduated`, `links.autopsy` points at the published
  page, and the next candidate moves up the board.

Every transition appends to the entry's `history`. Entries are never
deleted and ids are never reused — the board's history is part of the
record.

## Scoring

`score = 0.5 × rarity + 0.3 × darkness + 0.2 × reach`, each 0–10
(rarity: how hard to find; darkness: how little public research exists;
reach: installed base still in use). `priority` — HIGH PRIORITY /
ELEVATED / STANDARD — is the board's editorial band and is what the page
displays. Component scores may be `null` when the board has not published
them for an entry.

## How to submit

The site is static and takes no form posts, so submissions travel as
data, in the open:

1. **Open a GitHub issue** in the site repository containing one JSON
   object that validates against `submission.schema.json`, or
2. **Open a pull request** that adds your submission JSON under
   `data/submissions/` (one file per submission, named
   `YYYY-MM-DD-<device-slug>.json`), or adds a finished entry directly
   to `most-wanted.json` for review.

Four kinds of submission:

- **teardown** — you examined a device you own and wrote it up (the
  Contribute page's autopsy format). Include a summary, key findings,
  and photo links.
- **bounty-request** — a device you want on the board. Include the
  "sought for" and "why it matters" case; proposed rarity/darkness/reach
  scores are welcome.
- **hardware-offer** — you have a board device on a shelf and will send
  it to the bench. Condition required; region is coarse and optional.
- **document** — a rare public document to collect and preserve, with
  its public source URL.

Accepted submissions are merged into `most-wanted.json` (`source` set to
`submission:<file>`), the tracker CSV is regenerated, and the board page
updates on the next deploy.

## Rules (enforced at review, partly by the schema)

From the Registry's bounty rules — they are not decoration:

- Bounties exist for devices to teardown and document, for rare public
  documents, and for original documentation written from public research.
- **No sealed (NDA) material.** No bounties for it, no listings of it
  beyond awareness. A document submission must be `public` or
  `public-research`; any other status is invalid by schema.
- **No circumvention material, ever.** It is not a target and cannot be
  submitted.
- Teardowns are of **personally owned, legally acquired hardware** only,
  and everything rests on **public sources**. Every submission carries
  the three attestations in the schema; all three must be `true`.
- A submitter's `contactPrivate` is for the board's reply only. It is
  never published and never copied into the board file.
