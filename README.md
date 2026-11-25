# BareBoard

**Free hardware education.** We can't open their hardware, so we open our findings.

Live at [bareboard.org](https://bareboard.org) — board-level teardowns, diagnostics guides, and standard operating procedures for real consumer hardware, published free forever. The site's largest section covers power mobility devices — wheelchairs and scooters — because their owners are the people most harmed when repair knowledge is gatekept. Every finding is measured on the bench: UART consoles, debug interfaces, regulator modifications, failure-mode procedures you can repeat. The site translates in the visitor's browser — pick any language from the menu; nothing is served from per-language copies.

## What's here

- **Teardowns & board analysis** — documented with photos, schematic references, and measured findings (UART consoles, debug interfaces, regulator mods). Verified findings only.
- **Diagnostics guides** — repeatable procedures for identifying and working around common hardware failure modes.
- **Power mobility devices** — exploded views of power wheelchairs, broken down to component level from the manufacturers' own parts guides, plus fault-code translations, owner repair guides, and plain-language settings references.
- **Document library** — datasheets, manuals, and public records preserved and linked from the guides, so readers never have to hunt a source.
- **AI crawler defense** — the site's boundary-setting approach to unwanted scraping (CSP, `robots.txt`, TDM reservation, `security.txt`), documented as a reference for other small publishers.

## Project research

The underlying bench research behind these guides lives in the author's
research repositories, which are not all public yet. Findings published on
this site are verified on the bench and stand on their own: UART consoles,
debug interfaces, regulator modifications, failure-mode procedures you can
repeat.

Related software work:

- [Verum-Bespoke-Singularity](https://github.com/JamesMarcusAnderson/Verum-Bespoke-Singularity) — Pure-C GPU LLM inference engine.

## Colophon

How and why this site was built: [bareboard.org/colophon.html](https://bareboard.org/colophon.html)

## License

Site content and code in this repository are released under the MIT License.
See [LICENSE](LICENSE) for the full text. Manufacturer documents preserved in
the library remain the property of their publishers and are linked with
attribution.

## Contribute

Found an error, or a device that deserves a teardown? Open an issue with the
device name, what you measured, and photos if you have them. Verified findings
only — every claim on the site is measured on the bench or traced to a public
record.
