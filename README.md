# BareBoard

**Free hardware education.** We can't open their hardware, so we open our findings.

Live at [bareboard.org](https://bareboard.org) — board-level teardowns, diagnostics guides, and standard operating procedures for real consumer hardware, published free forever. Every finding is measured on the bench: UART consoles, debug interfaces, regulator modifications, failure-mode procedures you can repeat.

## What's here

- **Teardowns & board analysis** — documented with photos, schematic references, and measured findings (UART consoles, debug interfaces, regulator mods). Verified findings only.
- **Diagnostics guides** — repeatable procedures for identifying and working around common hardware failure modes.
- **AI crawler defense** — the site's boundary-setting approach to unwanted scraping (CSP, `robots.txt`, TDM reservation, `security.txt`), documented as a reference for other small publishers.

## Project repos

The underlying research lives in its own repositories:

- xb3 — Xfinity XB3 gateway (Arris TG1682, Intel Puma 6)
- tamarin — Pico SWD/JTAG probe for iPhone X (A11)
- haywire — Lightning AV adapter SecureROM research
- apple-t2 — Apple T2 DFU-mode enumeration notes
- smart-battery-case — A2070 debug console + I2C telemetry

Related software work:

- [verum-bespoke-singularity](https://github.com/JamesMarcusAnderson/verum-bespoke-singularity) — Pure-C GPU LLM inference engine, Metal, CUDA, HIP backends

## Colophon

How and why this site was built: [bareboard.org/colophon.html](https://bareboard.org/colophon.html)
