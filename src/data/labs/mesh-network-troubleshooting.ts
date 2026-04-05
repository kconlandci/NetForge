import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "mesh-network-troubleshooting",
  version: 1,
  title: "Debug Mesh Network Issues",
  tier: "intermediate",
  track: "wireless-networking",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["mesh", "troubleshooting", "backhaul", "multi-hop", "performance"],
  description:
    "Troubleshoot common mesh networking issues including backhaul bottlenecks, multi-hop latency, mesh node failures, and topology problems affecting client performance.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Diagnose mesh backhaul throughput bottlenecks between nodes",
    "Identify multi-hop latency issues and determine optimal mesh topology",
    "Troubleshoot mesh node connectivity failures and self-healing behavior",
  ],
  sortOrder: 309,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "mesh-backhaul-bottleneck",
      title: "Mesh Backhaul Throughput Degradation",
      objective:
        "Clients connected to a remote mesh node report 15 Mbps throughput when the ISP provides 500 Mbps. Investigate the mesh backhaul to find the bottleneck.",
      investigationData: [
        {
          id: "src-topology",
          label: "Mesh Topology Map",
          content:
            "Gateway Node (wired to ISP router)\n  |\n  |-- Backhaul: 5 GHz Ch 36, 80 MHz\n  |   Link rate: 866 Mbps (MCS 9, 2SS)\n  |   Actual throughput: 420 Mbps\n  |\n  Node-2 (living room)\n  |\n  |-- Backhaul: 5 GHz Ch 36, 80 MHz  *** SAME CHANNEL ***\n  |   Link rate: 866 Mbps\n  |   Actual throughput: 180 Mbps (half-duplex sharing)\n  |\n  Node-3 (remote bedroom)\n  |\n  Client laptop: 15 Mbps actual",
          isCritical: true,
        },
        {
          id: "src-backhaul-stats",
          label: "Backhaul Radio Statistics",
          content:
            "Gateway <-> Node-2 backhaul:\n  Channel: 36 (5 GHz, 80 MHz)\n  RSSI: -52 dBm\n  TX/RX Utilization: 78%\n\nNode-2 <-> Node-3 backhaul:\n  Channel: 36 (5 GHz, 80 MHz) *** SHARES RADIO WITH HOP 1 ***\n  RSSI: -68 dBm\n  TX/RX Utilization: 85%\n\nProblem: Single-radio backhaul sharing one channel across 2 hops.\nEach hop halves the available throughput (half-duplex penalty).",
          isCritical: true,
        },
        {
          id: "src-client-stats",
          label: "Client Connection Details",
          content:
            "Connected to: Node-3 (2.4 GHz radio)\nChannel: 6\nLink rate: 72 Mbps (802.11n)\nRSSI: -58 dBm\nActual throughput: 15 Mbps\n\nNote: Client is on 2.4 GHz because Node-3's 5 GHz radio is\nused entirely for mesh backhaul to Node-2.",
        },
      ],
      actions: [
        { id: "act-triband", label: "Replace with tri-band mesh nodes that have a dedicated 5 GHz backhaul radio" },
        { id: "act-wired", label: "Run an Ethernet cable to Node-3 for wired backhaul" },
        { id: "act-channel", label: "Change the backhaul between Node-2 and Node-3 to a different channel" },
        { id: "act-move", label: "Move Node-3 closer to the gateway to eliminate the hop" },
      ],
      correctActionId: "act-triband",
      rationales: [
        {
          id: "rat-triband",
          text: "Tri-band mesh nodes have a dedicated 5 GHz radio for backhaul, eliminating the half-duplex penalty. Each hop gets full throughput, and clients get their own 5 GHz radio.",
        },
        {
          id: "rat-channel-same",
          text: "Changing channels does not solve the fundamental problem -- with dual-band nodes, the same radio handles both backhaul and client traffic, halving available capacity per hop.",
        },
        {
          id: "rat-wired-alt",
          text: "Wired backhaul is the best solution if cabling is feasible, but it was not presented as an option in the original deployment. Tri-band is the wireless-only solution.",
        },
      ],
      correctRationaleId: "rat-triband",
      feedback: {
        perfect:
          "Correct! Tri-band mesh eliminates the shared-radio bottleneck by providing a dedicated backhaul radio, restoring full throughput at each hop.",
        partial:
          "Right problem identification, but changing channels on a dual-band system does not help -- the radio still time-shares between backhaul and client service.",
        wrong:
          "The bottleneck is single-radio backhaul sharing a channel across two hops. Tri-band mesh nodes with a dedicated backhaul radio solve this architectural limitation.",
      },
    },
    {
      type: "investigate-decide",
      id: "mesh-node-offline",
      title: "Mesh Node Fails to Rejoin",
      objective:
        "After a power outage, one mesh node came back online but cannot rejoin the mesh network. Clients near it have no connectivity. Diagnose the failure.",
      investigationData: [
        {
          id: "src-node-status",
          label: "Mesh Node Status (Node-Kitchen)",
          content:
            "Status: ISOLATED - Not connected to mesh\nUptime: 12 minutes (since power restore)\nFirmware: v2.4.1\nLED: Pulsing amber (searching for mesh parent)\n\nBackhaul scan results:\n  Gateway: Not found (out of range)\n  Node-LivingRoom: Found, RSSI -74 dBm\n    Mesh join attempt: FAILED\n    Error: \"Mesh ID mismatch - expected 'HomeMesh_A3F2' got 'HomeMesh_B7C1'\"",
          isCritical: true,
        },
        {
          id: "src-gateway-log",
          label: "Gateway Node Event Log",
          content:
            "2026-03-27 14:22:00 [WARN] Power loss detected, shutting down\n2026-03-27 14:45:12 [INFO] Boot complete, firmware v2.5.0 (auto-updated)\n2026-03-27 14:45:30 [INFO] Mesh network created: HomeMesh_B7C1\n2026-03-27 14:46:01 [INFO] Node-LivingRoom joined mesh (firmware auto-updated to v2.5.0)\n2026-03-27 14:46:15 [WARN] Node-Kitchen mesh join rejected: firmware mismatch (v2.4.1 vs v2.5.0)\n2026-03-27 14:47:00 [WARN] Node-Kitchen mesh join rejected: mesh ID mismatch",
          isCritical: true,
        },
        {
          id: "src-firmware",
          label: "Firmware Version Check",
          content:
            "Gateway: v2.5.0 (updated during reboot)\nNode-LivingRoom: v2.5.0 (updated during reboot)\nNode-Kitchen: v2.4.1 (failed to update - restored from stale cache)\n\nv2.5.0 changelog: \"New mesh protocol with changed mesh ID format\"\nNote: v2.4.1 and v2.5.0 mesh protocols are NOT backward compatible",
        },
      ],
      actions: [
        { id: "act-firmware", label: "Manually update Node-Kitchen firmware to v2.5.0 via USB/direct connection, then rejoin" },
        { id: "act-factory", label: "Factory reset all nodes and re-setup the entire mesh" },
        { id: "act-rollback", label: "Rollback gateway and Node-LivingRoom to v2.4.1" },
        { id: "act-closer", label: "Move Node-Kitchen closer to the gateway for stronger signal" },
      ],
      correctActionId: "act-firmware",
      rationales: [
        {
          id: "rat-firmware",
          text: "The mesh ID mismatch is caused by a firmware version incompatibility. Node-Kitchen is on v2.4.1 while the mesh runs v2.5.0 with a new mesh protocol. Updating the node's firmware resolves the incompatibility.",
        },
        {
          id: "rat-factory-overkill",
          text: "Factory resetting all nodes is destructive and unnecessary. Only the isolated node needs a firmware update to match the mesh protocol version.",
        },
        {
          id: "rat-signal-irrelevant",
          text: "Signal strength (-74 dBm) is adequate for mesh backhaul. The rejection is protocol-level (mesh ID mismatch), not signal-related.",
        },
      ],
      correctRationaleId: "rat-firmware",
      feedback: {
        perfect:
          "Correct! The firmware mismatch between v2.4.1 and v2.5.0 caused an incompatible mesh protocol change. Updating Node-Kitchen resolves the mesh ID mismatch.",
        partial:
          "Right idea to update firmware, but the key diagnostic is the mesh ID mismatch in the logs -- this points directly to the incompatible protocol versions.",
        wrong:
          "The logs clearly show a mesh ID mismatch caused by firmware version differences. The v2.5.0 update changed the mesh protocol. Updating the lagging node is the fix.",
      },
    },
    {
      type: "investigate-decide",
      id: "mesh-latency-hops",
      title: "Excessive Latency on Remote Mesh Node",
      objective:
        "A user on the farthest mesh node experiences 200ms latency to the gateway, causing video call buffering. The network has 4 hops. Determine how to reduce latency.",
      investigationData: [
        {
          id: "src-latency-trace",
          label: "Mesh Hop Latency Trace",
          content:
            "Traceroute from Client -> Gateway:\n  Hop 1: Node-4 (client AP)    -> Node-3:   45ms\n  Hop 2: Node-3                 -> Node-2:   52ms\n  Hop 3: Node-2                 -> Node-1:   48ms\n  Hop 4: Node-1                 -> Gateway:  55ms\n  Total: 200ms\n\nPer-hop latency is high due to store-and-forward at each node.\nEach hop adds ~50ms of processing + airtime contention.",
          isCritical: true,
        },
        {
          id: "src-floor-plan",
          label: "Physical Layout",
          content:
            "Floor plan (linear layout):\n  [Gateway]--15m--[Node-1]--20m--[Node-2]--15m--[Node-3]--25m--[Node-4]\n\nDirect distance Gateway to Node-4: 75m\nMax single-hop range for reliable backhaul: ~40m indoors\n\nPossible re-topology:\n  Move Node-2 to central location (35m from Gateway)\n  Node-4 connects to Node-2 directly (40m) instead of through Node-3\n  Result: Max 2 hops instead of 4",
          isCritical: true,
        },
        {
          id: "src-signal-matrix",
          label: "Node Signal Matrix",
          content:
            "RSSI between all node pairs:\n  Gateway <-> Node-2: -62 dBm (usable for backhaul)\n  Gateway <-> Node-4: -78 dBm (too weak for reliable backhaul)\n  Node-2  <-> Node-4: -65 dBm (usable for backhaul if Node-2 relocated centrally)\n  Node-1  <-> Node-3: -70 dBm (marginal)\n\nRelocating Node-2 to center creates a star topology:\n  Gateway <-> Node-1 (1 hop)\n  Gateway <-> Node-2 (1 hop)\n  Node-2  <-> Node-3 (1 hop from Node-2, 2 from Gateway)\n  Node-2  <-> Node-4 (1 hop from Node-2, 2 from Gateway)",
        },
      ],
      actions: [
        { id: "act-star", label: "Relocate Node-2 centrally to create a star topology with maximum 2 hops to any node" },
        { id: "act-qos", label: "Enable QoS prioritization for video traffic on all mesh nodes" },
        { id: "act-5th-node", label: "Add a 5th node to create an alternate path for load balancing" },
        { id: "act-wired", label: "Run Ethernet to Node-4 to eliminate all wireless hops" },
      ],
      correctActionId: "act-star",
      rationales: [
        {
          id: "rat-star",
          text: "Converting from a 4-hop linear chain to a 2-hop star topology reduces latency from 200ms to approximately 100ms. The signal matrix confirms Node-2 can reach both Gateway and Node-4 from a central position.",
        },
        {
          id: "rat-qos-insufficient",
          text: "QoS can prioritize video packets but cannot reduce the fundamental per-hop latency of 50ms. With 4 hops, QoS still results in 200ms minimum latency.",
        },
        {
          id: "rat-5th-redundancy",
          text: "Adding a 5th node adds redundancy but does not reduce hop count. The latency problem is structural (too many hops), not a capacity issue.",
        },
      ],
      correctRationaleId: "rat-star",
      feedback: {
        perfect:
          "Excellent! Reducing from 4 hops to 2 hops by creating a star topology cuts latency in half. Each mesh hop adds ~50ms, so minimizing hops is the key to low latency.",
        partial:
          "Right idea to reduce hops, but the optimal solution uses the existing nodes in a star topology rather than adding hardware.",
        wrong:
          "Mesh latency scales linearly with hop count (~50ms per hop). The 4-hop chain creates 200ms latency. Restructuring to a 2-hop star topology is the correct fix.",
      },
    },
  ],
  hints: [
    "Each mesh hop adds approximately 50ms of latency due to store-and-forward processing. Minimize hop count for latency-sensitive applications.",
    "Dual-band mesh nodes share one radio between backhaul and client service, halving throughput per hop. Tri-band nodes dedicate a radio to backhaul.",
    "Mesh node firmware must be compatible across all nodes. A firmware mismatch can cause mesh ID or protocol incompatibility, preventing nodes from joining.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Mesh networking knowledge is critical for both residential deployments and enterprise environments where wired backhaul is impractical. Understanding hop penalties and topology optimization is key for network design roles.",
  toolRelevance: [
    "Mesh vendor dashboards (eero, Meraki, UniFi)",
    "iPerf3 (throughput testing per hop)",
    "Mesh topology visualization tools",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
