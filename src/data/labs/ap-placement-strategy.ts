import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ap-placement-strategy",
  version: 1,
  title: "Access Point Placement Strategy",
  tier: "beginner",
  track: "wireless-networking",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["wifi", "access-point", "placement", "coverage", "design"],
  description:
    "Decide on optimal access point placement based on floor plans, building materials, user density, and coverage requirements for reliable wireless connectivity.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Evaluate building materials and their impact on RF signal propagation",
    "Determine AP placement based on coverage overlap and user density",
    "Apply antenna selection principles for different mounting scenarios",
  ],
  sortOrder: 302,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "ap-open-office",
      title: "Open Office Floor AP Placement",
      context:
        "A 10,000 sq ft open-plan office needs full Wi-Fi coverage. The ceiling is 10 ft with drop-tile panels. There are 80 desks arranged in pods of 8. The IT team has 4 APs with internal omnidirectional antennas.",
      displayFields: [
        { label: "Area", value: "10,000 sq ft open plan" },
        { label: "Ceiling Height", value: "10 ft (drop tile)" },
        { label: "AP Count", value: "4 APs available" },
        { label: "Antenna Type", value: "Internal omnidirectional" },
      ],
      logEntry:
        "Floor Dimensions: 100 ft x 100 ft\nObstacles: Low cubicle walls (4 ft), no internal walls\nTarget RSSI: -67 dBm minimum\nEstimated AP coverage radius at -67 dBm: ~50 ft (ceiling mount)\nRecommended overlap: 15-20% between cells",
      actions: [
        { id: "act-grid", label: "Mount 4 APs in a grid pattern on the ceiling, evenly spaced" },
        { id: "act-perimeter", label: "Mount 4 APs along the perimeter walls" },
        { id: "act-center", label: "Mount all 4 APs in the center cluster" },
        { id: "act-corner", label: "Mount 1 AP in each corner of the room" },
      ],
      correctActionId: "act-grid",
      rationales: [
        {
          id: "rat-grid",
          text: "A ceiling-mounted grid pattern with even spacing provides uniform coverage with 15-20% cell overlap, ensuring seamless roaming and consistent signal strength across the entire floor.",
        },
        {
          id: "rat-perimeter-bad",
          text: "Perimeter mounting wastes half the signal radiating outside the building and creates a weak coverage hole in the center.",
        },
        {
          id: "rat-center-bad",
          text: "Clustering APs in the center causes severe co-channel interference and leaves perimeter areas with weak signal.",
        },
      ],
      correctRationaleId: "rat-grid",
      feedback: {
        perfect:
          "Correct! Ceiling-mounted grid spacing ensures uniform -67 dBm coverage with proper cell overlap for seamless roaming.",
        partial:
          "Close, but the key is even spacing in a grid pattern to maintain uniform signal and proper overlap between AP cells.",
        wrong:
          "Perimeter or corner mounting wastes signal outside the building. Center clustering causes interference. A ceiling grid provides the most uniform coverage.",
      },
    },
    {
      type: "action-rationale",
      id: "ap-multi-wall",
      title: "Multi-Room Medical Clinic",
      context:
        "A medical clinic has 12 exam rooms with drywall partitions, a nursing station, and a waiting area. Each exam room needs reliable coverage for wireless medical devices. The walls contain plumbing and some lead-lined X-ray shielding in two rooms.",
      displayFields: [
        { label: "Rooms", value: "12 exam rooms + nursing station + waiting area" },
        { label: "Wall Type", value: "Drywall (3-5 dB loss), 2 rooms with lead lining (15+ dB loss)" },
        { label: "Devices", value: "Medical tablets, vitals monitors, badge readers" },
        { label: "Compliance", value: "HIPAA - need segmented wireless" },
      ],
      logEntry:
        "RF Attenuation Measurements:\n  Standard drywall: 3 dB loss per wall\n  Lead-lined X-ray room: 15-20 dB loss\n  Fire door: 6 dB loss\n  Estimated APs needed: 5-6 (one per 2-3 standard rooms, dedicated for lead rooms)",
      actions: [
        { id: "act-dedicated", label: "Place dedicated APs inside lead-lined rooms and shared APs for standard rooms" },
        { id: "act-highpower", label: "Use 2 high-power APs to blast through all walls" },
        { id: "act-hallway", label: "Place all APs in the hallway ceiling" },
        { id: "act-one-per", label: "Place one AP per room for maximum coverage" },
      ],
      correctActionId: "act-dedicated",
      rationales: [
        {
          id: "rat-lead",
          text: "Lead-lined rooms attenuate RF by 15-20 dB, making external coverage unreliable. Dedicated APs inside these rooms ensure medical devices maintain connectivity.",
        },
        {
          id: "rat-highpower-bad",
          text: "High transmit power increases interference without solving the lead-shielding problem. It also causes asymmetric links where APs hear clients but clients cannot hear APs.",
        },
        {
          id: "rat-hallway-bad",
          text: "Hallway-only placement creates elongated cells and cannot penetrate lead-lined rooms reliably.",
        },
      ],
      correctRationaleId: "rat-lead",
      feedback: {
        perfect:
          "Excellent! Lead-lined rooms absolutely need their own APs due to 15-20 dB attenuation. Standard drywall rooms can share APs effectively.",
        partial:
          "Good instinct, but the critical factor is the lead shielding -- those rooms must have dedicated APs regardless of other placement decisions.",
        wrong:
          "High power or hallway placement cannot overcome lead shielding. The 15-20 dB loss through lead-lined walls requires dedicated APs inside those rooms.",
      },
    },
    {
      type: "action-rationale",
      id: "ap-outdoor-courtyard",
      title: "Outdoor Courtyard Wi-Fi",
      context:
        "A corporate campus courtyard (150 ft x 80 ft) needs outdoor Wi-Fi for employee use during breaks. The area is surrounded by 3-story buildings on three sides. APs can be mounted on building walls facing the courtyard.",
      displayFields: [
        { label: "Area", value: "150 ft x 80 ft outdoor courtyard" },
        { label: "Surroundings", value: "3-story buildings on three sides" },
        { label: "Expected Users", value: "50-100 during lunch hours" },
        { label: "AP Options", value: "Outdoor-rated APs with directional or omni antennas" },
      ],
      logEntry:
        "Site Considerations:\n  Weather: Rain, wind exposure\n  Mounting: Building walls at 12 ft height\n  Power: PoE from indoor switches via conduit\n  Interference: Indoor APs on floors 1-3 bleed into courtyard\n  IP rating required: IP67 minimum",
      actions: [
        { id: "act-directional", label: "Mount 2 outdoor APs with directional antennas on opposite building walls" },
        { id: "act-omni-center", label: "Mount 1 omnidirectional AP on a pole in the courtyard center" },
        { id: "act-indoor", label: "Rely on signal bleed from indoor APs through windows" },
        { id: "act-mesh-outdoor", label: "Deploy 6 outdoor mesh nodes around the perimeter" },
      ],
      correctActionId: "act-directional",
      rationales: [
        {
          id: "rat-directional",
          text: "Two directional APs on opposite walls focus RF energy into the courtyard, providing overlapping coverage while minimizing interference with indoor APs in the surrounding buildings.",
        },
        {
          id: "rat-bleed-bad",
          text: "Indoor signal bleed is unreliable outdoors -- glass attenuates 6-8 dB, and indoor APs are not designed for outdoor coverage patterns.",
        },
        {
          id: "rat-mesh-over",
          text: "Six mesh nodes is over-provisioned for this space and creates unnecessary co-channel interference in a confined outdoor area.",
        },
      ],
      correctRationaleId: "rat-directional",
      feedback: {
        perfect:
          "Perfect! Directional antennas on opposite walls focus signal into the courtyard and minimize bleed into surrounding buildings.",
        partial:
          "Outdoor APs are the right call, but directional antennas are key to focusing coverage into the courtyard rather than wasting signal.",
        wrong:
          "Indoor signal bleed and single omnidirectional APs cannot reliably cover 150x80 ft. Directional antennas aimed inward from opposite walls provide the best outdoor courtyard coverage.",
      },
    },
  ],
  hints: [
    "Building materials cause RF attenuation: drywall ~3 dB, concrete ~12 dB, lead shielding ~15-20 dB loss per wall.",
    "APs should be ceiling-mounted with 15-20% overlap between coverage cells for seamless roaming.",
    "Directional antennas focus RF energy in one direction, making them ideal for hallways, outdoor areas, and targeted coverage.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "AP placement is the foundation of wireless network design. Enterprise wireless engineers use tools like Ekahau to simulate coverage before deploying hardware, saving thousands in rework costs.",
  toolRelevance: [
    "Ekahau Pro / AI Pro",
    "iBwave Design",
    "Floor plan tools (Visio, AutoCAD)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
