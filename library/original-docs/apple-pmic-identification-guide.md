# Apple Custom Power Management Chips — Identification & Cross-Reference Guide

> **ORIGINAL COMPILATION** — written for the Right-to-Repair Library from public
> sources (teardowns, chip-ID guides, vendor documentation). Apple publishes **no
> datasheets** for its custom power-management silicon; this guide collects what
> the public repair community has established and how to find the underlying
> vendor documentation. Suggested license: CC BY-SA 4.0.

---

## 1. The core problem

Apple marks its power-management chips with **proprietary part numbers**
(`APL…` die codes + `343S…`/`338S…` package markings). No official datasheets
exist. But public teardown analysis shows many of these are **rebranded
third-party power ICs** — TechInsights explicitly labels several as
**"Apple/Dialog"** (Dialog Semiconductor, now **Renesas**). That is the key to
finding real documentation: identify the Apple marking, then find the underlying
vendor part.

## 2. Confirmed identifications

| Apple marking | Role | Where it appears | Public confirmation |
|---|---|---|---|
| `APL1096` / `343S00474` | **Main PMIC** | M1 (2020) MacBook Air / Pro, iMac 24", iPad Pro M1 | iFixit M1 iMac teardown; TechInsights iPad Pro teardown |
| `APL1097` / `343S00475` | **Companion PMIC** (works with APL1096) | Same M1 boards | iFixit M1 iMac teardown |
| `343S00653` (die `APL109H`) | **PMIC** | M3 Pro / M3 Max (2023) MacBook Pro 14"/16" — boards A2991/A2992/A2993 | iFixit "M3 Pro Chip ID" guide (appears as `APL109H/343S00652` + `APL109H/343S00653`); sold as board-repair spares |
| `353S02471-A1`, `343S00389-A0` | PMICs labeled **"Apple/Dialog"** | iPad Pro M1 | TechInsights teardown analysis |
| `APL1028` | Apple-marked regulator (IVR-class) | Known from repair communities | Not independently verified in this pass — **verify before relying on it** |

## 3. The cross-reference strategy (how to get a real datasheet)

1. **Identify the Apple marking** from an iFixit chip-ID guide or teardown photos
   of your exact board model.
2. **Guess the underlying vendor.** Apple power silicon is commonly:
   - **Dialog / Renesas** (many `338S…`/`343S…` PMICs),
   - **Richtek** (a MediaTek subsidiary — publishes datasheets freely),
   - **Texas Instruments**, **ON Semiconductor**, or **Maxim/ADI**.
3. **Find the vendor datasheet** on the vendor site (richtek.com, renesas.com,
   ti.com) or via distributors (Digi-Key, Mouser, LCSC/JLCPCB part pages).
4. **Confirm package & pinout** against board photos before ordering or
   substituting — Apple markings do not guarantee a 1:1 pinout with the
   commercial part.
5. **Use spares-vendor listings** to confirm function and compatible board
   models (they sell these chips for microsoldering repair).

## 4. A part on the same boards that DOES have a public datasheet

- **`Richtek RT4541GQV`** — CPU PWM/power controller, confirmed on the M1 iMac
  board next to the Apple PMICs (iFixit teardown). Richtek publishes datasheets
  openly on **richtek.com** (and Mouser hosts Richtek documents). This is a
  genuinely obtainable datasheet for an Apple-board power component.

## 5. Repair notes

- **Symptoms of PMIC failure:** no power, no charge, dead board — check the
  main PMIC and its companion first.
- **Replacement** requires microsoldering (BGA); match the **exact marking** —
  `343S00652` and `343S00653` are a matched pair on M3 Pro/Max boards and are
  not interchangeable.
- For **schematics**, do not use leaked Apple documents (excluded from this
  library). Use iFixit chip-ID guides + this cross-reference method instead.

## Sources (all public)

1. iFixit, *iMac M1 24" Teardown* (May 2021) — confirms APL1096/343S00474,
   APL1097/343S00475, Murata 339S00763, Richtek RT4541GQV —
   https://www.ifixit.com/Teardown/iMac+M1+24-Inch+Teardown/142850
2. TechInsights, *Apple iPad Pro Teardown* blog — "Apple APL1096 PMIC",
   "Apple/Dialog 353S02471-A1 PMIC", "Apple/Dialog 343S00389-A0 PMIC" —
   https://www.techinsights.com/blog/teardown/apple-ipad-pro-teardown
3. iFixit, *MacBook Pro 14" Late 2023 M3 Pro Chip ID* — `APL109H/343S00652` +
   `APL109H/343S00653` power management —
   https://www.ifixit.com/Guide/MacBook+Pro+14-Inch+Late+2023+M3+Pro+Chip+ID/167049
4. Spares vendor listing, 343S00653 (A2991/A2993 PMIC, M3 Pro/Max 2023) —
   https://www.sparesonly.in/products/343s00653-power-ic-controller-for-macbook-pro-a2991-macbook-pro-a2993-pmic-chip-for-logic-board-repair
5. Richtek (MediaTek) — datasheets and selection guides — https://www.richtek.com
   · Mouser-hosted Richtek selection guide — https://www.mouser.com/pdfDocs/richtekselectionguide_2024.pdf
