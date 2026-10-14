# AMD Platform Security Processor (PSP) — Public Reference Manual

> **ORIGINAL COMPILATION** — written for the Right-to-Repair Library from public
> sources. This is **not** AMD documentation. AMD's PSP BIOS Architecture Design
> Guides are NDA documents (coreboot cites them as PID #55758 and #54267); the
> structures below come from **coreboot's public documentation**, the PSPTool
> project, and public conference research, cited at the bottom.
> Suggested license: CC BY-SA 4.0.

---

## 1. What the PSP is

- The **AMD Secure Processor** (formerly *Platform Security Processor*) is an
  **onboard ARM processor** that runs alongside the main x86 CPU — AMD's
  equivalent of the Intel Management Engine. Early APUs used an **ARM
  Cortex-A5**; modern Ryzen parts run ARM TrustZone software, with the
  **Kinibi TEE** (Trustonic) as the Secure OS.
- The PSP **boots before the x86 cores** and is mandatory: it verifies and
  releases the rest of the system. A board will not boot without valid PSP
  firmware blobs.
- It provides: secure boot enforcement, the **fTPM** (firmware TPM 2.0),
  **AMD SEV** (Secure Encrypted Virtualization), and platform initialization
  (memory training, BIOS image decompression).

## 2. Boot flow (pre-x86)

From coreboot's *AMD Family 17h* documentation and the Black Hat 2020 research:

1. **System power on** → the PSP executes its **immutable on-chip boot ROM**.
2. The boot ROM locates the **Embedded Firmware Structure** and **PSP Directory
   Table** in the SPI flash (via the hidden PSP firmware filesystem / FET —
   see §3).
3. It **verifies and executes the off-chip bootloader** (`PSP_FW_BOOT_LOADER`).
4. The bootloader loads and executes **ABL stages (ABL0–ABL6)** in order —
   AGESA Bootloader code. Additional components in the chain include
   **DebugUnlock** and **SecGasket**; the **SEV app** is loaded at runtime on
   OS request. On Ryzen, SRAM is overwritten with the **Secure OS (Kinibi TEE)**.
5. An ABL parses the **APCB** (AMD PSP Customization Block) for system
   configuration.
6. An ABL **initializes main memory**, locates the compressed BIOS image in SPI
   ROM, **decompresses it into DRAM**, and writes the **APOB** to DRAM for the
   x86 side.
7. The PSP **releases the x86 processor from reset**; the x86 core begins
   execution at the reset vector.

On ChromeOS systems the off-chip bootloader first looks for a **vboot app** in
the RO BIOS Directory Table and verifies RW sections on the PSP itself.

## 3. The PSP firmware filesystem (SPI flash layout)

- AMD hides PSP firmware in an undocumented **"PSP firmware filesystem"** with a
  **Firmware Entry Table (FET)** at fixed offsets in the flash; the FET points
  to the PSP and BIOS directory tables (dayzerosec research).
- Entries may be **compressed (zlib), signed, and encrypted**.
- The PSP blobs live in **padding volumes that UEFITool cannot parse** — this is
  why PSPTool exists.

### Embedded Firmware Structure (from coreboot's PSP Integration Guide)

| Offset | Size | Field | Purpose |
|---|---|---|---|
| `0x00` | 4 | Signature | `0x55aa55aa` |
| `0x04` | 4 | IMC FW | Integrated Micro Controller FW (unsupported but functional on some systems) |
| `0x08` | 4 | GbE FW | Gigabit Ethernet firmware |
| `0x0c` | 4 | xHCI FW | USB xHCI firmware |
| `0x10` | 4 | PSP Dir Tbl | Pointer to PSP Directory Table (early devices) |
| `0x14` | 4 | PSP Dir Tbl | Pointer to PSP Directory Table (later, combo-capable devices) |
| `0x18` | 4 | BIOS Dir Tbl | Pointer to BIOS Directory Table (model n\*) |
| `0x1c` | 4 | BIOS Dir Tbl | Pointer (model nn) |
| `0x20` | 4 | BIOS Dir Tbl | Pointer (model nnn) |

### PSP Directory Table entry types

| Type | Meaning |
|---|---|
| `0x00` | **AMD public key** — used by on-chip bootcode to verify the PSP boot signature |
| `0x01` | **PSP boot loader firmware** — second-stage bootloader loaded by on-chip bootcode |
| `0x02` | **PSP SecureOS firmware** — overwrites the bootloader in SRAM during initial boot; may be omitted if Token Unlock debug is not required |

Every firmware binary carries a **256-byte PSP header** including the firmware
version. (Example from public research: on Picasso, `g_abl0_addr` is initialized
to `0x15000` and the ABL0 entry point sits at `0x15100`, right after the PSP
file header.)

### BIOS Directory Table entry fields

| Bits/Offset | Field | Meaning |
|---|---|---|
| `0x00` (8b) | Type | Entry type |
| `0x01` (8b) | Region Type | Security attribute of the memory region |
| `0x02[0]` | Reset Image | Entry is a reset binary image |
| `0x02[1]` | Copy Image | Image is copied to the memory region |
| `0x02[2]` | Read Only | Region set read-only |
| `0x02[3]` | Compressed | zlib-compressed |
| `0x02[7:4]` | Instance | Instance of the entry |
| `0x03[2:0]` | SubProgram | SubProgram selector |
| `0x03[4:3]` | RomId | Which SPI device holds the content |
| `0x03[5]` | Writeable | Region writable vs read-only |
| `0x04` (32b) | Size | Memory region size |
| `0x08` (62b) | Source Address | Physical SPI-ROM location of the data |
| `0x0F[7:6]` | Entry Address Mode | Address mode of the entry |
| `0x10` (64b) | Destination Address | Where the image is copied in memory |

## 4. The PSP cryptographic coprocessor (CCP)

- The PSP contains a **Cryptographic Coprocessor v5 (CCP)** supporting
  **SHA, RSA, AES, ECC, ZLIB, and a TRNG**.
- Used for **signature verification**, **firmware decompression**, and as a
  **DMA copy engine**.
- Public documentation: the **Linux kernel driver `drivers/crypto/ccp`**.
- No official AMD register documentation is public; the community emulator
  **PSPEmu** fills the gap for research.

## 5. Public tooling (the de-facto documentation)

| Tool | What it does | Where |
|---|---|---|
| **PSPTool** | Locates, parses, extracts, and manipulates PSP firmware inside UEFI/BIOS images (incl. combo images) | github.com/PSPReverse/PSPTool |
| **PSPEmu** | Emulator for PSP firmware research | github.com/PSPReverse/PSPEmu |
| **amdfwtool** | coreboot utility that builds `amdfw.rom` — correctly positioned headers, pointers, and structures | coreboot `util/amdfwtool` |
| **AMD-SP-Loader** | Binary Ninja loader plugin for AMD PSP/SP binaries | github.com/dayzerosec/AMD-SP-Loader |
| **amd/firmware_binaries** | AMD's public firmware binary repo (e.g. `AblPostCode.h.txt`) | github.com/amd/firmware_binaries |
| **AMD PSIRT bulletins** | Official security bulletins (AMD-SB-xxxx) for PSP/fTPM/SEV issues | amd.com (PSIRT) |

## 6. Why this matters for repair & education

- **Board repair:** a corrupted or mismatched PSP firmware region can brick an
  AMD board at a level below the OS — understanding the directory tables is how
  coreboot/firmware repair is done.
- **Firmware hacking:** coreboot ports on AMD require integrating PSP blobs
  correctly; the Integration Guide above is the working reference.
- **Security research:** the PSP is a full ARM computer running before and
  beneath the x86 OS — the public tooling above is how the community audits it.

## Sources (all public)

1. coreboot, *AMD Platform Security Processor (PSP) Firmware Integration Guide* —
   https://doc.coreboot.org/soc/amd/psp_integration.html
2. coreboot, *AMD Family 17h* — https://doc.coreboot.org/soc/amd/family17h.html
3. Buhren et al., *"All You Ever Wanted to Know About the AMD Platform Security
   Processor (And Were Afraid to Emulate)"*, Black Hat USA 2020 —
   https://i.blackhat.com/USA-20/Wednesday/us-20-Buhren-All-You-Ever-Wanted-To-Know-About-The-AMD-Platform-Security-Processor-And-Were-Afraid-To-Emulate.pdf
   *(preserved in `collected-public-docs/`)*
4. dayzerosec, *"Reversing the AMD Secure Processor (PSP) — Part 1: Design and
   Overview"* — https://dayzerosec.com/blog/2023/04/17/reversing-the-amd-secure-processor-psp.html
5. Christian Werling, PSPTool announcement (coreboot mailing list) —
   https://mail.coreboot.org/hyperkitty/list/coreboot@coreboot.org/thread/DPWWY657H4OZN3BYSXK7BAVQXPRREGVT/
6. ExtremeTech, "AMD's Secure Processor Firmware Is Now Explorable Thanks to New
   Tool" — https://www.extremetech.com/internet/292722-amds-secure-processor-firmware-is-now-explorable-thanks-to-new-tool
7. coreboot-gerrit, "Documentation/soc/amd: Add PSP integration information" —
   https://mail.coreboot.org/hyperkitty/list/coreboot-gerrit@coreboot.org/message/ASQHJZ3CJDKVCE6G2WF2NOP2WXMENMMR/
