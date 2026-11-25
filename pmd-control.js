/* Chair Control — the BareBoard PMD owner tool, version 1.
 *
 * Written for bareboard.org from the site's own published research and
 * the manufacturers' public documentation. It is not a copy of any
 * dealer tool, and it contains no manufacturer code.
 *
 * Protocol and platform names in this file (R-net, VR2, LiNX, SLCAN,
 * CAN, Web Serial, WebUSB) are the external interfaces the code must
 * speak to reach the chair and the adapter — they stay as interface
 * names.
 *
 * Where each protocol fact comes from (cited inline as [PMD], [READ],
 * [FAULT], [SET]):
 *   [PMD]   /pmd.html — the bus is standard CAN with no encryption;
 *           the only authentication is R-net's XOR serial handshake;
 *           configuration moves as data objects, each checksummed.
 *   [READ]  /pmd-reading.html — captured dealer sessions ran at
 *           125 kbps; 16 configuration objects read off the bus; the
 *           write/restore path is NOT yet proven on a live power
 *           module; the isolated-adapter rule.
 *   [FAULT] /pmd-fault-codes.html — fault tables, compiled from PG
 *           Drives VR2 + R-net technical manuals (R-net Technical
 *           Manual SK77981-14; PP1A Guide SK73747) and Dynamic
 *           Controls LiNX manuals.
 *   [SET]   /pmd-settings.html — the parameter list and ranges from
 *           Curtiss-Wright R-net programming documentation (On-Board
 *           Programming manual SK78571/4 and the R-NET Technical
 *           Manual).
 *
 * HONEST LIMITS (mirroring [PMD]): reading is proven. The live WRITE
 * path is not yet proven on a bench power module, so in v1 writes are
 * enabled ONLY against the simulator. On real hardware transports this
 * build is read-only and says so in the UI.
 */
'use strict';

/* Fault tables, transcribed from [FAULT]. Do not edit without
   re-checking the page — and behind it, the manufacturers' manuals. */
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

/* Parameters, from [SET] (R-net On-Board Programming SK78571/4 ranges).
   `obj` is the configuration-object index in the project's decode model:
   [READ] records 16 configuration objects read off the bus; v1 maps the
   documented drive/seating parameters onto objects 0–13, object 14 holds
   the chair serial (used by the XOR handshake [PMD]), object 15 is the
   profile marker. The defaults below are the SIMULATOR's factory values. */
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

/* The frame model, v1.
   What the site has PROVEN [PMD][READ]: the bus is standard CAN at
   125 kbps with no encryption; configuration moves as data objects, each
   protected by a checksum; module authentication is an XOR serial
   handshake; trips are reported as (module, 4-digit code) per [FAULT].
   What is NOT yet bench-confirmed: the exact on-wire frame IDs below.
   They are the project's working decode model, chosen to carry exactly
   the proven facts and nothing more. DESIGN.md records this split. The
   simulator speaks this model; a real chair is only ever LISTENED to
   in v1. */
const BUS = {
  BITRATE: 125000, // [READ]: captured dealer-tool sessions ran at 125 kbps
  ID: {
    PRESENCE: 0x100, // + module index (0=PM, 1=JSM, 2=ISM): module alive
    JOYSTICK: 0x180, // data[0]=X %, data[1]=Y % (signed)
    BATTERY: 0x1A0,  // data[0..1]=volts x10 LE, data[2]=charge %
    TRIP: 0x200,     // data[0]=module, data[1..2]=code BE, data[3]=1 active/0 cleared
    CFG_READ: 0x300, // data[0]=object index
    CFG_DATA: 0x380, // data[0]=index, data[1..n-2]=payload, data[n-1]=XOR checksum
    CFG_WRITE: 0x3C0, // same layout as CFG_DATA. Simulator-only in v1.
    AUTH: 0x3E0      // XOR serial handshake exchange [PMD]
  },
  MODULES: ['Power module (PM)', 'Joystick module (JSM)', 'Seating module (ISM)'],
  MODULE_SHORT: ['PM', 'JSM', 'ISM']
};

function xorChecksum(bytes) {
  let checksum = 0;
  for (const byte of bytes) checksum ^= byte;
  return checksum & 0xFF;
}

function hexByte(byte) {
  return byte.toString(16).toUpperCase().padStart(2, '0');
}

function frameHex(frame) {
  const id = frame.id.toString(16).toUpperCase().padStart(3, '0');
  const data = Array.from(frame.data).map(hexByte).join(' ');
  return 'CAN ' + id + '  [' + frame.data.length + '] ' + data;
}

function tripCodeFrom(data) {
  return ((data[1] << 8) | data[2]).toString(16).toUpperCase().padStart(4, '0');
}

function signedByte(byte) {
  return byte > 127 ? byte - 256 : byte;
}

/* Transports — one interface each:
 *   { id, label, isSimulator, open(), close(), send(frame),
 *     onFrame(cb) }
 * A transport moves raw CAN frames; it knows nothing about chairs. */

/* The simulator: a virtual R-net bus and a virtual chair. A software
   chair that answers config reads and writes, streams presence,
   joystick, and battery frames, and raises trips on request. It speaks
   the frame model above, so the REAL R-net driver code path is the one
   that gets exercised. */
class SimulatorTransport {
  constructor() {
    this.id = 'simulator';
    this.label = 'Practice chair (built-in)';
    this.isSimulator = true;
    this._listeners = [];
    this._timers = [];
    // The virtual chair's configuration objects (16 per [READ]).
    this.objects = new Array(16).fill(0);
    for (const param of PARAMETERS) this.objects[param.obj] = param.def;
    this.serial = 'SIM0001'; // object 14 in a real chair; handshake material [PMD]
    this.faults = new Set(); // active R-net trip codes
    this.batteryVolts = 25.2;
    this.charge = 87;
  }

  onFrame(cb) { this._listeners.push(cb); }

  _emit(frame) {
    for (const cb of this._listeners) cb(frame);
  }

  _announceTrip(code, active) {
    const value = parseInt(code, 16);
    const module = (code === '1D05' || code === '2F00') ? 1 : 0; // JSM faults per [FAULT]
    this._emit({
      id: BUS.ID.TRIP,
      data: Uint8Array.of(module, (value >> 8) & 0xFF, value & 0xFF, active)
    });
  }

  async open() {
    let module = 0;
    this._timers.push(setInterval(() => { // presence, one module at a time
      this._emit({ id: BUS.ID.PRESENCE + module, data: Uint8Array.of(1) });
      module = (module + 1) % 3;
    }, 900));
    this._timers.push(setInterval(() => { // joystick resting near center
      const x = Math.round(Math.sin(Date.now() / 4000) * 4);
      this._emit({ id: BUS.ID.JOYSTICK, data: Uint8Array.of(x & 0xFF, 0) });
    }, 1300));
    this._timers.push(setInterval(() => { // battery slowly breathing
      const drift = (Math.random() - 0.5) * 0.1;
      this.batteryVolts = Math.max(23.8, Math.min(25.6, this.batteryVolts + drift));
      const tenths = Math.round(this.batteryVolts * 10);
      this._emit({
        id: BUS.ID.BATTERY,
        data: Uint8Array.of(tenths & 0xFF, (tenths >> 8) & 0xFF, this.charge)
      });
    }, 2000));
    // Announce any pre-set faults shortly after connect.
    setTimeout(() => {
      for (const code of this.faults) this._announceTrip(code, 1);
    }, 350);
  }

  async close() {
    this._timers.forEach(clearInterval);
    this._timers = [];
  }

  injectFault(code) {
    if (code === 'clear') {
      for (const held of this.faults) this._announceTrip(held, 0);
      this.faults.clear();
      return;
    }
    this.faults.add(code);
    this._announceTrip(code, 1);
  }

  async send(frame) {
    if (frame.id === BUS.ID.CFG_READ) {
      const index = frame.data[0];
      const payload = index === 14
        ? Array.from(new TextEncoder().encode(this.serial))
        : [this.objects[index] & 0xFF, (this.objects[index] >> 8) & 0xFF];
      const body = [index, ...payload];
      const reply = Uint8Array.of(...body, xorChecksum(body));
      setTimeout(() => this._emit({ id: BUS.ID.CFG_DATA, data: reply }), 30);
    } else if (frame.id === BUS.ID.CFG_WRITE) {
      const body = Array.from(frame.data.slice(0, -1));
      const sent = frame.data[frame.data.length - 1];
      if (xorChecksum(body) !== sent) return; // bad checksum: the chair ignores it (that is the point of the checksum [PMD])
      const index = body[0];
      if (index < 14) this.objects[index] = body[1] | (body[2] << 8);
      const echo = Uint8Array.of(...body, sent);
      setTimeout(() => this._emit({ id: BUS.ID.CFG_DATA, data: echo }), 30);
    } else if (frame.id === BUS.ID.AUTH) {
      // XOR serial handshake [PMD]: the module answers the challenge
      // XORed with its serial bytes. Modelled, not quoted — the site
      // documents the mechanism (a simple fixed XOR check), not a byte
      // transcript.
      const answer = Array.from(frame.data)
        .map((byte, i) => byte ^ this.serial.charCodeAt(i % this.serial.length));
      setTimeout(() => this._emit({ id: BUS.ID.AUTH, data: Uint8Array.of(...answer) }), 30);
    }
  }
}

/* Web Serial + SLCAN (CANable-class adapters). A real implementation.
   SLCAN is the Lawicel text protocol spoken by CANable and many USB-CAN
   adapters: 'O' opens the channel, 'S4' selects 125 kbit/s, 't' frames
   carry data. Chrome exposes the port via Web Serial (navigator.serial)
   — no driver, no install. The adapter MUST be a galvanically isolated
   model: see /pmd-reading.html and the help panel. */
class WebSerialSlcanTransport {
  constructor() {
    this.id = 'serial';
    this.label = 'USB CAN adapter (Web Serial)';
    this.isSimulator = false;
    this._listeners = [];
    this._port = null;
    this._writer = null;
    this._reader = null;
    this._reading = false;
  }

  onFrame(cb) { this._listeners.push(cb); }

  _emit(frame) {
    for (const cb of this._listeners) cb(frame);
  }

  async open() {
    if (!('serial' in navigator)) {
      throw new Error('This browser cannot use USB adapters (Web Serial is missing). Use Chrome on Android or a computer.');
    }
    this._port = await navigator.serial.requestPort();
    await this._port.open({ baudRate: 115200 }); // SLCAN adapters' default USB-serial rate
    this._writer = this._port.writable.getWriter();
    this._reader = this._port.readable.getReader();
    await this._command('C'); // close the channel if it was left open
    await this._command('S4'); // S4 = 125 kbit/s, the chair bus speed [READ]
    await this._command('O'); // open the CAN channel
    this._reading = true;
    this._readLoop();
  }

  async _command(text) {
    await this._writer.write(new TextEncoder().encode(text + '\r'));
  }

  async _readLoop() {
    const decoder = new TextDecoder();
    let buffer = '';
    while (this._reading) {
      const { value, done } = await this._reader.read();
      if (done) break;
      buffer += decoder.decode(value);
      let cut;
      while ((cut = buffer.indexOf('\r')) >= 0) {
        const line = buffer.slice(0, cut);
        buffer = buffer.slice(cut + 1);
        const frame = this._parseLine(line);
        if (frame) this._emit(frame);
      }
    }
  }

  _parseLine(line) {
    if (!line || (line[0] !== 't' && line[0] !== 'T')) return null;
    const extended = line[0] === 'T';
    const idDigits = extended ? 8 : 3;
    const id = parseInt(line.slice(1, 1 + idDigits), 16);
    const length = parseInt(line[1 + idDigits], 16);
    const hex = line.slice(2 + idDigits, 2 + idDigits + length * 2);
    const data = new Uint8Array(length);
    for (let i = 0; i < length; i++) data[i] = parseInt(hex.substr(i * 2, 2), 16);
    return { id, data };
  }

  async send(frame) {
    const id = frame.id.toString(16).toUpperCase().padStart(3, '0');
    const data = Array.from(frame.data).map(hexByte).join('');
    const length = frame.data.length.toString(16).toUpperCase();
    await this._command('t' + id + length + data);
  }

  async close() {
    this._reading = false;
    try { await this._command('C'); } catch (e) { /* already gone */ }
    try { if (this._reader) await this._reader.cancel(); } catch (e) {}
    try { if (this._writer) this._writer.releaseLock(); } catch (e) {}
    try { if (this._port) await this._port.close(); } catch (e) {}
  }
}

/* Bluetooth bridge transport: it keeps the full transport interface
   and declines to connect in v1. BLE CAN bridges each expose their
   own vendor GATT service; there is no standard profile to code
   against, so v1 refuses cleanly rather than faking a pairing.
   Frame listeners still register and release normally, so the driver
   code path is the same for every transport.
   (Roadmap: DESIGN.md.) */
class BluetoothBridgeTransport {
  constructor() {
    this.id = 'bluetooth';
    this.label = 'Bluetooth CAN bridge';
    this.isSimulator = false;
    this._listeners = [];
  }
  onFrame(cb) { this._listeners.push(cb); }
  async open() {
    throw new Error('Bluetooth bridges each speak their own wireless language, and version 1 cannot pair with them yet. This is listed honestly instead of faked. A USB adapter works today.');
  }
  async close() { this._listeners = []; }
  async send() { throw new Error('Not connected.'); }
}

/* WebUSB gs_usb transport: it keeps the full transport interface
   and declines to connect in v1. gs_usb (candleLight/CANable
   Pro family) is a binary USB protocol; a full in-browser driver is a
   v2 project, so v1 refuses cleanly. Frame listeners still register
   and release normally, so the driver code path is the same for
   every transport. */
class WebUsbGsUsbTransport {
  constructor() {
    this.id = 'usb';
    this.label = 'USB CAN adapter (WebUSB / gs_usb)';
    this.isSimulator = false;
    this._listeners = [];
  }
  onFrame(cb) { this._listeners.push(cb); }
  async open() {
    throw new Error('The WebUSB driver for gs_usb adapters is still in development (planned for version 2). The USB cable option above works today.');
  }
  async close() { this._listeners = []; }
  async send() { throw new Error('Not connected.'); }
}

/* Drivers — one per chair platform. Interface:
 *   { id, displayName, lookupOnly?,
 *     capabilities: { monitor, readFaults, readParams, writeParams },
 *     attach(transport), detach(),
 *     onDecoded(frame, decoded), onActiveFaults(faultArray),
 *     readFaults(), readParameters(), writeParameter(param, value) }
 * writeParams is settled at attach() time: it is true ONLY when the
 * transport is the simulator (see HONEST LIMITS at the top of this
 * file). */
class RNetDriver {
  constructor() {
    this.id = 'rnet';
    this.displayName = 'Curtiss-Wright R-net';
    this.capabilities = { monitor: true, readFaults: true, readParams: true, writeParams: false };
    this.transport = null;
    this.activeFaults = new Map(); // code -> module short name
    this._awaiting = new Map(); // config object index -> resolver
    this.onDecoded = null;
    this.onActiveFaults = null;
  }

  attach(transport) {
    this.transport = transport;
    // THE v1 SAFETY LINE: writes exist only against the simulator. On
    // any real transport the write path stays off — it has not been
    // proven on a live power module [PMD, honest limits], and we never
    // guess a write sequence to a mobility device.
    this.capabilities.writeParams = transport.isSimulator === true;
    transport.onFrame((frame) => this._onFrame(frame));
  }

  detach() {
    this.transport = null;
    this.activeFaults.clear();
    this._awaiting.clear();
  }

  _onFrame(frame) {
    const decoded = this.decode(frame);
    if (this.onDecoded) this.onDecoded(frame, decoded);
    if (frame.id === BUS.ID.TRIP) {
      const code = tripCodeFrom(frame.data);
      if (frame.data[3] === 1) {
        this.activeFaults.set(code, BUS.MODULE_SHORT[frame.data[0]] || 'PM');
      } else {
        this.activeFaults.delete(code);
      }
      if (this.onActiveFaults) this.onActiveFaults(this._faultList());
    }
    if (frame.id === BUS.ID.CFG_DATA) {
      const index = frame.data[0];
      const resolve = this._awaiting.get(index);
      if (resolve) {
        this._awaiting.delete(index);
        resolve(frame);
      }
    }
  }

  _faultList() {
    return Array.from(this.activeFaults.entries())
      .map(([code, module]) => ({ system: 'rnet', code, module }));
  }

  decode(frame) {
    const data = frame.data;
    if (frame.id >= BUS.ID.PRESENCE && frame.id < BUS.ID.PRESENCE + 3) {
      const module = BUS.MODULES[frame.id - BUS.ID.PRESENCE];
      return { text: module + ': “I’m here.” (the modules check in constantly)' };
    }
    if (frame.id === BUS.ID.JOYSTICK) {
      const x = signedByte(data[0]);
      const y = signedByte(data[1]);
      let where;
      if (x === 0 && y === 0) {
        where = 'centered, untouched';
      } else {
        where = 'pushed ' + Math.abs(y) + '% ' + (y > 0 ? 'forward' : 'backward');
        if (x !== 0) where += ', ' + Math.abs(x) + '% ' + (x > 0 ? 'right' : 'left');
      }
      return { text: 'Joystick: ' + where + ' (this is the demand the power module drives to)' };
    }
    if (frame.id === BUS.ID.BATTERY) {
      const volts = ((data[1] << 8) | data[0]) / 10;
      return { text: 'Battery: ' + volts.toFixed(1) + ' volts, ' + data[2] + '% charged' };
    }
    if (frame.id === BUS.ID.TRIP) {
      const code = tripCodeFrom(data);
      const entry = FAULT_TABLES.rnet.entries[code];
      const name = entry ? entry.title : 'a fault that is not in the published table';
      const verb = data[3] === 1 ? 'FAULT — ' : 'Fault cleared — ';
      return { text: verb + BUS.MODULES[data[0]] + ' reports code ' + code + ': ' + name, trip: data[3] === 1 };
    }
    if (frame.id === BUS.ID.CFG_DATA) {
      const body = Array.from(data.slice(0, -1));
      const ok = xorChecksum(body) === data[data.length - 1];
      const verdict = ok
        ? 'OK (the numbers prove it arrived unchanged)'
        : 'FAILED — treat this read as untrustworthy';
      return { text: 'Settings data: object ' + data[0] + ' arrived, checksum ' + verdict };
    }
    if (frame.id === BUS.ID.CFG_READ) {
      return { text: 'A tool on the bus asked for settings object ' + data[0] };
    }
    if (frame.id === BUS.ID.CFG_WRITE) {
      return { text: 'A tool on the bus is CHANGING settings object ' + data[0] };
    }
    if (frame.id === BUS.ID.AUTH) {
      return { text: 'Modules checking each other’s serial numbers (the simple XOR handshake — the only “lock” on the bus)' };
    }
    return { text: 'A message this tool does not know yet' };
  }

  async readFaults() {
    // Trips are announced by the chair when they happen, and re-announced
    // on connect in this model; give the bus a moment, then report what
    // is live.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return this._faultList();
  }

  _fetchObject(index) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._awaiting.delete(index);
        reject(new Error('The chair did not answer for settings object ' + index + '.'));
      }, 900);
      this._awaiting.set(index, (frame) => {
        clearTimeout(timer);
        const body = Array.from(frame.data.slice(0, -1));
        if (xorChecksum(body) !== frame.data[frame.data.length - 1]) {
          reject(new Error('Checksum failed on settings object ' + index + ' — read it again.'));
          return;
        }
        resolve(frame);
      });
      this.transport.send({ id: BUS.ID.CFG_READ, data: Uint8Array.of(index) });
    });
  }

  async readParameters() {
    const values = {};
    for (const param of PARAMETERS) {
      const frame = await this._fetchObject(param.obj);
      values[param.id] = frame.data[1] | (frame.data[2] << 8);
    }
    return values;
  }

  async writeParameter(param, value) {
    if (!this.capabilities.writeParams) {
      throw new Error('Changing settings on a real chair is off in version 1 — the write path is not yet proven on a live power module, and this tool never guesses a write to a mobility device. The full flow works on the practice chair.');
    }
    if (param.locked) {
      throw new Error('This setting is locked at 100% on purpose. ' + ACTUATOR_WARNING + ' (' + ACTUATOR_WARNING_SOURCE + ')');
    }
    if (!Number.isFinite(value) || value < param.min || value > param.max) {
      throw new Error('That value is outside the manufacturer’s documented range for ' + param.name + ' (' + param.min + '–' + param.max + param.unit + '). Nothing was changed.');
    }
    const body = [param.obj, value & 0xFF, (value >> 8) & 0xFF];
    const confirmation = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('The chair did not confirm the change. Check the setting before trusting it.'));
      }, 900);
      this._awaiting.set(param.obj, (frame) => {
        clearTimeout(timer);
        resolve(frame);
      });
    });
    await this.transport.send({
      id: BUS.ID.CFG_WRITE,
      data: Uint8Array.of(...body, xorChecksum(body))
    });
    const echoed = await confirmation;
    const confirmed = echoed.data[1] | (echoed.data[2] << 8);
    if (confirmed !== value) {
      throw new Error('The chair answered with a different value (' + confirmed + ') than the one sent (' + value + '). Treat the change as failed.');
    }
  }
}

/* Lookup-only drivers: interfaces plus documented connection notes.
   These are deliberately NOT fake connections. Each states what the
   platform is, what v1 does (fault lookup from the published tables),
   and what the driver needs before it can talk to hardware. */
const LOOKUP_DRIVERS = {
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

/* App state and UI. */
const $ = (id) => document.getElementById(id);
const app = {
  platform: 'simulator',
  transport: null,
  driver: null,
  connected: false,
  unlocked: false,
  backup: null,
  values: {},
  paused: false,
  t0: 0
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

function chosenPlatform() {
  return document.querySelector('input[name="pcPlatform"]:checked').value;
}

function chosenTransport() {
  const picked = document.querySelector('input[name="pcTransport"]:checked');
  return picked ? picked.value : 'serial';
}

function refreshConnectCard() {
  app.platform = chosenPlatform();
  const isRnet = app.platform === 'rnet';
  $('pcTransportBlock').hidden = !isRnet;
  let html;
  if (app.platform === 'simulator') {
    html = HOOKUP.simulator;
  } else if (isRnet) {
    html = chosenTransport() === 'serial' ? HOOKUP.rnetSerial : HOOKUP.rnetOther;
  } else {
    const entry = LOOKUP_DRIVERS[app.platform];
    html = '<h3>Version 1, honestly</h3><p>' + entry.notes + '</p>' +
      (entry.system
        ? '<p>Press <strong>Connect</strong> to open the fault translator for your chair.</p>'
        : '<p>There is nothing to connect yet — this platform arrives in a later version.</p>');
  }
  $('pcHookup').innerHTML = html;
}

function setStatus(kind, text, detail) {
  const badge = $('pcStatus');
  badge.textContent = text;
  badge.className = 'pc-status' +
    (kind === 'on' ? ' pc-on' : kind === 'sim' ? ' pc-sim' : '');
  $('pcStatusDetail').textContent = detail || '';
}

function showConnectMessage(text, isError) {
  const box = $('pcConnectMsg');
  box.textContent = text || '';
  box.className = 'pc-msg' + (isError ? ' pc-err' : '');
}

function showSettingsMessage(text, isError) {
  const box = $('pcSettingsMsg');
  box.textContent = text || '';
  box.className = 'pc-msg' + (isError ? ' pc-err' : '');
}

/* Tabs. */
function showTab(name) {
  for (const tab of ['monitor', 'faults', 'settings', 'help']) {
    $('panel-' + tab).hidden = tab !== name;
    $('tab-' + tab).setAttribute('aria-selected', tab === name ? 'true' : 'false');
  }
}

/* Bus monitor. */
function addBusRow(frame, decoded) {
  if (app.paused) return;
  const row = document.createElement('li');
  if (decoded.trip) row.className = 'pc-trip';
  const stamp = document.createElement('span');
  stamp.className = 'pc-t';
  const elapsed = Math.floor((Date.now() - app.t0) / 1000);
  stamp.textContent = String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' +
    String(elapsed % 60).padStart(2, '0');
  const plain = document.createElement('span');
  plain.textContent = decoded.text;
  const raw = document.createElement('span');
  raw.className = 'pc-raw';
  raw.textContent = frameHex(frame);
  row.append(stamp, plain, raw);
  const log = $('pcBusLog');
  log.appendChild(row);
  while (log.children.length > 200) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
  $('pcBusEmpty').hidden = true;
}

/* Faults. */
function buildFaultCard(code, entry, moduleShort) {
  const card = document.createElement('div');
  card.className = 'pc-fault';
  if (!entry) {
    card.innerHTML = '<h3><span class="pc-code"></span> — not in the published table</h3><p></p>';
    card.querySelector('.pc-code').textContent = code;
    card.querySelector('p').textContent = 'This code is not in the owner-actionable table compiled from the manufacturer’s manuals. Write it down exactly as shown and give it to whoever services the chair — a code you can name is a repair you can argue about.';
    return card;
  }
  const heading = document.createElement('h3');
  heading.innerHTML = '<span class="pc-code"></span> — <span class="pc-ftitle"></span>';
  heading.querySelector('.pc-code').textContent = (moduleShort ? moduleShort + ' ' : '') + code;
  heading.querySelector('.pc-ftitle').textContent = entry.title;
  const advice = document.createElement('p');
  advice.innerHTML = '<strong>Check first:</strong> ';
  advice.appendChild(document.createTextNode(entry.check));
  card.append(heading, advice);
  return card;
}

function renderFaults(list) {
  const box = $('pcFaultResults');
  box.innerHTML = '';
  if (list.length === 0) {
    const clear = document.createElement('div');
    clear.className = 'pc-ok';
    clear.textContent = 'No faults. The chair reports nothing wrong right now.';
    box.appendChild(clear);
    return;
  }
  for (const fault of list) {
    const entry = FAULT_TABLES[fault.system].entries[fault.code];
    box.appendChild(buildFaultCard(fault.code, entry, fault.module));
  }
}

function normalizeCode(system, raw) {
  if (system === 'rnet') {
    if (raw === 'OVERCURRENT' || raw === 'OVER-CURRENT') return 'OVERCURRENT';
    return raw;
  }
  if (system === 'vr2') {
    if (/^\d+$/.test(raw)) return raw;
    const withS = raw.match(/^(\d+)\+?S$/);
    if (withS) return withS[1] + '+S';
    const withA = raw.match(/^(\d+)\+?A$/);
    if (withA) return withA[1] + '+A';
    return raw;
  }
  if (system === 'linx') {
    if (raw === 'RIPPLE' || raw === 'ALL' || raw === 'LEDS') return 'RIPPLE';
    return raw;
  }
  return raw;
}

function manualLookup() {
  const system = $('pcManualSystem').value;
  const raw = $('pcManualCode').value.trim().toUpperCase().replace(/\s+/g, '');
  const key = normalizeCode(system, raw);
  const entry = FAULT_TABLES[system] ? FAULT_TABLES[system].entries[key] : null;
  const box = $('pcManualResult');
  box.innerHTML = '';
  box.appendChild(buildFaultCard(key, entry, null));
}

/* Settings. */
function renderParams() {
  const box = $('pcParamList');
  box.innerHTML = '';
  const editable = !!(app.driver && app.driver.capabilities.writeParams && app.unlocked);
  for (const param of PARAMETERS) {
    const value = app.values[param.id];
    if (value === undefined) continue;
    const card = document.createElement('div');
    card.className = 'pc-param' + (param.locked ? ' pc-param-locked' : '');
    const head = document.createElement('div');
    head.className = 'pc-param-head';
    const name = document.createElement('span');
    name.className = 'pc-param-name';
    name.textContent = param.name;
    const shown = document.createElement('span');
    shown.className = 'pc-param-value';
    shown.id = 'pcVal-' + param.id;
    shown.textContent = value + param.unit;
    head.append(name, shown);
    const about = document.createElement('p');
    about.className = 'pc-param-desc';
    about.textContent = param.does + ' (Documented range: ' + param.min + '–' + param.max + param.unit + '.)';
    card.append(head, about);
    if (param.locked) {
      const warning = document.createElement('p');
      warning.className = 'pc-param-warn';
      warning.innerHTML = '<strong>Locked at 100% — the manufacturer’s rule, kept:</strong> “' +
        param.warn + '”<br><em>' + param.warnSource + '</em>';
      card.appendChild(warning);
    } else {
      const controls = document.createElement('div');
      controls.className = 'pc-param-controls';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = param.min;
      slider.max = param.max;
      slider.value = value;
      slider.id = 'pcRange-' + param.id;
      slider.disabled = !editable;
      slider.setAttribute('aria-label', param.name + ' slider');
      const field = document.createElement('input');
      field.type = 'number';
      field.min = param.min;
      field.max = param.max;
      field.value = value;
      field.id = 'pcNum-' + param.id;
      field.disabled = !editable;
      field.setAttribute('aria-label', param.name + ' value');
      slider.addEventListener('input', () => { field.value = slider.value; });
      field.addEventListener('input', () => { slider.value = field.value; });
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.className = 'pc-btn';
      apply.textContent = 'Change it';
      apply.disabled = !editable;
      apply.addEventListener('click', () => applyWrite(param, parseInt(field.value, 10)));
      controls.append(slider, field, document.createTextNode(param.unit), apply);
      card.appendChild(controls);
      const risks = document.createElement('p');
      risks.className = 'pc-param-desc';
      risks.innerHTML = '<strong>What goes wrong:</strong> ';
      risks.appendChild(document.createTextNode(param.wrong));
      card.appendChild(risks);
    }
    box.appendChild(card);
  }
}

async function applyWrite(param, value) {
  showSettingsMessage('');
  if (!app.backup) {
    showSettingsMessage('No backup exists yet, so nothing was changed. Unlock first — the backup is automatic.', true);
    return;
  }
  try {
    await app.driver.writeParameter(param, value);
    app.values[param.id] = value;
    $('pcVal-' + param.id).textContent = value + param.unit;
    showSettingsMessage('Changed: ' + param.name + ' is now ' + value + param.unit +
      '. Your backup from ' + app.backup.when + ' still holds the original — “Put everything back” undoes this.');
  } catch (err) {
    showSettingsMessage(err.message, true);
    const current = app.values[param.id];
    if (current !== undefined) {
      $('pcRange-' + param.id).value = current;
      $('pcNum-' + param.id).value = current;
    }
  }
}

function saveBackup(values) {
  app.backup = {
    when: new Date().toLocaleString(),
    platform: app.driver.displayName,
    values: { ...values }
  };
  try {
    localStorage.setItem('bb-pmd-control-backup-v1', JSON.stringify(app.backup));
  } catch (e) { /* private mode: the backup still lives in memory */ }
  $('pcBackupBar').hidden = false;
  $('pcBackupInfo').textContent = 'Backup saved: ' + app.backup.when +
    ' — every setting, as it was before any change.';
}

/* Connect / disconnect. */
function buildTransport(kind) {
  if (kind === 'serial') return new WebSerialSlcanTransport();
  if (kind === 'bluetooth') return new BluetoothBridgeTransport();
  return new WebUsbGsUsbTransport();
}

async function doConnect() {
  showConnectMessage('');
  const platform = chosenPlatform();
  if (platform !== 'simulator' && platform !== 'rnet') {
    const entry = LOOKUP_DRIVERS[platform];
    if (entry.system) {
      $('pcManualSystem').value = entry.system;
      setStatus('', 'Lookup mode — ' + entry.displayName, 'No cable needed. Use the Fault codes tab.');
      showTab('faults');
      showConnectMessage(entry.notes);
    } else {
      showConnectMessage(entry.notes, true);
    }
    return;
  }
  const transport = platform === 'simulator'
    ? new SimulatorTransport()
    : buildTransport(chosenTransport());
  const driver = new RNetDriver();
  driver.attach(transport);
  driver.onDecoded = (frame, decoded) => addBusRow(frame, decoded);
  driver.onActiveFaults = (list) => {
    if (document.activeElement && document.activeElement.id === 'pcReadFaultsBtn') {
      renderFaults(list);
    }
  };
  try {
    await transport.open();
  } catch (err) {
    showConnectMessage(err.message, true);
    return;
  }
  app.transport = transport;
  app.driver = driver;
  app.connected = true;
  app.t0 = Date.now();
  app.unlocked = false;
  $('pcBusLog').innerHTML = '';
  $('pcBusEmpty').hidden = false;
  $('pcConnectBtn').disabled = true;
  $('pcDisconnectBtn').disabled = false;
  $('pcReadFaultsBtn').disabled = false;
  $('pcUnlockBtn').disabled = false;
  $('pcSimFaultCard').hidden = platform !== 'simulator';
  if (platform === 'simulator') {
    setStatus('sim', 'Connected — practice chair', 'A virtual R-net chair. Everything works; nothing real can break.');
    $('pcLockNote').textContent = 'Practice chair: changing is allowed here — after the automatic backup.';
  } else {
    setStatus('on', 'Connected — R-net chair (listening only)', 'Version 1 reads a real chair. It never writes to one.');
    $('pcLockNote').textContent = 'Real chair: reading is open. Changing is off in version 1 — see “How to connect” for the honest reason.';
  }
  try {
    app.values = await driver.readParameters();
    renderParams();
  } catch (err) {
    showSettingsMessage('Connected, but the settings could not be read: ' + err.message, true);
  }
}

async function doDisconnect() {
  if (app.transport) {
    try { await app.transport.close(); } catch (e) {}
  }
  if (app.driver) app.driver.detach();
  app.transport = null;
  app.driver = null;
  app.connected = false;
  app.unlocked = false;
  app.values = {};
  $('pcParamList').innerHTML = '';
  $('pcFaultResults').innerHTML = '';
  $('pcConnectBtn').disabled = false;
  $('pcDisconnectBtn').disabled = true;
  $('pcReadFaultsBtn').disabled = true;
  $('pcUnlockBtn').disabled = true;
  $('pcSimFaultCard').hidden = true;
  $('pcBackupBar').hidden = true;
  setStatus('', 'Not connected', 'Pick your chair below to begin.');
}

/* Unlock / restore. */
async function doUnlock() {
  if (!app.driver) return;
  if (!app.driver.capabilities.writeParams) {
    showSettingsMessage('On a real chair, changing settings is off in version 1. The reading path is proven; the writing path is not yet proven on a live power module, and this tool never guesses a write to a mobility device. The complete flow — unlock, automatic backup, change, restore — works on the practice chair today.', true);
    return;
  }
  if (app.unlocked) return;
  showSettingsMessage('First, a backup: reading every setting as it is right now…');
  try {
    const values = await app.driver.readParameters();
    app.values = values;
    saveBackup(values);
    app.unlocked = true;
    $('pcUnlockBtn').disabled = true;
    $('pcLockNote').textContent = 'Unlocked. The backup above holds the original of every setting. Changes are checked against the manufacturer’s documented ranges before anything is sent.';
    renderParams();
    showSettingsMessage('Backup saved and settings unlocked. Small changes, one at a time — and “Put everything back” always works.');
  } catch (err) {
    showSettingsMessage('The backup could not be made (' + err.message + '), so settings stay locked. No backup, no writes — that rule has no exceptions.', true);
  }
}

async function doRestore() {
  if (!app.backup || !app.driver) return;
  showSettingsMessage('Putting everything back from the backup of ' + app.backup.when + '…');
  try {
    for (const param of PARAMETERS) {
      if (param.locked) continue;
      const original = app.backup.values[param.id];
      if (original !== undefined && original !== app.values[param.id]) {
        await app.driver.writeParameter(param, original);
      }
    }
    app.values = await app.driver.readParameters();
    renderParams();
    showSettingsMessage('Done. Every setting is back to the backup of ' + app.backup.when + '.');
  } catch (err) {
    showSettingsMessage('Restore hit a problem: ' + err.message, true);
  }
}

/* Wiring. */
function init() {
  document.querySelectorAll('input[name="pcPlatform"]')
    .forEach((radio) => radio.addEventListener('change', refreshConnectCard));
  document.querySelectorAll('input[name="pcTransport"]')
    .forEach((radio) => radio.addEventListener('change', refreshConnectCard));
  refreshConnectCard();
  $('pcConnectBtn').addEventListener('click', doConnect);
  $('pcDisconnectBtn').addEventListener('click', doDisconnect);
  for (const tab of ['monitor', 'faults', 'settings', 'help']) {
    $('tab-' + tab).addEventListener('click', () => showTab(tab));
  }
  $('pcHexToggle').addEventListener('change', (event) => {
    $('pcBusLog').classList.toggle('show-raw', event.target.checked);
  });
  $('pcPauseBtn').addEventListener('click', () => {
    app.paused = !app.paused;
    $('pcPauseBtn').textContent = app.paused ? 'Resume' : 'Pause';
  });
  $('pcClearBtn').addEventListener('click', () => { $('pcBusLog').innerHTML = ''; });
  $('pcReadFaultsBtn').addEventListener('click', async () => {
    if (!app.driver) return;
    $('pcFaultResults').innerHTML = '<p class="pc-msg">Asking the chair…</p>';
    try {
      renderFaults(await app.driver.readFaults());
    } catch (err) {
      $('pcFaultResults').innerHTML = '<p class="pc-msg pc-err">' + err.message + '</p>';
    }
  });
  $('pcManualBtn').addEventListener('click', manualLookup);
  document.querySelectorAll('.pc-inject').forEach((button) => {
    button.addEventListener('click', () => {
      if (app.transport && app.transport.isSimulator) {
        app.transport.injectFault(button.dataset.fault);
        showTab('faults');
        if (button.dataset.fault !== 'clear') {
          setTimeout(async () => {
            try { renderFaults(await app.driver.readFaults()); } catch (e) {}
          }, 120);
        } else {
          $('pcFaultResults').innerHTML = '';
        }
      }
    });
  });
  $('pcUnlockBtn').addEventListener('click', doUnlock);
  $('pcRestoreBtn').addEventListener('click', doRestore);
  $('pcDownloadBackupBtn').addEventListener('click', () => {
    if (!app.backup) return;
    const blob = new Blob([JSON.stringify(app.backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my-chair-settings-backup.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  });
  try {
    const saved = localStorage.getItem('bb-pmd-control-backup-v1');
    if (saved) {
      const stored = JSON.parse(saved);
      $('pcBackupBar').hidden = false;
      $('pcBackupInfo').textContent = 'A backup from an earlier visit exists (' + stored.when +
        '). Connect and unlock to restore from it.';
      app.backup = stored;
    }
  } catch (e) { /* no stored backup */ }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
