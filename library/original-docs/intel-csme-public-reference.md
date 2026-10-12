# Intel Management Engine / CSME — Public Reference Manual

> **ORIGINAL COMPILATION** — written for the Right-to-Repair Library from public
> sources. This is **not** Intel documentation. Intel publishes no register maps
> for the ME/CSME; everything below comes from public reverse-engineering
> research, the Linux kernel, and the coreboot/open-firmware community, cited at
> the bottom. Suggested license: CC BY-SA 4.0.

---

## 1. What the ME / CSME is

- The **Intel Management Engine (ME)** — branded **CSME** (Converged Security
  and Management Engine) on client platforms, **TXE** (Trusted Execution Engine)
  on Atom/Merrifield-class parts, **SPS** (Server Platform Services) on servers —
  is a **dedicated microcontroller** inside Intel chipsets, present and
  **required since Nehalem (2008)**.
- It communicates with the host OS over **HECI/MEI** (Host Embedded Controller
  Interface) — a PCI memory-mapped interface. The host side is served by the
  **Linux `mei` kernel driver** and Intel's own HECI/MEI drivers + AMT SDK.
- Capabilities built on it: **AMT** (Active Management Technology — remote
  management, KVM, SOAP-over-HTTP(S) protocol) and **System Defense** (a
  low-level packet filter/firewall).
- The ME firmware is a set of **modules**; known module names (Skochinsky,
  REcon 2014):

| Module | Role |
|---|---|
| `BUP` | Bring-Up — hardware initialization/configuration |
| `KERNEL` | Scheduler and low-level APIs for other modules |
| `POLICY` | Secondary init tasks, higher-level APIs |
| `HOSTCOMM` | High-level protocols over HECI/MEI |
| `CLS` | Capability Licensing Service — enables/disables features |

## 2. Why repair people care

- **Failure mode:** on post-Core-2 systems, removing/corrupting the ME causes
  the machine to **reboot every ~30 minutes** — a classic board-repair
  diagnostic clue.
- **Security posture:** the ME is a black box running below the OS with network
  reach (AMT). It has a long public CVE history (INTEL-SA-xxxxx advisories).
- **User control:** the community has built legitimate tools to minimize or
  disable it (below) — this is standard practice in open firmware (coreboot,
  System76, Purism).

## 3. Disabling / minimizing the ME (public, legitimate methods)

| Method | How | Notes |
|---|---|---|
| **me_cleaner** | Strips non-essential modules from the ME image | github.com/corna/me_cleaner; works up to ~ME11-era; not supported on newer gens |
| **HAP bit** ("altmedisable") | A bit in the flash descriptor tells the ME to disable itself after hardware init | Set with coreboot's `ifdtool`; subject of the "High Assurance Platform" research |
| **HECI runtime disable** | A HECI command disables ME runtime components until power-off | Implemented as `me-disable` (reversed from the `mei` driver) |
| **Manufacturing mode check** | `mmdetect` detects ME manufacturing mode | Useful diagnostics |

⚠️ Disabling the ME has a power-management side effect on modern platforms:
without CSME reporting a low-power state, the CPU cannot reach its deepest
idle state (C10) and S0ix suspend draws roughly **3 W instead of ~1 W**
(System76/coreboot documentation).

## 4. Public tooling table

| Tool | Purpose |
|---|---|
| `me_cleaner` | Remove ME modules / set HAP bit |
| `intelmetool` | Read ME info at runtime (coreboot `util/intelmetool`) |
| `me-disable` | Temporarily disable ME features via HECI command |
| `spsInfo` | SPS (server) info |
| `mei-amt-check` | Check ME/AMT state |
| `mmdetect` | Detect ME manufacturing mode |
| `ifdtool` | Edit the flash descriptor (HAP bit, region layout) |

## 5. Where the real documentation lives (public)

- **Linux kernel `mei` driver** — the host interface, mainline since ~2.6.x.
- **coreboot** — ME/CSME integration, `intelmetool`, `ifdtool`, and per-SoC
  notes (doc.coreboot.org).
- **me_cleaner** — deep practical knowledge of ME firmware structure.
- **Igor Skochinsky, "Intel ME Secrets" (REcon 2014)** — the foundational
  public architecture teardown (preserved in `collected-public-docs/`).
- **Intel's public advisories** — INTEL-SA security bulletins (intel.com).

## 6. Honest gap

Full ME/CSME **register maps and the CSME System Tools (FIT/FPT)** are
Intel-internal. They circulate only as leaked material, which this library does
**not** collect. The public ecosystem above covers architecture, firmware
structure, host interface, and control — which is what repair and open-firmware
work actually needs.

## Sources (all public)

1. Igor Skochinsky, *"Intel ME Secrets"*, REcon 2014 —
   https://recon.cx/2014/slides/Recon%202014%20Skochinsky.pdf
   *(preserved in `collected-public-docs/`)*
2. me_cleaner — https://github.com/corna/me_cleaner (incl. ME12 soft-disable PR #282)
3. System76, *Open Firmware — Intel ME documentation* —
   https://github.com/system76/firmware-open/blob/master/docs/intel-me.md
4. HardenedVault, *"What every CISO and security engineer should know about
   Intel CSME"* (tooling table, disable methods, S0ix impact) —
   https://hardenedvault.net/blog/2021-07-16-ciso-seceng_csme/
5. coreboot documentation — https://doc.coreboot.org
