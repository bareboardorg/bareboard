/* BareBoard Devices — column browser logic. Categories are the ten
   BareBoard device families; devices land here as they come off the bench. */
(function () {
  "use strict";

  var CATEGORIES = [
    {
      name: "Cameras & Drones",
      devices: [
        {
          name: "DJI Drones",
          url: "/devices/dji-drones/",
          status: "Published",
          title: "DJI Drones",
          blurb: "DJI drones: gimbal/airframe anatomy from FCC photos, the full federal record from the 2017 Army memo to the 2025 FCC Covered List, and why no parts book exists.",
          facts: [
            "FCC Covered List, Dec. 22, 2025 (DA 25-1086): no new DJI authorizations \u2014 existing models stay legal to own and fly",
            "FY2025 NDAA \u00a71709 forced the determination; DJI petitioned the Ninth Circuit (No. 26-1029, Feb. 20, 2026)",
            "The record runs a decade: Army memo Aug. 2017, CISA alert May 20, 2019, Entity List Dec. 18, 2020",
            "DJI publishes no parts book and sells no boards \u2014 the exploded coverage is FCC-photo partial, labeled as such"
          ]
        },
        {
          name: "GoPro",
          url: "/devices/gopro/",
          status: "Published",
          title: "GoPro",
          blurb: "GoPro HERO cameras: GP2 silicon, the sacrificial door/lens/battery layer, the Karma recall, and the one sealed camera that kept its removable battery.",
          facts: [
            "The Karma drone recall (CPSC 17-034, Nov. 2016): ~2,500 units and a battery latch; GoPro exited drones by Jan. 2018",
            "GP2, GoPro\u2019s in-house processor, debuted in the HERO10 (2021)",
            "HyperSmooth is computed stabilization \u2014 a gyro\u2019s data and a crop, no gimbal motor",
            "The battery stayed removable through a decade of sealed, waterproof redesigns"
          ]
        },
        {
          name: "Wyze Cam v3",
          url: "/devices/wyze-cam-v3/",
          status: "Published",
          title: "Wyze Cam v3",
          blurb: "Wyze Cam v3: Ingenic T31, FCC ID 2AUIUWYZEC3, UART access, and teardown notes.",
          facts: [
            "Ingenic T31 \u2014 video SoC with H.265 encoding and on-chip AI acceleration",
            "FCC ID 2AUIUWYZEC3 \u2014 the filing includes internal photos and test reports",
            "SPI NOR flash holds the bootloader and firmware \u2014 readable in-circuit with a clip programmer",
            "Serial pads beside the SoC for UART access"
          ]
        }
      ]
    },
    {
      name: "E-Readers & Tablets",
      devices: [
        {
          name: "iPad Family",
          url: "/devices/ipad/",
          status: "Published",
          title: "iPad Family",
          blurb: "iPad models: the first Apple Self Service Repair tablet line (May 29, 2025), laminated displays, glued batteries, and the Epic ruling that opened the App Store.",
          facts: [
            "Self Service Repair reached iPad on May 29, 2025 \u2014 parts and manuals for iPad Air (M2+), iPad Pro (M4), iPad mini (A17 Pro), and iPad (A16) only",
            "Displays are laminated to the glass on most models \u2014 a cracked screen means a display assembly, not a glass swap",
            "The battery is glued, not screwed \u2014 adhesive, not connectors, is the real repair barrier",
            "Epic v. Apple: the April 30, 2025 enforcement order forced external purchase links into US apps"
          ]
        },
        {
          name: "Kindle & Kobo E-Readers",
          url: "/devices/e-readers/",
          status: "Published",
          title: "Kindle & Kobo E-Readers",
          blurb: "Kindle and Kobo e-readers: E Ink, batteries, and two opposite repair policies \u2014 one maker sells you the parts, the other sells you a new reader.",
          facts: [
            "Kobo sells genuine parts with its own iFixit guides (2024): screens, batteries, mainboards, covers",
            "Amazon sells no Kindle parts and publishes no Kindle repair manual",
            "On an e-reader, the E Ink screen is most of the device \u2014 and most of the cost",
            "Opening a waterproof Kobo ends its waterproofing \u2014 the maker\u2019s own warning, carried on our page"
          ]
        }
      ]
    },
    {
      name: "Game Consoles",
      devices: [
        {
          name: "Nintendo Switch Family",
          url: "/devices/nintendo-switch/",
          status: "Published",
          title: "Nintendo Switch Family",
          blurb: "Nintendo Switch models, the Tegra X1, FCC records, and the Joy-Con drift lawsuits.",
          facts: [
            "NVIDIA Tegra X1 SoC across the Switch family",
            "Model numbers decoded: HAC-001 (console), HAC-015/016 (Joy-Cons)",
            "Joy-Con drift \u2014 the defect and the lawsuits it produced",
            "Right-to-repair position and aggressive anti-piracy legal action, documented"
          ]
        },
        {
          name: "PlayStation Family",
          url: "/devices/playstation/",
          status: "Published",
          title: "PlayStation Family",
          blurb: "PlayStation consoles PS1\u2013PS5: the chips, the 2011 PSN hack, and the OtherOS lawsuit.",
          facts: [
            "Cell Broadband Engine (PS3) \u2014 1 PPE + 8 SPEs, an IBM/Sony/Toshiba co-design",
            "Emotion Engine (PS2) \u2014 MIPS-based, 294 MHz custom Sony silicon",
            "The 2011 PlayStation Network hack, documented",
            "OtherOS removal (2010\u20132017) and the PS5\u2019s repair restrictions"
          ]
        },
        {
          name: "Xbox Family",
          url: "/devices/xbox/",
          status: "Published",
          title: "Xbox Family",
          blurb: "Xbox consoles 2001 to Series X|S: the Red Ring\u2019s billion-dollar lesson, storage pairing, and Microsoft\u2019s repair turn.",
          facts: [
            "The Red Ring of Death: Microsoft\u2019s 2007 three-year warranty and $1.05\u2013$1.15 billion charge",
            "AMD APUs from the Xbox One on \u2014 the consoles became PCs",
            "Microsoft now sells replacement controller parts through its own store",
            "No public parts book: the FCC internal photos are the only official look inside"
          ]
        }
      ]
    },
    {
      name: "Media Streamers",
      devices: [
        {
          name: "Apple TV",
          url: "/devices/apple-tv/",
          status: "Published",
          title: "Apple TV",
          blurb: "Apple TV HD and 4K: a fanless A-series box, a sealed remote, and the streaming category\u2019s internal anatomy from the FCC record.",
          facts: [
            "A fanless aluminum box around an A-series chip \u2014 the iPad\u2019s silicon family, passively cooled",
            "No user-serviceable storage: the box is restored over the network, not opened",
            "The Siri Remote is the repair surface \u2014 its battery is sealed inside it",
            "The FCC internal photos show the whole board \u2014 streamer boxes are the most transparent devices Apple ships"
          ]
        },
        {
          name: "Smart TVs & Streaming",
          url: "/devices/smart-tv/",
          status: "Published",
          title: "Smart TVs & Streaming",
          blurb: "Smart TVs and streaming sticks: the three-board diagnosis, the flashlight test, and the $30 computers plugged into the back of the screen.",
          facts: [
            "Most \u201Cdead\u201D TVs are one of three boards: power supply, mainboard, or T-Con",
            "The flashlight test separates a dead backlight from a dead panel in seconds",
            "A streaming stick is a $30 computer \u2014 its FCC photos show a board smaller than its remote\u2019s",
            "TV service manuals stay dealer-gated; the FCC exhibits are the public record"
          ]
        }
      ]
    },
    {
      name: "Networking Gear",
      devices: [
        {
          name: "Mesh Wi-Fi",
          url: "/devices/mesh-wifi/",
          status: "Published",
          title: "Mesh Wi-Fi",
          blurb: "Mesh Wi-Fi systems \u2014 eero, Google Wifi, TP-Link: whole-home radios, subscription feature gates, and the app that becomes the product.",
          facts: [
            "Amazon bought eero on Feb. 11, 2019, for a reported ~$97 million",
            "eero Plus ($9.99/mo, 2022) moved formerly bundled features behind a subscription",
            "Google retired the Google Wifi app in 2021\u201322, migrating control into Google Home",
            "The reported TP-Link investigation (Dec. 2024) is reporting, not a ban \u2014 the page labels it as such"
          ]
        },
        {
          name: "Xfinity XB3 (Arris TG1682G)",
          url: "/devices/xfinity-xb3/",
          status: "Published",
          title: "Xfinity XB3 (Arris TG1682G)",
          blurb: "Xfinity XB3 gateway: specs, the Puma 6 chipset, the FCC record, and the controversies.",
          facts: [
            "Intel Puma 6 (DHCE2652) DOCSIS gateway SoC",
            "FCC filing: internal photos and the manual are public; schematics were withheld under a confidentiality request",
            "The Puma 6 latency defect and the litigation it drew",
            "Bridge mode with persistent hidden SSIDs"
          ]
        },
        {
          name: "Xfinity XB3 \u2014 Full Autopsy",
          url: "/autopsy/xfinity-xb3/",
          status: "Published",
          title: "Xfinity XB3 (Arris TG1682G) \u2014 Autopsy Report",
          blurb: "Our first full autopsy: the gateway we tore down to show what this platform does \u2014 verified findings only, uncertainty dated and marked.",
          facts: [
            "Intel Puma 6 \u201cCat Mountain D0\u201d \u2014 J3 UART, read-only capture",
            "Boot chain documented: U-Boot 1.2.0 / PSPU-Boot 4.2.0.45",
            "Bridge mode with persistent hidden SSIDs",
            "Personally owned, pre-paid unit \u2014 no rented hardware"
          ]
        }
      ]
    },
    {
      name: "Other",
      devices: [
        {
          name: "CPAP Machines",
          url: "/devices/cpap/",
          status: "Published",
          title: "CPAP Machines",
          blurb: "CPAP machines: blower and sensor anatomy, your therapy data on an SD card, the Philips foam recall (Z-1974-2021), and the FDA warnings that outrank everything else on the page.",
          facts: [
            "Philips foam recall Z-1974-2021: 15,357,775 devices worldwide \u2014 the largest in sleep-medicine history",
            "The 2024 consent decree bars new US Philips CPAP/BiPAP sales until the FDA confirms compliance",
            "Your detailed therapy data sits on an SD card in readable files \u2014 free software (OSCAR) shows what the app summary hides",
            "The FDA\u2019s instruction stands: do not stop therapy on your own \u2014 talk to your doctor"
          ]
        },
        {
          name: "EV Chargers",
          url: "/devices/ev-chargers/",
          status: "Published",
          title: "EV Chargers (EVSE)",
          blurb: "EV chargers: the wall box is a careful switch, not a charger \u2014 the J1772/J3400 pilot protocol, the OpenEVSE open design, NEC 625, and the JuiceBox shutdown.",
          facts: [
            "The charger is in the car; the wall box negotiates with a 1 kHz pilot signal whose duty cycle announces the current limit",
            "Tesla opened its connector on Nov. 11, 2022; SAE standardized it as J3400 in December 2023",
            "OpenEVSE publishes full schematics and parts for a complete charger \u2014 the category\u2019s open reference",
            "Enel X Way\u2019s Oct. 2024 shutdown orphaned JuiceBox smarts \u2014 the standard\u2019s dumb layer kept charging"
          ]
        },
        {
          name: "E-Bike Controllers",
          url: "/devices/ebike-controllers/",
          status: "Published",
          title: "E-Bike Controllers",
          blurb: "E-bike controllers: torque and cadence sensing, the MOSFET inverter, VESC\u2019s open schematics, Bafang\u2019s owner-programmable UART, Bosch\u2019s dealer lock \u2014 and the battery fire record.",
          facts: [
            "FDNY counted 268 lithium-ion battery fires and 18 deaths in New York City in 2023",
            "VESC is a fully open-source controller: published schematics and firmware",
            "Bafang\u2019s UART mid-drives are owner-configurable with a programming cable; Bosch diagnostics are dealer-only",
            "Your bike\u2019s legal class (1/2/3) is a number in the controller\u2019s firmware"
          ]
        },
        {
          name: "Solar Basics",
          url: "/devices/solar-basics/",
          status: "Published",
          title: "Solar Basics",
          blurb: "Solar basics: the whole system in build order \u2014 module datasheets, strings, rapid shutdown (NEC 690.12), inverters, storage \u2014 and the tariff that rewired the economics.",
          facts: [
            "Panels are live whenever light hits them \u2014 a residential string can reach 600 V DC",
            "Five numbers define any panel: Voc, Isc, Vmp, Imp, Pmax \u2014 all on the public datasheet",
            "Module-level rapid shutdown (NEC 690.12, 2017 NEC) is the firefighters\u2019 rule",
            "California\u2019s NEM 3.0 (effective Apr. 15, 2023) cut export compensation ~75% \u2014 policy, not physics"
          ]
        },
        {
          name: "TI-84 Plus Family",
          url: "/devices/ti-84-plus/",
          status: "Published",
          title: "TI-84 Plus Family",
          blurb: "TI-84 Plus calculators: variants, the Z80 lineage, and the 2009 DMCA signing-key controversy.",
          facts: [
            "Zilog Z80 (original Plus) \u2014 an 8-bit CPU from 1976, clocked at 15 MHz",
            "Zilog eZ80 (CE models) \u2014 24-bit enhanced Z80, clocked at 48 MHz",
            "The 2009 signing-key DMCA battle \u2014 TI vs. its own users",
            "TI\u2019s proprietary ASIC integrates memory controller, display driver, and USB \u2014 no public datasheet"
          ]
        },
        {
          name: "Flipper Zero",
          url: "/devices/flipper-zero/",
          status: "Published",
          title: "Flipper Zero",
          blurb: "Flipper Zero: FCC record, every major component, manuals, regulatory actions, and how to fix it.",
          facts: [
            "FCC ID 2A2V6-FZ \u2014 the filing includes internal photos, RF test reports, and the user manual",
            "Built around the STM32WB55, with open firmware and schematics on GitHub (flipperdevices)",
            "128\u00d764 1.4-inch monochrome LCD; 2000 mAh LiPo with USB-C charging",
            "100 \u00d7 40 \u00d7 25 mm, 102 g"
          ]
        },
        {
          name: "Siemens S7-300 CPU 315-2 DP \u2014 Autopsy BB-AR-001",
          url: "/autopsy/s7-300-cpu-315-2dp.html",
          status: "Published",
          title: "Autopsy Report BB-AR-001 \u2014 Siemens S7-300 CPU 315-2 DP",
          blurb: "A retired CPU 315-2 DP module under the knife: findings verified from Siemens\u2019 public documentation, a chip inventory, and dated bench notes.",
          facts: [
            "Module 6ES7315-2AG10-0AB0 \u2014 MPI and PROFIBUS DP interfaces, up to 12 Mbit/s, up to 124 DP slaves",
            "Scales to 16,384 digital I/O and 1,024 analog I/O across 4 racks",
            "24 V DC supply input; the MMC memory card is inspected read-only, never written",
            "Siemens\u2019 Installation Operating Instructions (A5E00105492-08) are public documentation"
          ]
        },
        {
          name: "Siemens SIMATIC S7-300 Family \u2014 Autopsy #001",
          url: "/level-3-systems/autopsy-001-s7-300.html",
          status: "Published",
          title: "Autopsy Report #001 \u2014 Siemens SIMATIC S7-300 PLC Family",
          blurb: "Autopsy 001: the Siemens S7-300 PLC family \u2014 public architecture from Siemens manuals, module anatomy from a retired unit.",
          facts: [
            "Public architecture drawn from Siemens-published manuals",
            "Backplane addressing rules and slot constraints",
            "PROFIBUS-DP slave configuration via public GSD files",
            "S7-300 hardware is widely available as retired surplus \u2014 an ideal bench PLC for education"
          ]
        },
        {
          name: "Philips IntelliVue \u2014 Autopsy #002",
          url: "/level-3-systems/autopsy-002-intellivue.html",
          status: "Published",
          title: "Autopsy Report #002 \u2014 Philips IntelliVue Patient Monitor Family",
          blurb: "Autopsy 002: the Philips IntelliVue patient-monitor family \u2014 public architecture, measurement modules, and preservation notes.",
          facts: [
            "Public architecture from Philips-published documentation",
            "Measurement module specifications and accuracy claims",
            "Decommissioning and data-sanitization procedures",
            "Retired IntelliVue units are common hospital surplus \u2014 excellent for biomedical-engineering education"
          ]
        },
        {
          name: "Allen-Bradley ControlLogix 1756 \u2014 Autopsy #003",
          url: "/level-3-systems/autopsy-003-controllogix.html",
          status: "Published",
          title: "Autopsy Report #003 \u2014 Allen-Bradley ControlLogix 1756 Platform",
          blurb: "Autopsy 003: the Allen-Bradley ControlLogix platform \u2014 module anatomy and public architecture from Rockwell\u2019s literature library.",
          facts: [
            "Rockwell maintains an extensive public literature library for the platform",
            "EtherNet/IP covered through ODVA\u2019s public specifications",
            "System design considerations and grounding guidelines from public documents",
            "Research rule: lab and test-rig units only \u2014 never in-service control systems"
          ]
        }
      ]
    },
    {
      name: "PCs & Single-Board",
      devices: [
        {
          name: "Chromebooks",
          url: "/devices/chromebooks/",
          status: "Published",
          title: "Chromebooks",
          blurb: "Chromebooks: the school-fleet computer, PIRG\u2019s \u2018Chromebook Churn\u2019 report, 10-year updates, and a recovery design that assumes repair.",
          facts: [
            "PIRG\u2019s \u2018Chromebook Churn\u2019 (April 2023) put the cost of short support windows to US schools at $1.8 billion",
            "Models from 2021 onward receive 10 years of automatic updates (announced Sept. 14, 2023)",
            "Firmware write-protect is hardware: a screw, or the H1/Titan security chip",
            "Recovery mode is built in \u2014 a Chromebook is designed to be re-imaged by a student with a USB stick"
          ]
        },
        {
          name: "Raspberry Pi Family",
          url: "/devices/raspberry-pi/",
          status: "Published",
          title: "Raspberry Pi Family",
          blurb: "Raspberry Pi models, Broadcom SoCs, FCC records, and the supply-chain controversies.",
          facts: [
            "FCC ID 2ABCB-RPI4B \u2014 Raspberry Pi 4 Model B; the 3 Model B/B+ is 2ABCB-RPI3BP",
            "The original Pi 1 Model B launched with 256 MB; 512 MB arrived in October 2012",
            "Broadcom dependency \u2014 one SoC vendor for the whole line",
            "The 2021 price increase and the 2021\u20132023 supply shortages, documented"
          ]
        },
        {
          name: "Raspberry Pi Pico W",
          url: "/devices/pico-w/",
          status: "Published",
          title: "Raspberry Pi Pico W",
          blurb: "Raspberry Pi Pico W: RP2040, Infineon CYW43439 Wi-Fi, FCC ID 2ABCB-PICOW, and getting started.",
          facts: [
            "RP2040 \u2014 dual ARM Cortex-M0+ at 133 MHz, 264 KB SRAM, 2 MB external QSPI flash; Raspberry Pi\u2019s first in-house silicon",
            "Infineon CYW43439 \u2014 2.4 GHz Wi-Fi 4 + Bluetooth 5.2 combo, connected over SPI",
            "FCC ID 2ABCB-PICOW",
            "BOOTSEL: firmware in ten seconds, no programmer needed"
          ]
        },
        {
          name: "ESP32 Family",
          url: "/devices/esp32/",
          status: "Published",
          title: "ESP32 Family",
          blurb: "ESP32 microcontrollers: variants, FCC records, and security research including CVE-2025-27840.",
          facts: [
            "Variants span the original ESP32 to the S2, S3, C3, C6, H2, and P4 \u2014 the H2 has no Wi-Fi (802.15.4 only)",
            "Espressif module grants sit under FCC grantee code 2AC7Z (WROOM-32, WROOM-32E)",
            "CVE-2025-27840: undocumented Bluetooth HCI commands (2025)",
            "Espressif\u2019s open documentation \u2014 the positive example"
          ]
        },
        {
          name: "Windows Laptops, Desktops & Surface",
          url: "/devices/windows-pcs/",
          status: "Published",
          title: "Windows Laptops, Desktops & Surface",
          blurb: "ThinkPads to the Surface: free factory service manuals, board numbers, rail-by-rail no-POST diagnosis \u2014 and the PC glued shut like a phone.",
          facts: [
            "ThinkPad Hardware Maintenance Manuals are free and public \u2014 exploded views, every screw and FRU",
            "The Surface Laptop scored 0/10 from iFixit in 2017: a PC glued like a phone",
            "Business laptops are the most-repaired computers on Earth \u2014 and the best documented",
            "No-POST diagnosis is a rail-by-rail voltage walk, from the adapter to the power button"
          ]
        }
      ]
    },
    {
      name: "Phones",
      devices: [
        {
          name: "iPhone Family",
          url: "/devices/iphone/",
          status: "Published",
          title: "iPhone Family",
          blurb: "iPhone repair, honestly: diagnosis first, battery and screen service, parts pairing and calibration locks, and the board-level wall.",
          facts: [
            "Parts pairing: the repair is not finished until Apple\u2019s software calibrates the part",
            "Repair Assistant (iOS 18) calibrates genuine parts \u2014 including used ones \u2014 on the phone itself",
            "Oregon\u2019s SB 1596 (2024) is the first US law banning parts pairing",
            "No public schematics and no logic boards for sale: board-level repair works in the dark"
          ]
        }
      ]
    },
    {
      name: "Smart Home / IoT",
      devices: [
        {
          name: "Smart Locks",
          url: "/devices/smart-locks/",
          status: "Published",
          title: "Smart Locks",
          blurb: "Smart locks: ANSI/BHMA grades, the DEF CON 24 Bluetooth results, and why free egress is a life-safety code, not a feature.",
          facts: [
            "At DEF CON 24 (2016), researchers opened 12 of the 16 Bluetooth smart locks they tested",
            "ANSI/BHMA A156.36 grades the lock hardware \u2014 Grade 1 is the commercial bar",
            "Free egress is code (NFPA 101 / IBC): the inside handle must always open the door, electronics or not",
            "ASSA ABLOY acquired August Home in October 2017 \u2014 the lock industry absorbed the startups"
          ]
        },
        {
          name: "Smart Thermostats",
          url: "/devices/smart-thermostats/",
          status: "Published",
          title: "Smart Thermostats",
          blurb: "Smart thermostats: Nest\u2019s $3.2B acquisition, Revolv\u2019s shutdown, and the demand-response events that moved thousands of homes\u2019 setpoints at once.",
          facts: [
            "Google acquired Nest for $3.2 billion on Jan. 13, 2014",
            "Revolv\u2019s hub was remotely shut down on May 15, 2016 \u2014 the smart home\u2019s first famous bricking",
            "\u2018Works with Nest\u2019 ended Aug. 31, 2019 \u2014 an API shutdown as a product event",
            "On Aug. 31, 2022, ~22,000 Xcel Energy Colorado customers found their thermostats locked during an energy emergency \u2014 demand response, working as enrolled"
          ]
        },
        {
          name: "Robot Vacuums",
          url: "/devices/robot-vacuums/",
          status: "Published",
          title: "Robot Vacuums",
          blurb: "Robot vacuums: LiDAR navigation, owner-replaceable wear parts, the Roomba photo-leak investigation, and iRobot\u2019s fall.",
          facts: [
            "MIT Technology Review (Dec. 19, 2022): Roomba test-unit images, including of a person on a toilet, leaked via gig-worker data labelers",
            "Amazon\u2019s $1.7B iRobot acquisition (Aug. 5, 2022) was terminated on Jan. 29, 2024",
            "iRobot filed Chapter 11 on Dec. 14, 2025, with a sale to Picea Robotics",
            "Brushes, filters, and wheels are owner-replaceable by design; the LiDAR turret and main board are not"
          ]
        },
        {
          name: "Amazon Echo Dot (5th Gen)",
          url: "/devices/echo-dot/",
          status: "Published",
          title: "Amazon Echo Dot (5th Gen)",
          blurb: "Amazon Echo Dot (5th generation): AZ2 Neural Edge processor, chip identification, FCC ID QD5-DOTH-500, and debug access.",
          facts: [
            "AZ2 Neural Edge processor for on-device speech processing",
            "FCC ID QD5-DOTH-500",
            "MediaTek MT7653BSN \u2014 Wi-Fi/Bluetooth combo on a small daughterboard",
            "A debug header hides under the rubber base"
          ]
        },
        {
          name: "Google Nest Mini (2nd Gen)",
          url: "/devices/nest-mini/",
          status: "Published",
          title: "Google Nest Mini (2nd Gen)",
          blurb: "Google Nest Mini (2nd generation): Synaptics AS370 with an integrated ML engine, FCC ID A4R-H2C, teardown and chip details.",
          facts: [
            "Synaptics AS370 \u2014 the main application SoC",
            "The ML engine is integrated in the AS370 \u2014 on-device speech recognition, not a separate chip",
            "FCC ID A4R-H2C",
            "Ports: there are none to use \u2014 power is a proprietary DC barrel"
          ]
        },
        {
          name: "TP-Link Kasa HS103",
          url: "/devices/kasa-hs103/",
          status: "Published",
          title: "TP-Link Kasa HS103 Smart Plug",
          blurb: "TP-Link Kasa HS103: a Realtek RTL8710 running the whole plug, teardown and firmware access.",
          facts: [
            "Realtek RTL8710 \u2014 ARM Cortex-M3 at up to 83 MHz, 512 KB RAM, 1 MB flash, and 2.4 GHz Wi-Fi in one chip",
            "Hongfa HF32FV-16 \u2014 the mains relay doing the actual switching",
            "The serial console runs at 38400 8N1 \u2014 not the usual 115200",
            "Serial and flash access are documented in the entry points"
          ]
        },
        {
          name: "Sonoff Basic R3",
          url: "/devices/sonoff-basic-r3/",
          status: "Published",
          title: "Sonoff Basic R3",
          blurb: "Sonoff Basic R3: ESP8285, its own FCC grant, DIY mode, the one-button flash procedure, and teardown notes.",
          facts: [
            "Espressif ESP8285 \u2014 Wi-Fi SoC with 1 MB of flash integrated into the package",
            "FCC ID 2APN5BASICR3 \u2014 the Basic R3 has its own grant",
            "A four-pin serial header footprint sits on the board (3.3 V, TX, RX, GND); the case button is GPIO0",
            "Hold the button (GPIO0 low), apply 3.3 V power, release \u2014 the ESP8285 is in UART download mode"
          ]
        }
      ]
    },
    {
      name: "Wearables",
      devices: [
        {
          name: "Apple Watch",
          url: "/devices/apple-watch/",
          status: "Published",
          title: "Apple Watch",
          blurb: "Apple Watch: sealed-case anatomy, the Masimo ITC blood-oxygen fight, and a device whose repair program does not exist.",
          facts: [
            "The ITC exclusion order (Oct. 26, 2023) halted US sales of Series 9 and Ultra 2 over Masimo\u2019s patents",
            "Blood oxygen returned Aug. 14, 2025 \u2014 computed on the paired iPhone instead of the watch",
            "No Self Service Repair program covers any Apple Watch; a battery swap is a whole-unit exchange",
            "The ECG app was the FDA\u2019s first De Novo authorization of its kind for a watch (Sept. 2018)"
          ]
        },
        {
          name: "AirPods",
          url: "/devices/airpods/",
          status: "Published",
          title: "AirPods",
          blurb: "AirPods, Pro, and Max: the 0/10 earbud, H1/H2 silicon, an FDA-authorized hearing aid inside an earbud, and the sealed battery that ends every pair.",
          facts: [
            "iFixit scored the original AirPods 0/10 (2016) \u2014 glued shut, battery entombed",
            "The AirPods Pro sound-quality program (Oct. 30, 2020) replaced affected Pro units for three years",
            "AirPods Pro 2\u2019s Hearing Aid Feature was FDA-authorized on Sept. 12, 2024 \u2014 OTC hearing-aid software in a consumer earbud",
            "AirPods Max is the exception: screws, and cushions and a headband that detach by design"
          ]
        },
        {
          name: "Hearing Aids",
          url: "/devices/hearing-aids/",
          status: "Published",
          title: "Hearing Aids",
          blurb: "Hearing aids: RIC/BTE anatomy, the owner-replaceable receiver, the FDA\u2019s OTC category (21 CFR 800.30) and red-flag warnings \u2014 and the fitting software that is the real gate.",
          facts: [
            "The FDA\u2019s OTC category took effect Oct. 17, 2022 (21 CFR 800.30): adults, perceived mild-to-moderate loss, no prescription",
            "GAO-24-106854: prescription pairs run $1,000\u2013$6,000; OTC aids roughly $200\u2013$1,000+",
            "The receiver \u2014 the in-canal speaker \u2014 is the most-replaced part, and on RIC aids it is owner-replaceable",
            "A clogged wax guard is the #1 \u2018dead aid\u2019 cause \u2014 a 60-second owner fix"
          ]
        }
      ]
    }
  ];

  var strip = document.getElementById("col-strip");
  if (!strip) return;

  var selectedCategory = null;
  var selectedDevice = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clearFrom() {
    while (strip.firstChild) strip.removeChild(strip.firstChild);
  }

  function makeColumn(headText) {
    var col = el("section", "browser-col");
    col.appendChild(el("div", "col-head", headText));
    return col;
  }

  function renderCategoryColumn() {
    var col = makeColumn("Categories");
    var list = el("ul", "col-rows");
    CATEGORIES.forEach(function (cat) {
      var li = document.createElement("li");
      var btn = el("button", "col-row", null);
      btn.type = "button";
      btn.setAttribute("aria-selected", cat === selectedCategory ? "true" : "false");
      var label = el("span", null, cat.name);
      var chev = el("span", "chev", "\u203a");
      chev.setAttribute("aria-hidden", "true");
      btn.appendChild(label);
      btn.appendChild(chev);
      btn.addEventListener("click", function () {
        selectedCategory = cat;
        selectedDevice = null;
        render();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
    col.appendChild(list);
    return col;
  }

  function renderDeviceColumn(cat) {
    var col = makeColumn(cat.name);
    var list = el("ul", "col-rows");
    if (cat.devices.length === 0) {
      var li = document.createElement("li");
      li.appendChild(el("div", "col-empty", "Nothing on the bench yet."));
      list.appendChild(li);
    } else {
      cat.devices.forEach(function (dev) {
        var li = document.createElement("li");
        var btn = el("button", "col-row", null);
        btn.type = "button";
        btn.setAttribute("aria-selected", dev === selectedDevice ? "true" : "false");
        var label = el("span", null, dev.name);
        var chev = el("span", "chev", "\u203a");
        chev.setAttribute("aria-hidden", "true");
        btn.appendChild(label);
        btn.appendChild(chev);
        btn.addEventListener("click", function () {
          selectedDevice = dev;
          render();
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
    }
    col.appendChild(list);
    return col;
  }

  function renderPreviewColumn(dev) {
    var col = makeColumn("Preview");
    var pane = el("div", "col-preview");
    pane.appendChild(el("span", "preview-status", dev.status));
    pane.appendChild(el("h2", null, dev.title));
    pane.appendChild(el("p", null, dev.blurb));
    var facts = el("ul", "facts");
    dev.facts.forEach(function (f) {
      facts.appendChild(el("li", null, f));
    });
    pane.appendChild(facts);
    var link = el("a", "preview-link", "Read the full report \u2192");
    link.href = dev.url;
    pane.appendChild(link);
    col.appendChild(pane);
    return col;
  }

  function render() {
    clearFrom();
    strip.appendChild(renderCategoryColumn());
    if (selectedCategory) {
      strip.appendChild(renderDeviceColumn(selectedCategory));
      if (selectedDevice) {
        strip.appendChild(renderPreviewColumn(selectedDevice));
      }
    }
  }

  render();
})();
