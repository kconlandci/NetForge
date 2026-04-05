// ============================================================
// NetForge — Lab Catalog
// Single source of truth: imports every lab manifest and
// re-exports them as a sorted array.
// ============================================================

import type { LabManifest } from "../types/manifest";

// --- Network Fundamentals (20) ---
import osiModelTroubleshooting from "./labs/osi-model-troubleshooting";
import tcpVsUdpSelection from "./labs/tcp-vs-udp-selection";
import ipAddressingBasics from "./labs/ip-addressing-basics";
import subnetMaskConfiguration from "./labs/subnet-mask-configuration";
import dnsResolutionTroubleshooting from "./labs/dns-resolution-troubleshooting";
import dhcpScopeIssues from "./labs/dhcp-scope-issues";
import arpTableAnalysis from "./labs/arp-table-analysis";
import portIdentificationTriage from "./labs/port-identification-triage";
import ipv6TransitionPlanning from "./labs/ipv6-transition-planning";
import networkTopologySelection from "./labs/network-topology-selection";
import ethernetFrameAnalysis from "./labs/ethernet-frame-analysis";
import macAddressFiltering from "./labs/mac-address-filtering";
import broadcastDomainDesign from "./labs/broadcast-domain-design";
import tcpHandshakeDiagnosis from "./labs/tcp-handshake-diagnosis";
import encapsulationTroubleshooting from "./labs/encapsulation-troubleshooting";
import natConfigurationReview from "./labs/nat-configuration-review";
import vlsmSubnetting from "./labs/vlsm-subnetting";
import qosMarkingClassification from "./labs/qos-marking-classification";
import multicastRoutingDecisions from "./labs/multicast-routing-decisions";
import networkBaselineAnalysis from "./labs/network-baseline-analysis";

// --- Routing & Switching (20) ---
import vlanConfiguration from "./labs/vlan-configuration";
import staticRouteConfiguration from "./labs/static-route-configuration";
import portSecuritySetup from "./labs/port-security-setup";
import defaultGatewayIssues from "./labs/default-gateway-issues";
import interVlanRouting from "./labs/inter-vlan-routing";
import stpTroubleshooting from "./labs/stp-troubleshooting";
import trunkPortConfiguration from "./labs/trunk-port-configuration";
import eigrpMetricTuning from "./labs/eigrp-metric-tuning";
import routeRedistribution from "./labs/route-redistribution";
import aclTrafficFiltering from "./labs/acl-traffic-filtering";
import etherchannelSetup from "./labs/etherchannel-setup";
import ospfNeighborTroubleshooting from "./labs/ospf-neighbor-troubleshooting";
import bgpPeeringTroubleshooting from "./labs/bgp-peering-troubleshooting";
import hsrpFailoverAnalysis from "./labs/hsrp-failover-analysis";
import ospfAreaDesign from "./labs/ospf-area-design";
import vtpDomainManagement from "./labs/vtp-domain-management";
import layer3SwitchRouting from "./labs/layer3-switch-routing";
import routeSummarization from "./labs/route-summarization";
import mplsLabelAnalysis from "./labs/mpls-label-analysis";
import networkConvergenceOptimization from "./labs/network-convergence-optimization";

// --- Wireless Networking (15) ---
import wifiStandardSelection from "./labs/wifi-standard-selection";
import wirelessChannelPlanning from "./labs/wireless-channel-planning";
import apPlacementStrategy from "./labs/ap-placement-strategy";
import wpa3SecurityConfig from "./labs/wpa3-security-config";
import wirelessInterferenceDiagnosis from "./labs/wireless-interference-diagnosis";
import roamingConfiguration from "./labs/roaming-configuration";
import wirelessSiteSurvey from "./labs/wireless-site-survey";
import captivePortalSetup from "./labs/captive-portal-setup";
import wirelessBridgeConfig from "./labs/wireless-bridge-config";
import meshNetworkTroubleshooting from "./labs/mesh-network-troubleshooting";
import controllerBasedWifi from "./labs/controller-based-wifi";
import spectrumAnalysis from "./labs/spectrum-analysis";
import wirelessIdsResponse from "./labs/wireless-ids-response";
import dot1xWirelessAuth from "./labs/802.1x-wireless-auth";
import highDensityWifiDesign from "./labs/high-density-wifi-design";

// --- Network Security (15) ---
import firewallRuleCreation from "./labs/firewall-rule-creation";
import aclDesignBasics from "./labs/acl-design-basics";
import vpnTunnelConfiguration from "./labs/vpn-tunnel-configuration";
import nacPolicyDecisions from "./labs/nac-policy-decisions";
import idsIpsPlacement from "./labs/ids-ips-placement";
import portScanResponse from "./labs/port-scan-response";
import dmzDesignReview from "./labs/dmz-design-review";
import sslTlsInspection from "./labs/ssl-tls-inspection";
import networkSegmentationSecurity from "./labs/network-segmentation-security";
import radiusAuthenticationDebug from "./labs/radius-authentication-debug";
import ipsecTunnelTroubleshooting from "./labs/ipsec-tunnel-troubleshooting";
import wafRuleTuning from "./labs/waf-rule-tuning";
import zeroTrustNetworkDesign from "./labs/zero-trust-network-design";
import ddosMitigationResponse from "./labs/ddos-mitigation-response";
import siemNetworkCorrelation from "./labs/siem-network-correlation";

// --- Services & Infrastructure (15) ---
import dhcpServerConfiguration from "./labs/dhcp-server-configuration";
import dnsZoneManagement from "./labs/dns-zone-management";
import ntpSynchronization from "./labs/ntp-synchronization";
import snmpMonitoringSetup from "./labs/snmp-monitoring-setup";
import syslogConfiguration from "./labs/syslog-configuration";
import qosPolicyDesign from "./labs/qos-policy-design";
import loadBalancerConfiguration from "./labs/load-balancer-configuration";
import ftpTftpServerSetup from "./labs/ftp-tftp-server-setup";
import smtpRelayTroubleshooting from "./labs/smtp-relay-troubleshooting";
import proxyServerConfiguration from "./labs/proxy-server-configuration";
import cloudDnsArchitecture from "./labs/cloud-dns-architecture";
import infrastructureMonitoringDesign from "./labs/infrastructure-monitoring-design";
import ipTelephonyQos from "./labs/ip-telephony-qos";
import networkAutomationDecisions from "./labs/network-automation-decisions";
import sdWanDeployment from "./labs/sd-wan-deployment";

// --- Network Troubleshooting (15) ---
import systematicTroubleshootingMethodology from "./labs/systematic-troubleshooting-methodology";
import cableTestingDiagnosis from "./labs/cable-testing-diagnosis";
import packetCaptureAnalysis from "./labs/packet-capture-analysis";
import latencyDiagnosis from "./labs/latency-diagnosis";
import connectivityFailureResolution from "./labs/connectivity-failure-resolution";
import performanceBottleneckIdentification from "./labs/performance-bottleneck-identification";
import pingTracerouteInterpretation from "./labs/ping-traceroute-interpretation";
import duplexMismatchDetection from "./labs/duplex-mismatch-detection";
import mtuPathDiscovery from "./labs/mtu-path-discovery";
import dnsNetworkTroubleshooting from "./labs/dns-network-troubleshooting";
import asymmetricRoutingDiagnosis from "./labs/asymmetric-routing-diagnosis";
import intermittentConnectivityAnalysis from "./labs/intermittent-connectivity-analysis";
import networkOutageRca from "./labs/network-outage-rca";
import distributedDenialDiagnosis from "./labs/distributed-denial-diagnosis";
import complexMultiVendorTroubleshooting from "./labs/complex-multi-vendor-troubleshooting";

export const labCatalog: LabManifest[] = [
  // Network Fundamentals
  osiModelTroubleshooting,
  tcpVsUdpSelection,
  ipAddressingBasics,
  subnetMaskConfiguration,
  dnsResolutionTroubleshooting,
  dhcpScopeIssues,
  arpTableAnalysis,
  portIdentificationTriage,
  ipv6TransitionPlanning,
  networkTopologySelection,
  ethernetFrameAnalysis,
  macAddressFiltering,
  broadcastDomainDesign,
  tcpHandshakeDiagnosis,
  encapsulationTroubleshooting,
  natConfigurationReview,
  vlsmSubnetting,
  qosMarkingClassification,
  multicastRoutingDecisions,
  networkBaselineAnalysis,
  // Routing & Switching
  vlanConfiguration,
  staticRouteConfiguration,
  portSecuritySetup,
  defaultGatewayIssues,
  interVlanRouting,
  stpTroubleshooting,
  trunkPortConfiguration,
  eigrpMetricTuning,
  routeRedistribution,
  aclTrafficFiltering,
  etherchannelSetup,
  ospfNeighborTroubleshooting,
  bgpPeeringTroubleshooting,
  hsrpFailoverAnalysis,
  ospfAreaDesign,
  vtpDomainManagement,
  layer3SwitchRouting,
  routeSummarization,
  mplsLabelAnalysis,
  networkConvergenceOptimization,
  // Wireless Networking
  wifiStandardSelection,
  wirelessChannelPlanning,
  apPlacementStrategy,
  wpa3SecurityConfig,
  wirelessInterferenceDiagnosis,
  roamingConfiguration,
  wirelessSiteSurvey,
  captivePortalSetup,
  wirelessBridgeConfig,
  meshNetworkTroubleshooting,
  controllerBasedWifi,
  spectrumAnalysis,
  wirelessIdsResponse,
  dot1xWirelessAuth,
  highDensityWifiDesign,
  // Network Security
  firewallRuleCreation,
  aclDesignBasics,
  vpnTunnelConfiguration,
  nacPolicyDecisions,
  idsIpsPlacement,
  portScanResponse,
  dmzDesignReview,
  sslTlsInspection,
  networkSegmentationSecurity,
  radiusAuthenticationDebug,
  ipsecTunnelTroubleshooting,
  wafRuleTuning,
  zeroTrustNetworkDesign,
  ddosMitigationResponse,
  siemNetworkCorrelation,
  // Services & Infrastructure
  dhcpServerConfiguration,
  dnsZoneManagement,
  ntpSynchronization,
  snmpMonitoringSetup,
  syslogConfiguration,
  qosPolicyDesign,
  loadBalancerConfiguration,
  ftpTftpServerSetup,
  smtpRelayTroubleshooting,
  proxyServerConfiguration,
  cloudDnsArchitecture,
  infrastructureMonitoringDesign,
  ipTelephonyQos,
  networkAutomationDecisions,
  sdWanDeployment,
  // Network Troubleshooting
  systematicTroubleshootingMethodology,
  cableTestingDiagnosis,
  packetCaptureAnalysis,
  latencyDiagnosis,
  connectivityFailureResolution,
  performanceBottleneckIdentification,
  pingTracerouteInterpretation,
  duplexMismatchDetection,
  mtuPathDiscovery,
  dnsNetworkTroubleshooting,
  asymmetricRoutingDiagnosis,
  intermittentConnectivityAnalysis,
  networkOutageRca,
  distributedDenialDiagnosis,
  complexMultiVendorTroubleshooting,
].sort((a, b) => a.sortOrder - b.sortOrder);
