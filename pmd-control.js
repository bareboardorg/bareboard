/* ============================================================================
   BareBoard Chair Control — the PMD owner tool (version 1)
   ----------------------------------------------------------------------------
   ORIGINAL software, written for bareboard.org from the site's own published
   research and the manufacturers' PUBLIC documentation. It is not a copy of
   any dealer tool (not the R-net PC Programmer, not LiNX Access, not the
   Curtis 1313/1314 handset software) and contains no manufacturer code.

   Sources for every protocol fact used below are cited inline:
     [PMD]    /pmd.html            — findings: bus is standard CAN, no
                                    encryption; only auth is R-net's XOR
                                    serial handshake; configuration moves as
                                    data objects, each with a checksum.
     [READ]   /pmd-reading.html    — captured dealer sessions ran at 125 kbps;
                                    16 configuration objects read off the bus;
                                    write/restore path NOT yet proven on a
                                    live power module; isolated adapter rule.
     [FAULT]  /pmd-fault-codes.html — fault tables, compiled from PG Drives
                                    VR2 + R-net technical manuals (R-net
                                    Technical Manual SK77981-14; PP1A Guide
                                    SK73747) and Dynamic Controls LiNX manuals.
     [SET]    /pmd-settings.html   — parameter list + ranges from Curtiss-
                                    Wright R-net programming documentation
                                    (On-Board Programming manual SK78571/3
                                    and the R-NET Technical Manual).

   HONEST LIMITS (mirrors [PMD] "Honest limits"):
   Reading is proven. The live WRITE path is not yet proven on a bench power
   module, so in v1 writes are enabled ONLY against the simulator. On real
   hardware transports this build is read-only and says so in the UI.
   ========================================================================= */
'use strict';

/* ---------------------------------------------------------------------------
   FAULT TABLES — transcribed from [FAULT]. Do not edit without re-checking
   the page (and behind it, the manufacturers' manuals).
   ------------------------------------------------------------------------- */
const FAULT_TABLES = {
  vr2: {
    label: 'Curtiss-Wright VR2 / VSI — flashing bars',
    entries: {
      '1':  { title: 'Low battery voltage', check: 'Charge the batteries overnight. Check the main battery plugs and the circuit breaker/fuse. If it keeps happening, load-test each 12V battery for a dead cell.' },
      '2':  { title: 'Left motor disconnected', check: 'The controller cannot see the left drive motor. Check the heavy motor plug at the power module, look for a pinched or cut cable under the seat, and check the motor brushes.' },
      '3':  { title: 'Left motor wiring trip (short)', check: 'A left motor wire is shorting to battery power. Inspect the cable where it passes frame hinges. Unplug the left motor: if the fault clears, the short is in the motor or its cable.' },
      '4':  { title: 'Right motor disconnected', check: 'Same checks as 2 bars, on the right motor: plug, cable, brushes.' },
      '5':  { title: 'Right motor wiring trip (short)', check: 'Same checks as 3 bars, on the right motor cable.' },
      '6':  { title: 'Inhibit active (charger connected)', check: 'The chair thinks it must not drive — usually because the charger is plugged in. Unplug the charger. If it is already unplugged, check the charger socket for a bent pin or dirt, and check for a stuck seating lockout switch.' },
      '7':  { title: 'Joystick fault at power-up', check: 'Usually your own hand: something was resting on the joystick when you switched on. Switch off, take everything off the stick, let it center, switch on without touching it.' },
      '7+S': { title: 'Bus communication fault', check: 'The joystick and the power module lost contact. Unplug the round bus cable between them, check the pins for corrosion or bends, and plug it firmly back in.' },
      '8':  { title: 'Control system / power module trip', check: 'The power module failed its own self-check. Check every heavy power and bus connection, switch off for 30 seconds, and try again. If it persists, the fault is inside the power module.' },
      '8+A': { title: 'Actuator / seating trip', check: 'A fault in a power seating actuator (tilt, recline, elevate, legrest). Inspect the 2-pin actuator plugs; unplug actuators one at a time to find the bad one.' },
      '9':  { title: 'Parking brake fault', check: 'The most owner-fixable code in the table. One or both freewheel levers are in the PUSH position, or a brake plug is loose. Flip both levers firmly to DRIVE and power-cycle.' },
      '10': { title: 'High battery voltage', check: 'Too much voltage reached the controller — a faulty charger, or loose battery terminals spiking on a downhill. Tighten the terminal bolts and check battery health.' }
    }
  },
  rnet: {
    label: 'Curtiss-Wright R-net — screen codes',
    entries: {
      '1505': { module: 'PM', title: 'Parking brake error (Motor 1 brake)', check: 'Check both freewheel levers are in DRIVE; inspect the small 2-pin brake wires at the back of each motor.' },
      '1506': { module: 'PM', title: 'Parking brake error (Motor 2 brake)', check: 'Check both freewheel levers are in DRIVE; inspect the small 2-pin brake wires at the back of each motor.' },
      '1D05': { module: 'JSM', title: 'Joystick stationary time exceeded', check: 'The joystick was held in one position too long. Power-cycle the chair — this code clears on restart. If it returns at once, check that the stick springs back freely to center.' },
      '2C00': { module: 'PM', title: 'Low battery voltage', check: 'Charge; check the main disconnect plug and terminal bolts for looseness or corrosion.' },
      '2F00': { module: 'JSM', title: 'Joystick deflected at power-up', check: 'The stick was pushed during boot. Center it; if it will not clear, power off and on, hands free.' },
      '3B00': { module: 'PM', title: 'Motor 1 disconnected', check: 'Check the Motor 1 plug at the power module, and the motor brushes. (R-net names motors 1 and 2 — which side of the chair each is on depends on setup; identify by the plug, not the side.)' },
      '3C00': { module: 'PM', title: 'Motor 2 disconnected', check: 'Check the Motor 2 plug at the power module, and the motor brushes.' },
      '3D00': { module: 'PM', title: 'Motor 1 short circuit', check: 'Short in the Motor 1 cable or winding. Inspect the cable run.' },
      '3D01': { module: 'PM', title: 'Motor 1 short circuit', check: 'Short in the Motor 1 cable or winding. Inspect the cable run.' },
      '3E00': { module: 'PM', title: 'Motor 2 short circuit', check: 'Short in the Motor 2 cable or winding. Inspect the cable run.' },
      '3E01': { module: 'PM', title: 'Motor 2 short circuit', check: 'Short in the Motor 2 cable or winding. Inspect the cable run.' },
      '4401': { module: 'PM', title: 'Internal controller trip', check: 'Power-cycle after 30 seconds off. If it persists, the power module needs replacement.' },
      'OVERCURRENT': { module: 'PM / ISM', title: 'Actuator channel over-current (trip text: Over-current)', check: 'Unplug seating actuators one by one to isolate the shorted cable.' }
    }
  },
  linx: {
    label: 'Dynamic Controls LiNX — red flashes',
    entries: {
      'RIPPLE': { title: 'Out of neutral at power-up', check: 'The joystick was held off-center at switch-on. Let it center — the fault clears by itself.' },
      '1': { title: 'Remote / joystick error', check: 'Check the bus cable into the joystick: unplug, inspect the pins, reconnect.' },
      '2': { title: 'Network or configuration error', check: 'Check every bus plug; charge the batteries (low voltage below cut-off triggers this too). A replacement module fitted without configuration also causes it.' },
      '3': { title: 'Left motor fault', check: 'Open or short circuit on the left motor, its cable, or its connector.' },
      '4': { title: 'Right motor fault', check: 'Open or short circuit on the right motor, its cable, or its connector.' },
      '5': { title: 'Left park brake fault', check: 'Left brake open/short — or the left freewheel lever is in push mode. Flip it to DRIVE; check the 2-pin brake plug.' },
      '6': { title: 'Right park brake fault', check: 'Right brake open/short — or the right freewheel lever is in push mode. Flip it to DRIVE; check the 2-pin brake plug.' },
      '7': { title: 'Module error', check: 'Includes: chair stalled against an obstacle (reverse away, cycle power), or the chair was pushed while switched off (cycle power to clear), or a power module fault.' }
    }
  }
};

/* ---------------------------------------------------------------------------
   PARAMETERS — from [SET] (R-net On-Board Programming SK78571/3 ranges).
   `obj` is the configuration-object index in the project's decode model:
   [READ] records 16 configuration objects read off the bus; v1 maps the
   documented drive/seating parameters onto objects 0–13, object 14 holds
   the chair serial (used by the XOR handshake [PMD]), object 15 is the
   profile marker. Defaults below are the SIMULATOR's factory values.
   ------------------------------------------------------------------------- */
const ACTUATOR_WARNING = 'Automatic endstop can only be used with actuator Acceleration and Deceleration values of 100%.';
const ACTUATOR_WARNING_SOURCE = 'Curtiss-Wright R-NET Technical Manual, “Endstop Autodetect” — quoted on /pmd-settings.html';

const PARAMETERS = [
  { id: 'fwdSpeedMax', obj: 0, name: 'Top speed — fastest setting', min: 0, max: 100, unit: '%', def: 80,
    does: 'How fast the chair goes at the top speed setting.', wrong: 'After a factory reset, top speed can come back clamped too slow for a crosswalk — or too fast for a hallway.' },
  { id: 'fwdSpeedMin', obj: 1, name: 'Top speed — slowest setting', min: 0, max: 100, unit: '%', def: 20,
    does: 'How fast the chair goes at the lowest speed setting. The settings in between are spread evenly between slowest and fastest.', wrong: 'Set wrong, the slowest setting is still too fast for careful indoor driving.' },
  { id: 'fwdAccelMax', obj: 2, name: 'Acceleration — fastest setting', min: 0, max: 100, unit: '%', def: 60,
    does: 'How hard the chair launches when you push the stick. Higher = harder launch.', wrong: 'Too high: the launch snaps your head back. Too low: the chair feels sluggish and cannot climb a door threshold from a stop.' },
  { id: 'fwdAccelMin', obj: 3, name: 'Acceleration — slowest setting', min: 0, max: 100, unit: '%', def: 30,
    does: 'How gently the chair launches at the lowest speed setting.', wrong: 'Too high for a rider with poor trunk control: every start is a jolt.' },
  { id: 'fwdDecelMax', obj: 4, name: 'Deceleration — fastest setting', min: 0, max: 100, unit: '%', def: 70,
    does: 'How hard the chair brakes when you let the stick go. Higher = shorter stop.', wrong: 'Too high: letting go pitches you forward. Too low: the chair coasts into walls — or traffic.' },
  { id: 'fwdDecelMin', obj: 5, name: 'Deceleration — slowest setting', min: 0, max: 100, unit: '%', def: 35,
    does: 'How gently the chair stops at the lowest speed setting.', wrong: 'Too low: rolling stops at exactly the speeds used near people and furniture.' },
  { id: 'turnSpeed', obj: 6, name: 'Turn speed', min: 0, max: 100, unit: '%', def: 45,
    does: 'How fast the chair turns.', wrong: 'Too high on a mid-wheel-drive chair: violent spinning and caster strikes.' },
  { id: 'turnAccel', obj: 7, name: 'Turn acceleration', min: 0, max: 100, unit: '%', def: 50,
    does: 'How sharply the chair ramps into a turn.', wrong: 'Too high: the chair yaws before you expect it. Too low: turns feel delayed and wallowing.' },
  { id: 'turnDecel', obj: 8, name: 'Turn deceleration', min: 0, max: 100, unit: '%', def: 55,
    does: 'How sharply the chair ramps out of a turn.', wrong: 'Too low: the chair keeps rotating after you center the stick.' },
  { id: 'tremorDampening', obj: 9, name: 'Tremor dampening', min: 0, max: 100, unit: '%', def: 25,
    does: 'A filter that smooths out high-frequency hand tremor and spasm so the chair follows your intended push, not your shaking.', wrong: 'Critical on a module swap: if a swapped module comes back at 0%, a rider with tremor gets a chair that bucks with every shake. Heavy dampening also increases stopping distance — it is a balance, not a maximum.' },
  { id: 'torque', obj: 10, name: 'Torque (low-speed power)', min: 0, max: 100, unit: '%', def: 65,
    does: 'Extra power at low speed, for climbing ramps, door thresholds, and thick carpet.', wrong: 'Too low: the chair stalls on a one-inch threshold. A reset that loses it strands you at a curb cut.' },
  { id: 'sleepTimer', obj: 11, name: 'Sleep timer', min: 0, max: 30, unit: ' min', def: 10,
    does: 'How long the chair sits idle before it powers itself down. 0 = never sleeps.', wrong: 'At 0 (off), the battery drains overnight. Too short, and a switch or sip-and-puff user gets locked out mid-rest.' },
  { id: 'actuatorAccel', obj: 12, name: 'Seating actuator acceleration', min: 0, max: 100, unit: '%', def: 100, locked: true,
    does: 'How fast power tilt, recline, elevate, and legrests start moving.', wrong: 'On systems with automatic current-sensing endstops this MUST stay at 100% — see the manufacturer warning below.', warn: ACTUATOR_WARNING, warnSource: ACTUATOR_WARNING_SOURCE },
  { id: 'actuatorDecel', obj: 13, name: 'Seating actuator deceleration', min: 0, max: 100, unit: '%', def: 100, locked: true,
    does: 'How fast power tilt, recline, elevate, and legrests stop moving.', wrong: 'On systems with automatic current-sensing endstops this MUST stay at 100% — see the manufacturer warning below.', warn: ACTUATOR_WARNING, warnSource: ACTUATOR_WARNING_SOURCE }
];
const PARAM_BY_ID = Object.fromEntries(PARAMETERS.map(p => [p.id, p]));

/* ===========================================================================
   FRAME MODEL — the project's decode model, v1.
   What the site has PROVEN [PMD][READ]: the bus is standard CAN at 125 kbps
   with no encryption; configuration moves as data objects, each protected by
   a checksum; module authentication is an XOR serial handshake; trips are
   reported as (module, 4-digit code) per [FAULT].
   What is NOT yet bench-confirmed: the exact on-wire frame IDs below. They
   are the project's working decode model, chosen to carry exactly the proven
   facts and nothing more. DESIGN.md records this split. The simulator speaks
   this model; a real chair is only ever LISTENED to in v1.
   ========================================================================= */
const BUS = {
  BITRATE: 125000, // [READ]: captured dealer-tool sessions ran at 125 kbps
  ID: {
    PRESENCE: 0x100,  // + module index (0=PM, 1=JSM, 2=ISM): module alive
    JOYSTICK: 0x180,  // data[0]=X %, data[1]=Y % (signed)
    BATTERY:  0x1A0,  // data[0..1]=volts x10 LE, data[2]=charge %
    TRIP:     0x200,  // data[0]=module, data[1..2]=code BE, data[3]=1 active/0 cleared
    CFG_READ: 0x300,  // data[0]=object index
    CFG_DATA: 0x380,  // data[0]=index, data[1..n-2]=payload, data[n-1]=XOR checksum
    CFG_WRITE: 0x3C0, // same layout as CFG_DATA. Simulator-only in v1.
    AUTH:     0x3E0   // XOR serial handshake exchange [PMD]
  },
  MODULES: ['Power module (PM)', 'Joystick module (JSM)', 'Seating module (ISM)'],
  MODULE_SHORT: ['PM', 'JSM', 'ISM']
};
function xorChecksum(bytes) { let c = 0; for (const b of bytes) c ^= b; return c & 0xFF; }
function frameHex(f) {
  const id = f.id.toString(16).toUpperCase().padStart(3, '0');
  const data = Array.from(f.data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  return 'CAN ' + id + '  [' + f.data.length + '] ' + data;
}

/* ===========================================================================
   TRANSPORTS — one interface: { id, label, isSimulator, open(), close(),
   send(frame), onFrame(cb), onState(cb) }. A transport moves raw CAN frames;
   it knows nothing about chairs.
   ========================================================================= */

/* --- The simulator: a virtual R-net bus + virtual chair -------------------
   A software chair that answers config reads/writes, streams presence,
   joystick and battery frames, and raises trips on request. It speaks the
   frame model above so the REAL R-net driver code path is what gets used. */
class SimulatorTransport {
  constructor() {
    this.id = 'simulator'; this.label = 'Practice chair (built-in)'; this.isSimulator = true;
    this._frameCbs = []; this._timers = [];
    // The virtual chair's configuration objects (16 per [READ]).
    this.objects = new Array(16).fill(0);
    for (const p of PARAMETERS) this.objects[p.obj] = p.def;
    this.serial = 'SIM0001'; // object 14 in a real chair; handshake material [PMD]
    this.faults = new Set(); // active R-net trip codes
    this.batteryVolts = 25.2; this.charge = 87;
  }
  onFrame(cb) { this._frameCbs.push(cb); }
  _emit(f) { for (const cb of this._frameCbs) cb(f); }
  async open() {
    let mod = 0;
    this._timers.push(setInterval(() => { // presence, one module at a time
      this._emit({ id: BUS.ID.PRESENCE + mod, data: Uint8Array.of(1) });
      mod = (mod + 1) % 3;
    }, 900));
    this._timers.push(setInterval(() => { // joystick resting near center
      const x = Math.round(Math.sin(Date.now() / 4000) * 4);
      this._emit({ id: BUS.ID.JOYSTICK, data: Uint8Array.of(x & 0xFF, 0) });
    }, 1300));
    this._timers.push(setInterval(() => { // battery slowly breathing
      this.batteryVolts = Math.max(23.8, Math.min(25.6, this.batteryVolts + (Math.random() - 0.5) * 0.1));
      const v10 = Math.round(this.batteryVolts * 10);
      this._emit({ id: BUS.ID.BATTERY, data: Uint8Array.of(v10 & 0xFF, (v10 >> 8) & 0xFF, this.charge) });
    }, 2000));
    // Announce any pre-set faults shortly after connect.
    setTimeout(() => { for (const code of this.faults) this._emitTrip(code, 1); }, 350);
  }
  async close() { this._timers.forEach(clearInterval); this._timers = []; }
  _emitTrip(code, active) {
    const v = parseInt(code, 16);
    const modIdx = code === '1D05' || code === '2F00' ? 1 : 0; // JSM faults per [FAULT]
    this._emit({ id: BUS.ID.TRIP, data: Uint8Array.of(modIdx, (v >> 8) & 0xFF, v & 0xFF, active) });
  }
  injectFault(code) {
    if (code === 'clear') {
      for (const c of this.faults) this._emitTrip(c, 0);
      this.faults.clear(); return;
    }
    this.faults.add(code); this._emitTrip(code, 1);
  }
  async send(f) {
    if (f.id === BUS.ID.CFG_READ) {
      const idx = f.data[0];
      const payload = idx === 14
        ? Array.from(new TextEncoder().encode(this.serial))
        : [this.objects[idx] & 0xFF, (this.objects[idx] >> 8) & 0xFF];
      const body = [idx, ...payload];
      setTimeout(() => this._emit({ id: BUS.ID.CFG_DATA, data: Uint8Array.of(...body, xorChecksum(body)) }), 30);
    } else if (f.id === BUS.ID.CFG_WRITE) {
      const body = Array.from(f.data.slice(0, -1)); const cks = f.data[f.data.length - 1];
      if (xorChecksum(body) !== cks) return; // bad checksum: chair ignores it (that's the point of the checksum [PMD])
      const idx = body[0];
      if (idx < 14) this.objects[idx] = body[1] | (body[2] << 8);
      setTimeout(() => this._emit({ id: BUS.ID.CFG_DATA, data: Uint8Array.of(...body, cks) }), 30);
    } else if (f.id === BUS.ID.AUTH) {
      // XOR serial handshake [PMD]: the module answers the challenge XORed
      // with its serial bytes. Modelled, not quoted — the site documents the
      // mechanism (a simple fixed XOR check), not a byte transcript.
      const resp = Array.from(f.data).map((b, i) => b ^ this.serial.charCodeAt(i % this.serial.length));
      setTimeout(() => this._emit({ id: BUS.ID.AUTH, data: Uint8Array.of(...resp) }), 30);
    }
  }
}

/* --- Web Serial + SLCAN (CANable-class adapters) --------------------------
   Real implementation. SLCAN is the Lawicel text protocol spoken by
   CANable and many USB-CAN adapters: 'O' opens the channel, 'S4' selects
   125 kbit/s, 't' frames carry data. Chrome exposes the port via Web Serial
   (navigator.serial) — no driver, no install. The adapter MUST be a
   galvanically isolated model: see /pmd-reading.html and the help panel. */
class WebSerialSlcanTransport {
  constructor() {
    this.id = 'serial'; this.label = 'USB CAN adapter (Web Serial)'; this.isSimulator = false;
    this._frameCbs = []; this._port = null; this._writer = null; this._reader = null; this._reading = false;
  }
  onFrame(cb) { this._frameCbs.push(cb); }
  _emit(f) { for (const cb of this._frameCbs) cb(f); }
  async open() {
    if (!('serial' in navigator)) throw new Error('This browser cannot use USB adapters (Web Serial is missing). Use Chrome on Android or a computer.');
    this._port = await navigator.serial.requestPort();
    await this._port.open({ baudRate: 115200 }); // SLCAN adapters' default USB-serial rate
    this._writer = this._port.writable.getWriter();
    this._reader = this._port.readable.getReader();
    await this._cmd('C');  // close channel if it was left open
    await this._cmd('S4'); // S4 = 125 kbit/s, the chair bus speed [READ]
    await this._cmd('O');  // open the CAN channel
    this._reading = true;
    this._readLoop();
  }
  async _cmd(s) { await this._writer.write(new TextEncoder().encode(s + '\r')); }
  async _readLoop() {
    const dec = new TextDecoder(); let buf = '';
    while (this._reading) {
      const { value, done } = await this._reader.read();
      if (done) break;
      buf += dec.decode(value);
      let i;
      while ((i = buf.indexOf('\r')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        const f = this._parseLine(line);
        if (f) this._emit(f);
      }
    }
  }
  _parseLine(line) {
    if (!line || (line[0] !== 't' && line[0] !== 'T')) return null;
    const ext = line[0] === 'T';
    const idLen = ext ? 8 : 3;
    const id = parseInt(line.slice(1, 1 + idLen), 16);
    const len = parseInt(line[1 + idLen], 16);
    const hex = line.slice(2 + idLen, 2 + idLen + len * 2);
    const data = new Uint8Array(len);
    for (let i = 0; i < len; i++) data[i] = parseInt(hex.substr(i * 2, 2), 16);
    return { id, data };
  }
  async send(f) {
    const id = f.id.toString(16).toUpperCase().padStart(3, '0');
    const data = Array.from(f.data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
    await this._cmd('t' + id + f.data.length.toString(16).toUpperCase() + data);
  }
  async close() {
    this._reading = false;
    try { await this._cmd('C'); } catch (e) { /* already gone */ }
    try { this._reader && await this._reader.cancel(); } catch (e) {}
    try { this._writer && this._writer.releaseLock(); } catch (e) {}
    try { this._port && await this._port.close(); } catch (e) {}
  }
}

/* --- Bluetooth bridge transport: honest stub ------------------------------
   BLE CAN bridges each expose their own vendor GATT service; there is no
   standard profile to code against. v1 refuses cleanly rather than faking
   a pairing. (Roadmap: DESIGN.md.) */
class BluetoothBridgeTransport {
  constructor() { this.id = 'bluetooth'; this.label = 'Bluetooth CAN bridge'; this.isSimulator = false; }
  onFrame() {}
  async open() { throw new Error('Bluetooth bridges each speak their own wireless language, and version 1 cannot pair with them yet. This is listed honestly instead of faked. A USB adapter works today.'); }
  async close() {}
  async send() { throw new Error('Not connected.'); }
}

/* --- WebUSB gs_usb transport: honest stub ---------------------------------
   gs_usb (candleLight/CANable Pro family) is a binary USB protocol; a full
   in-browser driver is a v2 project. v1 refuses cleanly. */
class WebUsbGsUsbTransport {
  constructor() { this.id = 'usb'; this.label = 'USB CAN adapter (WebUSB / gs_usb)'; this.isSimulator = false; }
  onFrame() {}
  async open() { throw new Error('The WebUSB driver for gs_usb adapters is still in development (planned for version 2). The USB cable option above works today.'); }
  async close() {}
  async send() { throw new Error('Not connected.'); }
}

/* ===========================================================================
   DRIVERS — one per chair platform. Interface:
     { id, displayName, lookupOnly?,
       capabilities: { monitor, readFaults, readParams, writeParams },
       attach(transport), detach(),
       onDecoded(frame, decoded), onActiveFaults(faultArray),
       readFaults(), readParameters(), writeParameter(param, value) }
   writeParams is resolved at attach() time: it is true ONLY when the
   transport is the simulator (see HONEST LIMITS at the top of this file).
   ========================================================================= */
class RNetDriver {
  constructor() {
    this.id = 'rnet'; this.displayName = 'Curtiss-Wright R-net';
    this.capabilities = { monitor: true, readFaults: true, readParams: true, writeParams: false };
    this.transport = null;
    this.activeFaults = new Map(); // code -> module short name
    this._pending = new Map();     // cfg obj index -> resolver
    this.onDecoded = null; this.onActiveFaults = null;
  }
  attach(transport) {
    this.transport = transport;
    // THE v1 SAFETY LINE: writes exist only against the simulator. On any
    // real transport the write path stays off — it has not been proven on a
    // live power module [PMD, honest limits], and we never guess a write
    // sequence to a mobility device.
    this.capabilities.writeParams = transport.isSimulator === true;
    transport.onFrame(f => this._onFrame(f));
  }
  detach() { this.transport = null; this.activeFaults.clear(); this._pending.clear(); }
  _onFrame(f) {
    const decoded = this.decode(f);
    if (this.onDecoded) this.onDecoded(f, decoded);
    if (f.id === BUS.ID.TRIP) {
      const code = ((f.data[1] << 8) | f.data[2]).toString(16).toUpperCase().padStart(4, '0');
      if (f.data[3] === 1) this.activeFaults.set(code, BUS.MODULE_SHORT[f.data[0]] || 'PM');
      else this.activeFaults.delete(code);
      if (this.onActiveFaults) this.onActiveFaults(this._faultList());
    }
    if (f.id === BUS.ID.CFG_DATA) {
      const idx = f.data[0];
      const res = this._pending.get(idx);
      if (res) { this._pending.delete(idx); res(f); }
    }
  }
  _faultList() {
    return Array.from(this.activeFaults.entries()).map(([code, module]) => ({ system: 'rnet', code, module }));
  }
  decode(f) {
    const d = f.data;
    if (f.id >= BUS.ID.PRESENCE && f.id < BUS.ID.PRESENCE + 3) {
      return { text: BUS.MODULES[f.id - BUS.ID.PRESENCE] + ': “I’m here.” (the modules check in constantly)' };
    }
    if (f.id === BUS.ID.JOYSTICK) {
      const x = d[0] > 127 ? d[0] - 256 : d[0];
      const y = d[1] > 127 ? d[1] - 256 : d[1];
      const where = (x === 0 && y === 0) ? 'centered, untouched' : 'pushed ' + Math.abs(y) + '% ' + (y > 0 ? 'forward' : 'backward') + (x !== 0 ? ', ' + Math.abs(x) + '% ' + (x > 0 ? 'right' : 'left') : '');
      return { text: 'Joystick: ' + where + ' (this is the demand the power module drives to)' };
    }
    if (f.id === BUS.ID.BATTERY) {
      const volts = ((d[1] << 8) | d[0]) / 10;
      return { text: 'Battery: ' + volts.toFixed(1) + ' volts, ' + d[2] + '% charged' };
    }
    if (f.id === BUS.ID.TRIP) {
      const code = ((d[1] << 8) | d[2]).toString(16).toUpperCase().padStart(4, '0');
      const entry = FAULT_TABLES.rnet.entries[code];
      const name = entry ? entry.title : 'a fault that is not in the published table';
      return { text: (d[3] === 1 ? 'FAULT — ' : 'Fault cleared — ') + BUS.MODULES[d[0]] + ' reports code ' + code + ': ' + name, trip: d[3] === 1 };
    }
    if (f.id === BUS.ID.CFG_DATA) {
      const body = Array.from(d.slice(0, -1));
      const ok = xorChecksum(body) === d[d.length - 1];
      return { text: 'Settings data: object ' + d[0] + ' arrived, checksum ' + (ok ? 'OK (the numbers prove it arrived unchanged)' : 'FAILED — treat this read as untrustworthy') };
    }
    if (f.id === BUS.ID.CFG_READ) return { text: 'A tool on the bus asked for settings object ' + d[0] };
    if (f.id === BUS.ID.CFG_WRITE) return { text: 'A tool on the bus is CHANGING settings object ' + d[0] };
    if (f.id === BUS.ID.AUTH) return { text: 'Modules checking each other’s serial numbers (the simple XOR handshake — the only “lock” on the bus)' };
    return { text: 'A message this tool does not know yet' };
  }
  async readFaults() {
    // Trips are announced by the chair when they happen and re-announced on
    // connect in this model; give the bus a moment, then report what is live.
    await new Promise(r => setTimeout(r, 500));
    return this._faultList();
  }
  _requestObject(idx) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this._pending.delete(idx); reject(new Error('The chair did not answer for settings object ' + idx + '.')); }, 900);
      this._pending.set(idx, f => {
        clearTimeout(timer);
        const body = Array.from(f.data.slice(0, -1));
        if (xorChecksum(body) !== f.data[f.data.length - 1]) { reject(new Error('Checksum failed on settings object ' + idx + ' — read it again.')); return; }
        resolve(f);
      });
      this.transport.send({ id: BUS.ID.CFG_READ, data: Uint8Array.of(idx) });
    });
  }
  async readParameters() {
    const out = {};
    for (const p of PARAMETERS) {
      const f = await this._requestObject(p.obj);
      out[p.id] = f.data[1] | (f.data[2] << 8);
    }
    return out;
  }
  async writeParameter(param, value) {
    if (!this.capabilities.writeParams) throw new Error('Changing settings on a real chair is off in version 1 — the write path is not yet proven on a live power module, and this tool never guesses a write to a mobility device. The full flow works on the practice chair.');
    if (param.locked) throw new Error('This setting is locked at 100% on purpose. ' + ACTUATOR_WARNING + ' (' + ACTUATOR_WARNING_SOURCE + ')');
    if (!Number.isFinite(value) || value < param.min || value > param.max) {
      throw new Error('That value is outside the manufacturer’s documented range for ' + param.name + ' (' + param.min + '–' + param.max + param.unit + '). Nothing was changed.');
    }
    const body = [param.obj, value & 0xFF, (value >> 8) & 0xFF];
    const echo = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('The chair did not confirm the change. Check the setting before trusting it.')), 900);
      this._pending.set(param.obj, f => { clearTimeout(timer); resolve(f); });
    });
    await this.transport.send({ id: BUS.ID.CFG_WRITE, data: Uint8Array.of(...body, xorChecksum(body)) });
    const f = await echo;
    const got = f.data[1] | (f.data[2] << 8);
    if (got !== value) throw new Error('The chair answered with a different value (' + got + ') than the one sent (' + value + '). Treat the change as failed.');
  }
}

/* --- Stub drivers: interfaces + documented connection notes ---------------
   These are deliberately NOT fake connections. Each states what the
   platform is, what v1 does (fault lookup from the published tables), and
   what the driver needs before it can talk to hardware. */
const STUB_DRIVERS = {
  vr2: {
    id: 'vr2', displayName: 'Curtiss-Wright VR2 / VSI', lookupOnly: true, system: 'vr2',
    capabilities: { monitor: false, readFaults: false, readParams: false, writeParams: false },
    notes: 'VR2 and VSI chairs have no screen and no owner-readable code port: their fault language IS the flashing battery bars, so version 1 is the translator (Fault codes tab). The VR2 bus is the same Curtiss-Wright family as R-net; a listening driver is the v2 step, after the same bench proof R-net gets. Source: /pmd-fault-codes.html.'
  },
  linx: {
    id: 'linx', displayName: 'Dynamic Controls LiNX', lookupOnly: true, system: 'linx',
    capabilities: { monitor: false, readFaults: false, readParams: false, writeParams: false },
    notes: 'LiNX chairs flash their faults as red-light counts, so version 1 is the translator (Fault codes tab). LiNX is also a CAN-based system, but Dynamic’s own tool (LiNX Access) refuses a live chair without the physical Access Key (DLX-HKEY01-A dealer / DLX-HKEY02-A manufacturer) — see /pmd-reading.html. Our driver roadmap: passive listening first, exactly like R-net; no key circumvention is shipped or planned.'
  },
  curtis: {
    id: 'curtis', displayName: 'Curtis Instruments (enAble / P&W)', lookupOnly: true, system: null,
    capabilities: { monitor: false, readFaults: false, readParams: false, writeParams: false },
    notes: 'Coming in a later version. Curtis-powered chairs use a CAN bus and Curtis’s own parameter system; the dealer tool is the 1313 handset programmer. A BareBoard driver waits on a parameter map documented from public Curtis manuals — the same standard as the R-net work: documented first, coded second, writes only when proven.'
  }
};

/* ===========================================================================
   APP / UI
   ========================================================================= */
const $ = id => document.getElementById(id);
const state = {
  platform: 'simulator', transport: null, driver: null, connected: false,
  unlocked: false, backup: null, values: {}, paused: false, t0: 0, busRows: 0
};

const HOOKUP = {
  simulator: `
    <h3>Hookup: there is none</h3>
    <ol>
      <li>Nothing to buy, nothing to plug in. The practice chair lives inside this page.</li>
      <li>Press <strong>Connect</strong>. The practice chair wakes up and starts talking.</li>
      <li>Watch its messages, read its faults, change its settings — everything works, and nothing real can break.</li>
    </ol>`,
  rnetSerial: `
    <h3>Hookup, in order</h3>
    <ol>
      <li>Park the chair on level ground, switch it <strong>off</strong>, and do not sit in it.</li>
      <li>Plug your <strong>isolated</strong> CAN adapter into the chair's round 4-pin bus cable (the cable between the joystick and the power module).</li>
      <li>Plug the adapter's USB cable into this phone or computer, with this page open in Chrome.</li>
      <li>Press <strong>Connect</strong> and pick the adapter from the browser's list.</li>
      <li>Switch the chair on. Its messages appear under “What the chair is saying.”</li>
    </ol>
    <p class="pc-warn"><strong>Isolated means non-negotiable.</strong> The bus cable carries 24-volt battery power on the same plug as the data wires. Only a galvanically isolated adapter (rated 2500V or better) may ever make this connection — it is the barrier that keeps a wiring fault out of your phone. Full reasoning: <a href="/pmd-reading.html">Reading the Chair</a>.</p>`,
  rnetOther: `
    <h3>Hookup, in order</h3>
    <ol>
      <li>Park the chair on level ground, switch it <strong>off</strong>, and do not sit in it.</li>
      <li>Fit your adapter to the chair's bus cable as its maker directs — isolated models only.</li>
      <li>Press <strong>Connect</strong> and see what this connection type says. Version 1 is honest about which transports actually work today.</li>
    </ol>
    <p class="pc-warn"><strong>Isolated means non-negotiable.</strong> The bus cable carries 24-volt battery power on the same plug as the data wires. Only a galvanically isolated adapter (rated 2500V or better) may ever make this connection.</p>`
};

function selectedPlatform() { return document.querySelector('input[name="pcPlatform"]:checked').value; }
function selectedTransportKind() { const el = document.querySelector('input[name="pcTransport"]:checked'); return el ? el.value : 'serial'; }

function refreshConnectCard() {
  state.platform = selectedPlatform();
  const isRnet = state.platform === 'rnet';
  $('pcTransportBlock').hidden = !isRnet;
  let html;
  if (state.platform === 'simulator') html = HOOKUP.simulator;
  else if (isRnet) html = selectedTransportKind() === 'serial' ? HOOKUP.rnetSerial : HOOKUP.rnetOther;
  else {
    const stub = STUB_DRIVERS[state.platform];
    html = '<h3>Version 1, honestly</h3><p>' + stub.notes + '</p>' +
      (stub.system ? '<p>Press <strong>Connect</strong> to open the fault translator for your chair.</p>'
                   : '<p>There is nothing to connect yet — this platform arrives in a later version.</p>');
  }
  $('pcHookup').innerHTML = html;
}

function setStatus(kind, text, detail) {
  const el = $('pcStatus');
  el.textContent = text;
  el.className = 'pc-status' + (kind === 'on' ? ' pc-on' : kind === 'sim' ? ' pc-sim' : '');
  $('pcStatusDetail').textContent = detail || '';
}
function connectMsg(text, isErr) {
  const el = $('pcConnectMsg');
  el.textContent = text || '';
  el.className = 'pc-msg' + (isErr ? ' pc-err' : '');
}
function settingsMsg(text, isErr) {
  const el = $('pcSettingsMsg');
  el.textContent = text || '';
  el.className = 'pc-msg' + (isErr ? ' pc-err' : '');
}

/* --- tabs ---------------------------------------------------------------- */
function showTab(name) {
  for (const n of ['monitor', 'faults', 'settings', 'help']) {
    $('panel-' + n).hidden = n !== name;
    $('tab-' + n).setAttribute('aria-selected', n === name ? 'true' : 'false');
  }
}

/* --- bus monitor ---------------------------------------------------------- */
function busRow(f, decoded) {
  if (state.paused) return;
  const li = document.createElement('li');
  if (decoded.trip) li.className = 'pc-trip';
  const t = document.createElement('span'); t.className = 'pc-t';
  const secs = Math.floor((Date.now() - state.t0) / 1000);
  t.textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0');
  const txt = document.createElement('span'); txt.textContent = decoded.text;
  const raw = document.createElement('span'); raw.className = 'pc-raw'; raw.textContent = frameHex(f);
  li.append(t, txt, raw);
  const log = $('pcBusLog');
  log.appendChild(li);
  while (log.children.length > 200) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
  $('pcBusEmpty').hidden = true;
}

/* --- faults ---------------------------------------------------------------- */
function faultCard(system, code, entry, moduleShort) {
  const div = document.createElement('div');
  if (!entry) {
    div.className = 'pc-fault';
    div.innerHTML = '<h3><span class="pc-code"></span> — not in the published table</h3><p></p>';
    div.querySelector('.pc-code').textContent = code;
    div.querySelector('p').textContent = 'This code is not in the owner-actionable table compiled from the manufacturer’s manuals. Write it down exactly as shown and give it to whoever services the chair — a code you can name is a repair you can argue about.';
    return div;
  }
  div.className = 'pc-fault';
  const h = document.createElement('h3');
  h.innerHTML = '<span class="pc-code"></span> — <span class="pc-ftitle"></span>';
  h.querySelector('.pc-code').textContent = (moduleShort ? moduleShort + ' ' : '') + code;
  h.querySelector('.pc-ftitle').textContent = entry.title;
  const p = document.createElement('p');
  p.innerHTML = '<strong>Check first:</strong> ';
  p.appendChild(document.createTextNode(entry.check));
  div.append(h, p);
  return div;
}
function renderFaults(list) {
  const box = $('pcFaultResults');
  box.innerHTML = '';
  if (!list.length) {
    const ok = document.createElement('div');
    ok.className = 'pc-ok';
    ok.textContent = 'No faults. The chair reports nothing wrong right now.';
    box.appendChild(ok); return;
  }
  for (const f of list) {
    const entry = FAULT_TABLES[f.system].entries[f.code];
    box.appendChild(faultCard(f.system, f.code, entry, f.module));
  }
}
function manualLookup() {
  const system = $('pcManualSystem').value;
  let raw = $('pcManualCode').value.trim().toUpperCase().replace(/\s+/g, '');
  let key = raw, entry = null;
  if (system === 'rnet') {
    if (raw === 'OVERCURRENT' || raw === 'OVER-CURRENT') key = 'OVERCURRENT';
    entry = FAULT_TABLES.rnet.entries[key];
  } else if (system === 'vr2') {
    key = raw.replace('+', '+').replace('S', 'S').replace('A', 'A');
    if (/^\d+$/.test(raw)) key = raw;
    else if (/^(\d+)\+?S$/.test(raw)) key = raw.replace(/^(\d+)\+?S$/, '$1+S');
    else if (/^(\d+)\+?A$/.test(raw)) key = raw.replace(/^(\d+)\+?A$/, '$1+A');
    entry = FAULT_TABLES.vr2.entries[key];
  } else if (system === 'linx') {
    key = (raw === 'RIPPLE' || raw === 'ALL' || raw === 'LEDS') ? 'RIPPLE' : raw;
    entry = FAULT_TABLES.linx.entries[key];
  }
  const box = $('pcManualResult');
  box.innerHTML = '';
  box.appendChild(faultCard(system, key, entry, null));
}

/* --- settings --------------------------------------------------------------- */
function renderParams() {
  const box = $('pcParamList');
  box.innerHTML = '';
  const canWrite = state.driver && state.driver.capabilities.writeParams && state.unlocked;
  for (const p of PARAMETERS) {
    const v = state.values[p.id];
    if (v === undefined) continue;
    const card = document.createElement('div');
    card.className = 'pc-param' + (p.locked ? ' pc-param-locked' : '');
    const head = document.createElement('div'); head.className = 'pc-param-head';
    const nm = document.createElement('span'); nm.className = 'pc-param-name'; nm.textContent = p.name;
    const val = document.createElement('span'); val.className = 'pc-param-value'; val.id = 'pcVal-' + p.id;
    val.textContent = v + p.unit;
    head.append(nm, val);
    const desc = document.createElement('p'); desc.className = 'pc-param-desc';
    desc.textContent = p.does + ' (Documented range: ' + p.min + '–' + p.max + p.unit + '.)';
    card.append(head, desc);
    if (p.locked) {
      const warn = document.createElement('p'); warn.className = 'pc-param-warn';
      warn.innerHTML = '<strong>Locked at 100% — the manufacturer’s rule, kept:</strong> “' + p.warn + '”<br><em>' + p.warnSource + '</em>';
      card.appendChild(warn);
    } else {
      const controls = document.createElement('div'); controls.className = 'pc-param-controls';
      const range = document.createElement('input');
      range.type = 'range'; range.min = p.min; range.max = p.max; range.value = v;
      range.id = 'pcRange-' + p.id; range.disabled = !canWrite;
      range.setAttribute('aria-label', p.name + ' slider');
      const num = document.createElement('input');
      num.type = 'number'; num.min = p.min; num.max = p.max; num.value = v;
      num.id = 'pcNum-' + p.id; num.disabled = !canWrite;
      num.setAttribute('aria-label', p.name + ' value');
      range.addEventListener('input', () => { num.value = range.value; });
      num.addEventListener('input', () => { range.value = num.value; });
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'pc-btn'; btn.textContent = 'Change it';
      btn.disabled = !canWrite;
      btn.addEventListener('click', () => applyWrite(p, parseInt(num.value, 10)));
      controls.append(range, num, document.createTextNode(p.unit), btn);
      card.appendChild(controls);
      const wrong = document.createElement('p'); wrong.className = 'pc-param-desc';
      wrong.innerHTML = '<strong>What goes wrong:</strong> ';
      wrong.appendChild(document.createTextNode(p.wrong));
      card.appendChild(wrong);
    }
    box.appendChild(card);
  }
}
async function applyWrite(param, value) {
  settingsMsg('');
  if (!state.backup) { settingsMsg('No backup exists yet, so nothing was changed. Unlock first — the backup is automatic.', true); return; }
  try {
    await state.driver.writeParameter(param, value);
    state.values[param.id] = value;
    $('pcVal-' + param.id).textContent = value + param.unit;
    settingsMsg('Changed: ' + param.name + ' is now ' + value + param.unit + '. Your backup from ' + state.backup.when + ' still holds the original — “Put everything back” undoes this.');
  } catch (e) {
    settingsMsg(e.message, true);
    const cur = state.values[param.id];
    if (cur !== undefined) { $('pcRange-' + param.id).value = cur; $('pcNum-' + param.id).value = cur; }
  }
}
function saveBackup(values) {
  state.backup = { when: new Date().toLocaleString(), platform: state.driver.displayName, values: { ...values } };
  try { localStorage.setItem('bb-pmd-control-backup-v1', JSON.stringify(state.backup)); } catch (e) { /* private mode: backup still lives in memory */ }
  $('pcBackupBar').hidden = false;
  $('pcBackupInfo').textContent = 'Backup saved: ' + state.backup.when + ' — every setting, as it was before any change.';
}

/* --- connect / disconnect ---------------------------------------------------- */
function makeTransport(kind) {
  if (kind === 'serial') return new WebSerialSlcanTransport();
  if (kind === 'bluetooth') return new BluetoothBridgeTransport();
  return new WebUsbGsUsbTransport();
}
async function doConnect() {
  connectMsg('');
  const platform = selectedPlatform();
  if (platform !== 'simulator' && platform !== 'rnet') {
    const stub = STUB_DRIVERS[platform];
    if (stub.system) {
      $('pcManualSystem').value = stub.system;
      setStatus('', 'Lookup mode — ' + stub.displayName, 'No cable needed. Use the Fault codes tab.');
      showTab('faults');
      connectMsg(stub.notes);
    } else {
      connectMsg(stub.notes, true);
    }
    return;
  }
  const transport = platform === 'simulator' ? new SimulatorTransport() : makeTransport(selectedTransportKind());
  const driver = new RNetDriver();
  driver.attach(transport);
  driver.onDecoded = (f, d) => busRow(f, d);
  driver.onActiveFaults = list => { if (document.activeElement && document.activeElement.id === 'pcReadFaultsBtn') renderFaults(list); };
  try {
    await transport.open();
  } catch (e) {
    connectMsg(e.message, true);
    return;
  }
  state.transport = transport; state.driver = driver; state.connected = true;
  state.t0 = Date.now(); state.unlocked = false;
  $('pcBusLog').innerHTML = ''; $('pcBusEmpty').hidden = false;
  $('pcConnectBtn').disabled = true; $('pcDisconnectBtn').disabled = false;
  $('pcReadFaultsBtn').disabled = false; $('pcUnlockBtn').disabled = false;
  $('pcSimFaultCard').hidden = platform !== 'simulator';
  if (platform === 'simulator') {
    setStatus('sim', 'Connected — practice chair', 'A virtual R-net chair. Everything works; nothing real can break.');
    $('pcLockNote').textContent = 'Practice chair: changing is allowed here — after the automatic backup.';
  } else {
    setStatus('on', 'Connected — R-net chair (listening only)', 'Version 1 reads a real chair. It never writes to one.');
    $('pcLockNote').textContent = 'Real chair: reading is open. Changing is off in version 1 — see “How to connect” for the honest reason.';
  }
  try {
    state.values = await driver.readParameters();
    renderParams();
  } catch (e) {
    settingsMsg('Connected, but the settings could not be read: ' + e.message, true);
  }
}
async function doDisconnect() {
  if (state.transport) { try { await state.transport.close(); } catch (e) {} }
  if (state.driver) state.driver.detach();
  state.transport = null; state.driver = null; state.connected = false; state.unlocked = false; state.values = {};
  $('pcParamList').innerHTML = ''; $('pcFaultResults').innerHTML = '';
  $('pcConnectBtn').disabled = false; $('pcDisconnectBtn').disabled = true;
  $('pcReadFaultsBtn').disabled = true; $('pcUnlockBtn').disabled = true;
  $('pcSimFaultCard').hidden = true; $('pcBackupBar').hidden = true;
  setStatus('', 'Not connected', 'Pick your chair below to begin.');
}

/* --- unlock / restore --------------------------------------------------------- */
async function doUnlock() {
  if (!state.driver) return;
  if (!state.driver.capabilities.writeParams) {
    settingsMsg('On a real chair, changing settings is off in version 1. The reading path is proven; the writing path is not yet proven on a live power module, and this tool never guesses a write to a mobility device. The complete flow — unlock, automatic backup, change, restore — works on the practice chair today.', true);
    return;
  }
  if (state.unlocked) return;
  settingsMsg('First, a backup: reading every setting as it is right now…');
  try {
    const values = await state.driver.readParameters();
    state.values = values;
    saveBackup(values);
    state.unlocked = true;
    $('pcUnlockBtn').disabled = true;
    $('pcLockNote').textContent = 'Unlocked. The backup above holds the original of every setting. Changes are checked against the manufacturer’s documented ranges before anything is sent.';
    renderParams();
    settingsMsg('Backup saved and settings unlocked. Small changes, one at a time — and “Put everything back” always works.');
  } catch (e) {
    settingsMsg('The backup could not be made (' + e.message + '), so settings stay locked. No backup, no writes — that rule has no exceptions.', true);
  }
}
async function doRestore() {
  if (!state.backup || !state.driver) return;
  settingsMsg('Putting everything back from the backup of ' + state.backup.when + '…');
  try {
    for (const p of PARAMETERS) {
      if (p.locked) continue;
      const v = state.backup.values[p.id];
      if (v !== undefined && v !== state.values[p.id]) await state.driver.writeParameter(p, v);
    }
    state.values = await state.driver.readParameters();
    renderParams();
    settingsMsg('Done. Every setting is back to the backup of ' + state.backup.when + '.');
  } catch (e) {
    settingsMsg('Restore hit a problem: ' + e.message, true);
  }
}

/* --- wiring ------------------------------------------------------------------- */
function init() {
  document.querySelectorAll('input[name="pcPlatform"]').forEach(r => r.addEventListener('change', refreshConnectCard));
  document.querySelectorAll('input[name="pcTransport"]').forEach(r => r.addEventListener('change', refreshConnectCard));
  refreshConnectCard();
  $('pcConnectBtn').addEventListener('click', doConnect);
  $('pcDisconnectBtn').addEventListener('click', doDisconnect);
  for (const n of ['monitor', 'faults', 'settings', 'help']) {
    $('tab-' + n).addEventListener('click', () => showTab(n));
  }
  $('pcHexToggle').addEventListener('change', e => {
    $('pcBusLog').classList.toggle('show-raw', e.target.checked);
  });
  $('pcPauseBtn').addEventListener('click', () => {
    state.paused = !state.paused;
    $('pcPauseBtn').textContent = state.paused ? 'Resume' : 'Pause';
  });
  $('pcClearBtn').addEventListener('click', () => { $('pcBusLog').innerHTML = ''; });
  $('pcReadFaultsBtn').addEventListener('click', async () => {
    if (!state.driver) return;
    $('pcFaultResults').innerHTML = '<p class="pc-msg">Asking the chair…</p>';
    try { renderFaults(await state.driver.readFaults()); }
    catch (e) { $('pcFaultResults').innerHTML = '<p class="pc-msg pc-err">' + e.message + '</p>'; }
  });
  $('pcManualBtn').addEventListener('click', manualLookup);
  document.querySelectorAll('.pc-inject').forEach(b => b.addEventListener('click', () => {
    if (state.transport && state.transport.isSimulator) {
      state.transport.injectFault(b.dataset.fault);
      showTab('faults');
      if (b.dataset.fault !== 'clear') {
        setTimeout(async () => { try { renderFaults(await state.driver.readFaults()); } catch (e) {} }, 120);
      } else {
        $('pcFaultResults').innerHTML = '';
      }
    }
  }));
  $('pcUnlockBtn').addEventListener('click', doUnlock);
  $('pcRestoreBtn').addEventListener('click', doRestore);
  $('pcDownloadBackupBtn').addEventListener('click', () => {
    if (!state.backup) return;
    const blob = new Blob([JSON.stringify(state.backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my-chair-settings-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  try {
    const saved = localStorage.getItem('bb-pmd-control-backup-v1');
    if (saved) {
      const b = JSON.parse(saved);
      $('pcBackupBar').hidden = false;
      $('pcBackupInfo').textContent = 'A backup from an earlier visit exists (' + b.when + '). Connect and unlock to restore from it.';
      state.backup = b;
    }
  } catch (e) { /* no stored backup */ }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
