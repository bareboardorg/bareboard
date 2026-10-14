# BareBoard Hardware Documentation Registry — DRAFT

**Prepared for:** bareboard.org · **Compiled:** 2026-10-08 · **By:** Right-to-Repair Library
**Aligned with BareBoard's own standard:** *"verified findings only, uncertainty dated and marked"*

---

## How to read this registry

| Status | Meaning |
|---|---|
| 🟢 **PUBLIC** | The vendor publishes it. Collect, preserve, cite. |
| 🔵 **PUBLIC-RESEARCH** | No vendor doc, but public research / community documentation exists. We compile original references from it. |
| 🟠 **SEALED (NDA)** | Vendor-internal trade secret. Listed for awareness, with public-research pointers. **No bounties.** |
| ⛔ **EXCLUDED** | Material that exists only to defeat hardware security or bypass access controls. Not a target, ever. |

**The one rule:** a document's value to a repairer is *not* proportional to how
hard a company tries to keep it secret. A verified public finding beats a stolen,
unverifiable document every time. That is the Autopsy Report standard.

---

## Group A — Ring −2 / Ring −3 execution layers

| Target | Status | Legitimate resource |
|---|---|---|
| Intel CSME internal register maps | 🟠 SEALED | me_cleaner · Skochinsky "Intel ME Secrets" (REcon 2014) · coreboot tooling → **our original doc**: `docs-original/intel-csme-public-reference.md` |
| Intel DFX / JTAG security overrides, factory debug pin-timing sequences | ⛔ EXCLUDED | Debug-lock bypass material — not repair documentation. |
| AMD PSP hardware integration manuals | 🟠 SEALED (spec is NDA) | coreboot PSP Integration Guide · PSPTool · Black Hat 2020 → **our original doc**: `docs-original/amd-psp-public-reference.md` |
| Apple SEP register specifications | 🟠 SEALED | Mandt, Black Hat 2016 · Team Pangu, MOSEC 2020 → **our original doc**: `docs-original/apple-sep-public-reference.md` |
| Qualcomm QSEE hardware fuse maps | 🟠 SEALED | Public academic TrustZone/QSEE research only |

## Group B — Secure elements & cryptographic chips

| Target | Status | Legitimate resource |
|---|---|---|
| Apple T2 / M-series SEP architecture | 🟠 SEALED | T2's SEP is A10-derived (Cortex-A7); vulnerable to the publicly documented "blackbird" research → our SEP doc |
| Google Titan M / M2 | 🟠 SEALED (proprietary) | **Better answer:** OpenTitan — fully open-source silicon root of trust, complete public documentation [4][5] |
| Microsoft Pluton | 🟢 PUBLIC (architecture) | Microsoft Learn: Pluton security processor docs [1] |
| STMicroelectronics ST33 | 🟢 PUBLIC datasheet (security-target/countermeasure docs are NDA) | st.com — ST33Jxxx data briefs & datasheets [2] |
| NXP SE050 EdgeLock | 🟢 PUBLIC | Datasheet public; user guides via free NXP account; Plug & Trust middleware open-source on GitHub [3] |

## Group C — Storage & flash controllers

| Target | Status | Legitimate resource |
|---|---|---|
| Apple ANS NVMe controller registers | 🟠 SEALED | Asahi Linux **m1n1** publicly documents Apple's ANS2 storage controller [7] |
| Samsung Polaris/Elpis VSC command references | 🟠 SEALED | nvme-cli · smartmontools · Samsung Magician (official tool) |
| SK hynix SSD controller registers | 🟠 SEALED (controller) / 🟢 **memory datasheets PUBLIC** | SK hynix publishes H9-series eMMC/eMCP/DRAM datasheets (one preserved in `collected-public-docs/`) |
| Phison E-series controller registers | 🟠 SEALED | Community research only |
| Silicon Motion enterprise registers | 🟠 SEALED | Community research only |

## Group D — Wireless, baseband & RF combo-chips

| Target | Status | Legitimate resource |
|---|---|---|
| Broadcom BCM43xx register reference | 🟠 SEALED (vendor) / 🔵 community docs | Linux b43/brcmfmac drivers · OpenFWWF open firmware · bcm-v4.sipsolutions.net register wiki |
| Qualcomm Snapdragon baseband architecture | 🟠 SEALED | Academic research only |
| Apple U1/U2 UWB transceivers | 🟠 SEALED | iFixit chip-ID guides |
| MediaTek Wi-Fi/BT baseband interfaces | 🟠 SEALED | Community drivers |
| Realtek Ethernet/PCIe registers | 🟢 PARTIAL | Older chips (RTL8139/8169/8111/8168) have public register datasheets [6]; many newer parts are NDA — **do not source from leak mirrors** |

## Group E — PMICs & power management

| Target | Status | Legitimate resource |
|---|---|---|
| Apple 339S/338S PMIC register matrices | 🟠 SEALED | **Our identification guide**: `docs-original/apple-pmic-identification-guide.md` — Dialog→Renesas / Richtek / TI cross-reference |
| TI display driver ICs | 🟢 PUBLIC | ti.com |
| Qualcomm PM-series power architecture | 🟠 SEALED (limited public app notes) | Qualcomm Developer (limited public material) |
| Maxim/ADI battery management / gas gauges | 🟢 PUBLIC | analog.com |
| Dialog / Renesas PMICs | 🟢 PUBLIC | renesas.com |

---

## Bounty rules for the BareBoard board

1. ✅ **Bounties for devices** to teardown and document — your existing Most Wanted
   model. This is the good stuff.
2. ✅ **Bounties for rare *public* documents** — EOL datasheets, dead vendor links,
   hard-to-find public manuals. Collect and preserve them.
3. ✅ **Bounties for original documentation** — "enough public data exists but no
   manual does: write it." Already started: SEP, PSP, CSME, Apple PMIC guides.
4. ❌ **No bounties for SEALED documents** — that is a market for stolen trade
   secrets, and it poisons the "verified findings" brand.
5. ❌ **Never list circumvention material** — debug-lock bypass sequences, fuse
   maps, anti-rollback defeat, raw-NAND access tooling.

## Corrections to the "gatekept" framing

- **ST33, SE050, Pluton, TI, Maxim/ADI, Dialog/Renesas, old Realtek:** public
  documentation exists *today*. The "completely sealed" premise is wrong for
  most of Group B and E.
- **OpenTitan** gives you a *fully documented* secure element — strictly better
  for education than any sealed one.
- The genuinely sealed items (CSME / PSP / SEP / QSEE / Apple ANS / U1-U2 /
  Samsung & Phison & SMI controllers) all have strong **public research**
  coverage → which is exactly what our original compilations are built from.

## Sources

[1] Microsoft Learn — Microsoft Pluton security processor:
https://learn.microsoft.com/en-us/windows/security/hardware-security/pluton/microsoft-pluton-security-processor
[2] STMicroelectronics — ST33Jxxx data brief (public):
https://www.st.com/resource/en/data_brief/st33j2m0.pdf
[3] NXP — EdgeLock SE050 product page (datasheet, user guides, open-source Plug & Trust middleware):
https://www.nxp.com/pages/edgelock-se050-plug-and-trust-secure-element-family-enhanced-iot-security-with-high-flexibility:SE050
[4] OpenTitan — open-source silicon root of trust:
https://github.com/lowRISC/opentitan · https://opentitan.org/book/
[5] Google Open Source Blog — "OpenTitan at one year":
https://opensource.googleblog.com/2020/12/opentitan-at-one-year-open-source.html
[6] Realtek RTL8111B/RTL8168B register datasheet (public copy of vendor-published doc):
https://people.freebsd.org/~wpaul/RealTek/RTL8111B_8168B_Registers_DataSheet_1.0.pdf
[7] Asahi Linux m1n1 (public documentation of Apple Silicon, incl. ANS2 storage controller):
https://github.com/AsahiLinux/m1n1 · https://asahilinux.org/docs/sw/m1n1-user-guide/
[8] BareBoard — site mission ("verified findings only"):
https://www.bareboard.org
