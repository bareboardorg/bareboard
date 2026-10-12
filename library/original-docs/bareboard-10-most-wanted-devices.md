# BareBoard "10 Most Wanted" — Obscure Devices Hiding in Plain Sight

**Concept:** after the FBI's Ten Most Wanted — but for hardware. The most unknown
devices on Earth: **still in circulation today, relevant to human life, and almost
nobody has ever seen inside one.**

**Compiled:** 2026-10-08 · Draft for bareboard.org · "Verified findings only" standard applies

## Rules of the list

1. **Still in circulation** — someone you know is using one right now.
2. **Relevant to human life** — health, safety, civic life, infrastructure, or money.
3. **Unknown** — the public has almost never seen the inside.
4. **Legally autopsyable** — retired/surplus units are obtainable. Never an in-service unit.

---

## The List

### 1. Hospital infusion pump
*Baxter/Hospira Plum 360 · B. Braun Infusomat · Medtronic Sigma — older generations still infusing in hospitals worldwide.*
- **Hiding in plain sight:** every hospital room, running 24/7, networked to pharmacy systems.
- **Why it matters:** it decides whether a patient lives. Drug libraries, dose limits, and
  wireless/network interfaces are life-critical.
- **What's sealed:** firmware internals, network protocol, drug-library integrity checks.
- **Autopsy angle:** hospital-surplus units; focus on the network interface, safety
  interlocks, and whether drug libraries can be tampered with.
- **Public context:** FDA MAUDE adverse-event reports are public; internals are not.

### 2. Implantable pacemaker / ICD
*Medtronic · Abbott (St. Jude) · Boston Scientific — 10–15 year service lives.*
- **Hiding in plain sight:** hundreds of thousands of people are walking around right now
  with 2010-era silicon in their chest.
- **Why it matters:** the most life-critical device a person can carry.
- **What's sealed:** everything — radio reprogramming protocol, crypto, firmware.
- **Autopsy angle:** **explanted** units only (recovered at replacement surgery; research
  programs exist). Never image or probe a device in a patient. Coordinate with the
  vendor; responsible disclosure is mandatory.

### 3. CGM + insulin pump (older generations)
*Dexcom G4/G5 · Omnipod · Medtronic MiniMed 530G/630G.*
- **Hiding in plain sight:** worn on belts and arms by diabetics everywhere, including kids.
- **Why it matters:** closed-loop dosing decisions made by radio-linked devices.
- **What's sealed:** the RF protocol between pump and CGM, calibration crypto, firmware.
- **Autopsy angle:** retired consumer units are easy to obtain; analyze the radio link and
  the dosing-command path.

### 4. Voting machine
*DREs and optical scanners still deployed in multiple jurisdictions.*
- **Hiding in plain sight:** school gymnasiums on election day.
- **Why it matters:** civic life itself. Public trust is at historic lows; the hardware is
  a black box to almost everyone.
- **What's sealed:** internals, firmware, tabulation path.
- **Autopsy angle:** decommissioned units are legally obtainable (public auctions, records
  requests, and established "voting village" research practice).

### 5. Water-treatment PLC
*Siemens S7-300/400 · Allen-Bradley PLC-5 · Schneider Modicon M340.*
- **Hiding in plain sight:** locked cabinets in municipal water and wastewater plants on
  every continent.
- **Why it matters:** the Stuxnet lineage — these controllers run critical infrastructure,
  often on decades-old, end-of-life firmware.
- **What's sealed:** firmware images, safety logic, network services.
- **Autopsy angle:** industrial surplus gear is cheap and legal; document the network
  services, firmware extraction, and EOL documentation status. Disclose via ICS-CERT.

### 6. Utility smart meter
*Landis+Gyr · Itron · Elster AMI meters.*
- **Hiding in plain sight:** on the outside of millions of homes.
- **Why it matters:** remote disconnect, consumption surveillance, RF mesh networking —
  infrastructure that watches the people.
- **What's sealed:** firmware, RF mesh protocol, metrology calibration.
- **Autopsy angle:** utility surplus and secondary-market units; RF interface, firmware
  extraction, mesh traffic analysis.

### 7. Aircraft GPS / FMS
*Garmin GNS 430/530 and similar — still flying in tens of thousands of aircraft.*
- **Hiding in plain sight:** the panel of nearly every general-aviation aircraft.
- **Why it matters:** human lives on every flight, on aging hardware with monthly database cycles.
- **What's sealed:** internal architecture, database loading path, sensor interfaces.
- **Autopsy angle:** retired avionics via salvage channels. **Research only — never modify
  or reinstall certified avionics.**

### 8. Traffic signal controller
*Econolite · Intelight · Siemens cabinets.*
- **Hiding in plain sight:** the metal cabinet at every intersection.
- **Why it matters:** it sequences the movement of human bodies and vehicles; failures kill.
- **What's sealed:** conflict monitor logic, load switching, coordination radios, firmware.
- **Autopsy angle:** city surplus; document the fail-safe behavior and the radio link.

### 9. ATM computer
*Triton / Nautilus / NCR — the PC, EPP, card reader, and dispenser inside.*
- **Hiding in plain sight:** every street corner.
- **Why it matters:** it is a vault computer that handles money and card data, and its
  attack surface is deliberately secret.
- **What's sealed:** EPP protocol, dispenser mechanics, host network protocol, disk encryption.
- **Autopsy angle:** decommissioned ATMs are sold at auction; treat it as a hardened PC
  with a cash box. Defensive research only.

### 10. Diesel engine ECU
*Bosch EDC7 / EDC16 in trucks, ships, and generators worldwide.*
- **Hiding in plain sight:** the engine of every truck, ship, and backup generator.
- **Why it matters:** emissions, safety, and the entire "chip tuning" secrecy economy are
  built on this hardware — still in circulation by the millions.
- **What's sealed:** calibration maps, flash protocols, immobilizer logic.
- **Autopsy angle:** dead ECUs from scrap; bench harness; correlate with emissions testing.

## Runners-up (the bench)
Rail interlocking systems · fire alarm panels (Simplex/EST) · elevator controllers ·
marine ECDIS units · utility reclosers · radiation monitors · POS terminals ·
blood-glucose meters · older surgical-robot components.

## Part II — The Bench (ten more candidates)

No device is sacred. The flagship Ten above are the FBI list; these ten are the bench —
equally wanted, equally legal to autopsy (retired units only, responsible disclosure always).

| # | Device | Domain | Why it's wanted |
|---|---|---|---|
| 11 | POS terminal (older Verifone / Ingenico) | Financial | Handles payments everywhere; sealed by design |
| 12 | Election tabulator | Civic | Counts the votes; a black box to the public |
| 13 | SCADA / RTU (oil & gas: Emerson ROC, Bristol Babcock) | Infrastructure | Runs pipelines nobody watches |
| 14 | Radiation monitor (older Eberline / Canberra) | Infrastructure | Guards nuclear sites; aging fleet still in service |
| 15 | Rail signaling / interlocking | Transport | Keeps trains apart; relay-era logic still live |
| 16 | Marine ECDIS / engine controllers | Transport | Every ship's bridge and engine room |
| 17 | Elevator controller | Infrastructure | In every building; undocumented publicly |
| 18 | Fire alarm panel (older Simplex / EST) | Infrastructure | Life safety in every building |
| 19 | Blood glucose meter | Medical | Ubiquitous; firmware sealed |
| 20 | Surgical robot components (older da Vinci) | Medical | Operating rooms run on sealed systems |

## How to autopsy legally and safely (the BareBoard way)

- **Acquire legally:** auctions, hospital/industrial surplus, secondary markets, public
  records. Keep the receipt.
- **Never touch an in-service unit.** Life-critical and civic devices are off-limits
  while deployed — retired units only.
- **Air-gap anything networked.** Assume hostile firmware until proven otherwise.
- **Responsible disclosure:** vendor CVD, or ICS-CERT for infrastructure. Coordinated
  timelines. The finding is only "verified" when it's reproducible and sourced.
- **Publish the uncertainty:** date it, mark it, and say what you don't know. That is
  the site's brand — and it's what separates an autopsy report from a rumor.
