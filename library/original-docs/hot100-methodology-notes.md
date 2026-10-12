# Hot 100 — Methodology Notes (review of v0.1)

**For:** bareboard.org Hot 100 — "100 most-used consumer electronic devices, ranked
across a 1,000-device universe" · **Compiled:** 2026-10-08

## The start-year question

**Recommendation: start January 1, 1980.**

Rationale:
- 1979–1981 is the inflection where consumer electronics became **personal, mass-market,
  and digital**: Walkman (1979), IBM PC (1981), VHS, Atari 2600, digital watches and
  calculators. Before ~1975, "consumer electronics" mostly means broadcast appliances
  (radios, CRT TVs) — a different preservation problem, better handled elsewhere.
- "Most-used" rewards **accumulated installed base**. Starting in 1980 gives the 1980s
  generation (Game Boy, Walkman, IBM PC compatibles, NES, camcorders) its fair decades
  to compete with 2020s devices. Starting in 1990 silently erases an entire generation
  of the most-used devices ever made.
- A 46-year window (1980 → today) is long enough for a "top 100 most-used" ranking to
  be meaningful across generations.

**Alternative — 1990-01-01 — if you reframe the list** as "devices most at risk of
documentation loss." That is a *preservation* ranking, not a *usage* ranking: 1990 is
when vendor documentation went digital and started disappearing (dead links, EOL pages,
  dead vendor sites). Defensible — but then say so in the title, because the two lists
  will rank differently.

Whatever you choose: **publish the inclusion rule explicitly.** A ranking without a
stated window invites every objection.

## Suggested universe definition (v0.2)

A *consumer electronic device* = a **mass-market, user-operated, mains- or
battery-powered electronic product**. Include: computers, phones, appliances, AV gear,
toys, tools, medical-consumer devices. Exclude: discrete components, industrial-only
equipment (that is the Most Wanted board's job), infrastructure, and software-only
products.

## Suggested scoring (make "most-used" computable)

> **Use score = units in circulation × average daily interactions × years in service**

- *Units in circulation:* peak installed base (shipments where known).
- *Daily interactions:* how often a typical unit is touched per day (a phone scores
  far above a wall clock).
- *Years in service:* average lifespan × replacement cycle — rewards durable,
  still-running devices and naturally surfaces the Most Wanted crossover.

**Normalize by era** so a 1985 device and a 2025 device compete fairly: score each
device within its decade, then weight decades by total installed units.

## The "still in circulation" flag

Add a column: **🟢 still in circulation today.** It is the bridge between the Hot 100
and the Most Wanted board — a hot, still-running device with dying documentation is
the most valuable autopsy target you have.

## Verification standard (the brand)

Every ranked entry needs: a public citation for the shipment/installed-base figure,
the figure's date, and an uncertainty mark where the number is estimated. "Verified
findings only, uncertainty dated and marked" — the Autopsy Report standard applied to
the ranking itself.
