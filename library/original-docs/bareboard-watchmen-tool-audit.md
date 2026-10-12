# Who Watches the Watchmen — Auditing the Hacker's Own Toolkit

**Concept:** your tools see everything you probe. A logic analyzer captures your
target's buses; a debug probe holds your target's secrets; a USB-serial cable sits
between you and the device under test. If the tool is adversarial — or just opaque —
you have handed your work to a black box. This framework audits the tools themselves.

**Compiled:** 2026-10-08 · Draft for bareboard.org

---

## The watchmen rules

1. **Your tool is the most privileged device in the lab.** It touches the target's
   memory, buses, and keys.
2. **Open beats closed.** If you cannot read the design, you cannot trust the tool.
3. **Verify, don't trust.** Build from source, hash the firmware, scan the tool itself.
4. **Air-gap for sensitive targets.** If the target's secrets matter, the tool must
   have no path to the internet.

## The audit table

| Tool | Design docs | Firmware | Host software | Phone-home risk | Verdict |
|---|---|---|---|---|---|
| **Glasgow Interface Explorer** (revC3) | 🟢 Open (schematics + gerbers public) | 🟢 Open (glasgow embedded, MIT) | 🟢 Open (Python) | None | **Fully auditable.** Best citizen on this list. |
| **Raspberry Pi Pico / RP2040** | 🟢 **Full public datasheet incl. registers** | 🟢 Open (pico-sdk, TinyUSB) | 🟢 Open | None | **Fully auditable.** RP2040's complete public datasheet is rare and excellent. |
| **Bus Pirate** (v4/v5) | 🟢 Open | 🟢 Open (community) | 🟢 Open | None | Auditable. |
| **HackRF One** | 🟢 Open (schematics public) | 🟢 Open (Great Scott Gadgets) | 🟢 Open | None | Auditable. |
| **GreatFET One** | 🟢 Open | 🟢 Open | 🟢 Open | None | Auditable. |
| **Proxmark3 RDV4** | 🟢 Open (schematics public) | 🟢 Open (RfidResearchGroup) | 🟢 Open | None | Auditable. Powerful RFID tool — legal, defensive use only. |
| **Flipper Zero** | 🟢 Open hardware | 🟢 Open firmware | 🟡 App store / cloud components are closed | Low | Mostly auditable — audit the *device*; treat the app ecosystem as a separate trust boundary. |
| **Saleae Logic 8/16/Pro** | 🔴 Closed | 🔴 Closed | 🔴 Proprietary (Logic 2) | Unknown / account-linked features | **Not auditable.** Treat as untrusted for sensitive work; use an open stack (below). |
| **Segger J-Link** | 🔴 Closed | 🔴 Proprietary, license-locked to serial | 🔴 Proprietary | License checks | **Not auditable.** Assume opaque; fine for hobby work, not for sensitive targets. |
| **FTDI USB-serial cables** | 🔴 Closed (firmware lives in the cable) | 🔴 Closed | 🟡 Driver history | **Known adversarial precedent** (driver bricked counterfeit chips) | Avoid for sensitive work; prefer an MCU you program yourself (e.g., a Pico running TinyUSB). |
| **Total Phase Beagle** | 🔴 Closed | 🔴 Closed | 🔴 Proprietary | Unknown | Not auditable. |
| **Rigol / Siglent scopes** | 🔴 Closed | 🔴 Closed (famously unlockable by software) | 🔴 Proprietary | **Some models have LAN** | Not auditable — but *scan it*: nmap your own bench and disable anything it exposes. |
| **Teledyne LeCroy exercisers** | 🔴 Closed | 🔴 Closed | 🔴 Proprietary | Enterprise-managed | Not auditable. |

## The audit checklist (run it on every tool you own)

1. **Design openness** — are schematics, gerbers, and BOM public?
2. **Firmware** — is the source public? Is it signed? Can *you* reflash it (DFU present = good sign)?
3. **Host software** — open source? Telemetry? Forced updates? Account required?
4. **Network** — does the tool itself have Wi-Fi / Ethernet / Bluetooth? **nmap it.**
5. **USB** — capture its descriptors (VID/PID); look for hidden DFU or maintenance interfaces.
6. **Supply chain & vendor history** — where is it fabbed, who else can program it, and has
   the vendor ever acted adversarially (bricking, license fights, EOL abandonment)?
7. **Operational hygiene** — build firmware from source, record hashes, and use the tool
   air-gapped when the target's secrets matter.

## The open alternative stack

- **Logic analysis:** sigrok + PulseView on fx2lafw-based analyzers, or a Glasgow.
- **SDR:** rtl-sdr (open driver; chip firmware closed but heavily audited by the community).
- **USB-serial / GPIO:** an RP2040 board running TinyUSB — you hold the firmware.
- **RFID/NFC:** Proxmark3 (open) — with legal-use discipline.
- **RF sniffing:** HackRF / PortaPack (open).

## Why this needs no leaked documents

Almost every open tool on this list **publishes its full design** — that openness is
precisely why it belongs on a hacker's bench. The audit is done from public docs plus
a multimeter, not from stolen manuals. Closed commercial tools cannot be audited at
the hardware level at all — so for sensitive work, the watchmen answer is simple:
**don't use them.** Scan them, document what they expose, and reach for the open stack.

> The one item in the wild list that was explicitly a *leaked* document (a repair
> diagram for a commercial scope) is the exception that proves the rule: skip the leak,
> nmap the device, and publish what you find yourself. That is a verified finding.
