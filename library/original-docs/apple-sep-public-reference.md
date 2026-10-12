# Apple Secure Enclave (SEP) — Public Reference Manual

> **ORIGINAL COMPILATION** — written for the Right-to-Repair Library from public
> sources. This is **not** Apple documentation; Apple publishes nothing about the
> SEP. Everything below is compiled from public security research, conference
> talks, and Apple's own open-source releases, cited at the bottom.
> Suggested license: CC BY-SA 4.0.

---

## 1. What the SEP is

- A **security coprocessor** inside Apple SoCs, introduced with the **iPhone 5s
  (A7, 2013)** alongside Touch ID and the M7 motion coprocessor.
- It performs secure services for the rest of the system — biometric (Touch ID /
  Face ID) data, cryptographic keys, Apple Pay credentials — and is designed so
  the main application processor (AP) **cannot directly access** that sensitive
  data.
- Present in all iPhones and iPads since, and in Macs with the **T1 / T2** chips.
  The **T2's SEP is derived from the A10 design (ARM Cortex-A7, 32-bit)**.
- Each SEP is fused to a **device-unique key (UID)**; data sealed by the SEP is
  tied to that physical chip. **Repair implication:** SEP/SoC-level secrets do not
  survive board swaps — this is why Touch ID/Face ID pairings are lost when the
  logic board is replaced.

## 2. SEPOS — the SEP's operating system

- The SEP runs its own OS, **SEPOS**, with its own kernel, drivers, services, and
  applications (per Mandt, Black Hat 2016).
- Public research found **no ASLR and no stack canaries** in SEPOS — standard
  hardening is absent, reportedly due to resource constraints.
- The SEP has dedicated I/O lines to some off-chip peripherals (GPIO, UART, I2C)
  and shares others with the AP — notably the **Power Manager (PMGR)**, where
  **security fuse settings** live, and the memory controller.

## 3. Talking to the SEP: the Secure Mailbox

The **only** communication channel between AP and SEP is a **secure mailbox**:
an inbox (AP → SEP requests) and an outbox (SEP → AP replies), implemented as
**SEP device I/O registers** (the "SEP configuration space") with a doorbell
mechanism for signaling.

Host-side software stack (from Apple's public XNU sources):

| Component | Role |
|---|---|
| `AppleA7IOP.kext` | Low-level IOP driver; `AppleA7IOP::postMailbox()` / `getMailbox()`; maps the mailbox I/O registers (`AppleA7IOPV2` register set) |
| `AppleSEPManager.kext` | Generic framework; drivers register **SEP endpoints** (`AppleSEPEndpoint` objects), each an index into a specific SEP app/service |
| `seputil` (`/usr/libexec/seputil`) | Userland IMG4 parser with rich symbols; used by researchers to deduce SEP behavior |

### Mailbox register map (A7-era; from the MOSEC 2020 research)

| Base | Address |
|---|---|
| AP view | `0x2_0DA0_4000` |
| SEP view | VA `0xCDA0_0B80` (PA `0x2_0DA0_0B80`) |

| Offset | Size | Register | Meaning |
|---|---|---|---|
| `0x0`  | 4 B | Disable interrupt | Mask all interrupts at start (IN/OUT Empty/Nonempty) |
| `0x4`  | 4 B | Enable interrupt | Enable OUT Nonempty (receiving) / IN Empty (sending) |
| `0x8`  | 4 B | Inbox status | Enable / Full / Empty / Overflow / Underflow |
| `0x10` | 8 B | Inbox value | AP writes the request message here |
| `0x18` | 8 B | Outbox value | SEP writes the reply here |
| `0x20` | 4 B | Outbox status | Reply-side status flags |

⚠️ These addresses are **SoC-generation-specific** — the MOSEC 2020 slides include
a correspondence table because TZ0-related register addresses differ between
generations. Treat the table above as the A7–A11 reference map, not a universal one.

## 4. Boot flow and memory isolation

1. At boot, the AP sends a **"Boot TZ0"** mailbox message to allocate external
   RAM for the SEP.
2. The AP programs the **TZ0 registers (Base / End / Lock)** — this defines the
   SEP's memory range. The **AMCC** (memory controller) is then used to prohibit
   the AP from accessing the TZ0 region: this is the **memory isolation**
   mechanism.
   - The exact TZ0 register addresses differ per SoC generation (see the
     correspondence table in the MOSEC 2020 slides).
3. The SEP has **4096 bytes of RAM**; the mailbox and the shared memory used for
   power management and interrupt signaling are accessible from AP space.
4. SEP and AP load **separate IMG4 images** (SEPOS for the SEP space, the normal
   OS for the AP space). SEPOS creates an **AES key** to access its encrypted
   memory space and completes startup.
5. Per the MOSEC 2020 research, the region **`0x8_00BF_0000`–`0x8_00BF_F000`**
   is **not encrypted** even in SEP space.

## 5. IMG4 — the SEP's firmware container

- SEP firmware/apps are distributed as **IMG4** files, an ASN.1-based format.
- Research (Mandt 2016) showed the SEP's IMG4 parser is built from **libDER**
  (ASN.1 decoder) and **CoreCrypto** (RSA) — **both of which Apple releases as
  open source**, giving researchers a solid base for parsing SEP images.

## 6. Public research & known vulnerabilities (educational summary)

| Research | What it showed |
|---|---|
| **checkm8** (axi0mX, 2019) | Unpatchable **AP BootROM** exploit, iPhone X / A11 and older. Enables arbitrary code in DFU mode. Repo: `github.com/axi0mX/ipwndfu`. Does **not** by itself control the SEP. |
| **checkra1n** | Tethered jailbreak built on checkm8. |
| **"blackbird"** (Team Pangu / windknown, MOSEC 2020) | Unpatchable **SEP** bug. Chained with checkm8: the TZ0 start address is offset by `0x10_0000` to break AP/SEP memory isolation; the SEP-ROM AES key is extracted from the unencrypted `0x8_00BF_…` window; a cache race between AP and SEP extracts the SEPOS AES key. Affects **A7–A11** (patched in A12/A13 SEP); the **T2 SEP is also vulnerable**. Requires **physical access + DFU mode**; TZ0 is locked after boot so app/browser exploits can't use it; iOS 14 added partial mitigations. |

## 7. Why this matters for repair

- SEP faults manifest as **Touch ID / Face ID / Apple Pay failures** that
  software cannot fix — the SEP is a separate, fused, non-replaceable security
  core.
- Understanding the mailbox/TZ0 model explains *why* SEP data is bound to the
  physical chip, and why "swap the board" repairs lose biometric pairing.
- For data recovery on checkm8-vulnerable devices, the public research above
  documents what is technically possible (and what Apple has patched since).

## Sources (all public)

1. Tarjei Mandt, *"Demystifying the Secure Enclave Processor"*, Black Hat USA 2016 —
   https://blackhat.com/docs/us-16/materials/us-16-Mandt-Demystifying-The-Secure-Enclave-Processor.pdf
   *(preserved in `collected-public-docs/`)*
2. Team Pangu (windknown/Xu Hao), *"Attack Secure Boot of SEP"*, MOSEC 2020 —
   https://github.com/windknown/presentations/blob/master/Attack_Secure_Boot_of_SEP.pdf
   *(preserved in `collected-public-docs/`)*
3. GIGAZINE, "How was the security chip 'Secure Enclave' broken through?" (2020) —
   https://gigazine.net/gsc_news/en/20200814-apple-sep-attack/
4. Yalu Jailbreak, "Team Pangu demonstrates unpatchable SEP vulnerability at MOSEC" —
   https://yalujailbreak.net/pangu-unpatchable-sep-bug/
5. The Apple Wiki, T2 (T8012) — https://theapplewiki.com/wiki/T8012
6. checkm8 / ipwndfu — https://github.com/axi0mX/ipwndfu
7. Apple open-source XNU (AppleA7IOP / AppleSEPManager kexts), libDER, CoreCrypto —
   https://opensource.apple.com
