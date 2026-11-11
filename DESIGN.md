# Chair Control — Design (v1)

BareBoard's original PMD owner-control software. Files: `pmd-control.html`,
`pmd-control.js`, `pmd-control.css`. A web app: it runs from the phone's
browser, installs nothing, and talks to the chair through one cheap adapter.
Written from bareboard.org's own published research and public manufacturer
documentation. It is **not** a copy of any dealer tool (R-net PC Programmer,
LiNX Access, Curtis 1313/1314 software) and contains no manufacturer code.

## Why

The PMD section's findings (`/pmd.html`): a chair's settings, fault logs, and
configuration live behind dealer-only tools, and a module swap silently takes
the owner's clinical fit with it — with no backup ever offered to the owner.
Chair Control is the owner-side answer: read everything, back it up, and —
only where the write path is proven — change it.

## Architecture

Three layers, strictly separated. Each layer only talks to the one below it.

```
UI (pmd-control.html/.js app section)
  screens: Connect · Bus monitor · Fault codes · Settings · How to connect
        |
Driver (one per platform)
  RNetDriver (full) · VR2 / LiNX / Curtis (stub interfaces + notes)
        |
Transport (one per wire)
  SimulatorTransport · WebSerialSlcanTransport · Bluetooth (stub) · WebUSB (stub)
```

### Transport interface

```js
{ id, label, isSimulator,
  open(): Promise<void>, close(): Promise<void>,
  send(frame): Promise<void>, onFrame(cb) }
// frame = { id: number, data: Uint8Array }  — a raw CAN frame
```

- **SimulatorTransport** — a virtual R-net bus and chair in the page. It
  streams presence/joystick/battery frames, answers configuration reads and
  writes, performs the modelled XOR handshake, and raises trips on request.
  Because the simulator speaks the same frame model as the driver, the full
  production driver path is what runs in practice mode.
- **WebSerialSlcanTransport** — real. CANable-class USB-CAN adapters speak
  SLCAN (Lawicel text protocol) over Web Serial: `C` close, `S4` = 125 kbit/s,
  `O` open, `t` frames. No driver or install; Chrome on Android/desktop.
- **BluetoothBridgeTransport / WebUsbGsUsbTransport** — honest stubs. BLE
  bridges each use a vendor GATT service (no standard profile exists), and
  gs_usb needs a full in-browser USB driver. Both refuse with a plain
  explanation instead of faking a connection.

### Driver interface

```js
{ id, displayName, capabilities: { monitor, readFaults, readParams, writeParams },
  attach(transport), detach(),
  onDecoded(frame, {text, trip?}), onActiveFaults(faults),
  readFaults(): Promise<[{system, code, module}]>,
  readParameters(): Promise<{paramId: value}>,
  writeParameter(param, value): Promise<void> }
```

`writeParams` is resolved at `attach()`: **true only when the transport is
the simulator.** This is a code-level line, not a UI preference.

### Frame model (project decode model, v1)

Proven on the site and used as-is: standard CAN at **125 kbps**, no
encryption; configuration moves as **data objects, each with a checksum**
(16 objects were read in captured dealer sessions); the only authentication
is R-net's **XOR serial handshake**; trips are **(module, 4-digit code)**.

Working IDs chosen to carry exactly those facts — presence `0x100+module`,
joystick `0x180`, battery `0x1A0`, trip `0x200`, config read `0x300`,
config data `0x380`, config write `0x3C0`, auth `0x3E0`. Documented
parameters map to objects 0–13; object 14 is the chair serial, 15 the
profile marker. **The exact on-wire IDs are not yet bench-confirmed** — the
site's first live bench session is pending hardware (`/pmd-reading.html`) —
so in v1 a real chair is only ever listened to, and the simulator is where
the write path lives.

### Fault decoding

Tables are transcribed from `/pmd-fault-codes.html`, which was compiled line
by line from the manufacturers' manuals (R-net Technical Manual SK77981-14,
PP1A Programmer Guide SK73747, PG Drives VR2 technical manual, Dynamic
Controls LiNX manuals). One source of truth: if a code is not in the table,
the UI says so instead of inventing a meaning. VR2/LiNX owners use the same
tables through the manual lookup (count flashes/bars, tap the number) —
which is how those chairs actually report.

### Parameters

The documented R-net drive/seating set from `/pmd-settings.html` (ranges per
Curtiss-Wright's On-Board Programming manual SK78571/3 and the R-NET
Technical Manual): forward speed/accel/decel (max/min), turn
speed/accel/decel, tremor dampening, torque, sleep timer, seating actuator
accel/decel. Actuator accel/decel are **hard-locked at 100%** in the UI and
driver, carrying the manufacturer's own warning verbatim ("Automatic endstop
can only be used with actuator Acceleration and Deceleration values of
100%." — R-NET Technical Manual, "Endstop Autodetect").

## Safety model

1. **Read-only by default.** Connecting never enables writes. Reading is
   always allowed — it is the owner's chair and the owner's data.
2. **Backup before write, no exceptions.** Unlocking first reads every
   parameter and stores a timestamped backup (memory + localStorage +
   downloadable JSON). If the backup cannot be made, writes stay locked.
   Every write additionally checks a backup exists.
3. **Range validation twice** — in the UI and again in the driver — against
   the manufacturer's documented ranges. Out-of-range values are rejected
   with a plain explanation; nothing is sent.
4. **Checksum-verified writes.** A write is only reported as done when the
   chair echoes the object back with a valid checksum and the same value.
5. **One-tap restore.** Restore writes back every backed-up value and
   re-reads to confirm.
6. **Hardware writes are off in v1.** The site's honest-limits standard:
   reading captured sessions is proven; writing to a live power module via
   an owner adapter is not yet proven, and configuration-file offsets are
   known NOT to map naively onto bus objects. So `writeParameter` throws on
   real transports. When bench proof lands, enabling hardware writes is a
   one-line change in `attach()` plus a bench report — not a rewrite.
7. **Physical safety copy** from the site heads the app: chair off, level
   ground, not seated, battery disconnected for any plug work; isolated
   (≥2500V) adapters only, because the bus cable carries 24V battery power
   on the same connector as data.

## Platform roadmap

- **v1 (this build):** framework; R-net driver (monitor, faults, parameter
  read; writes in simulation); full simulator; VR2 + LiNX fault lookup;
  Curtis notes.
- **v2:** R-net live bench session — confirm transceiver compatibility with
  the bus's fault-tolerant CAN and the frame IDs on a real power module;
  only then, hardware parameter backup (read) for owners; gs_usb WebUSB
  transport; LiNX passive-listening driver research.
- **v3:** hardware writes if — and only if — the bench proves the exact
  write/restore sequence end-to-end (the site's standard, not negotiable);
  VR2 listening driver; Curtis driver once its parameter map is documented
  from public manuals; BLE bridge support per vendor profile.
- **Never:** key/dongle circumvention for LiNX Access or any dealer tier
  escalation. The tool does what is publicly documented, for the owner, on
  the owner's chair.

## Verification

`run-pmd-control-test.mjs` (kept with the runtime tests) drives the page in
jsdom against the simulator: connect, monitor stream decodes, fault
injection decodes to the exact published table text, parameter read,
locked-write refusal, out-of-range refusal, actuator-lock refusal,
backup → write → restore round-trip. All checks must pass.
