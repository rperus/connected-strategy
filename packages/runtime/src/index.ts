/**
 * @cs/runtime — Runtime management, port resolution, launch profiles
 *
 * Owns: port config reader, launch profile management, collision avoidance,
 *       session tracking, tool registry, stack detection.
 *
 * Worker: SET-05 / SLOT: Chat 2
 */

// Port resolution (existing, extended)
export { resolvePort, getAllPorts, ports, getProjectRoot, getActivePortsPath, getPortRegistryPath } from './port-config.js';
export type { PortEntry, ActivePortsFile } from './port-config.js';

// Type contracts
export type {
  StackType,
  StackDetectionResult,
  PortAssignment,
  LaunchProfile,
  ServiceDefinition,
  ExternalTool,
  ExternalToolKind,
  RuntimeSession,
  ServiceStatus,
  SessionStatus,
  HealthCheckResult,
  CollisionRecord,
  ActivePortEntry,
} from './types.js';

// Stack detection
export { detectStack, detectAllStacks } from './stack-detector.js';

// Port writer (write back to active_ports.json)
export {
  writeServicePort,
  writeProjectPort,
  markServiceRunning,
  markServiceStopped,
  readActivePorts,
} from './port-writer.js';

// Collision resolver
export {
  isPortFree,
  findFreePort,
  resolvePortSafe,
  resolvePortsBatch,
  getCollisionLog,
} from './collision-resolver.js';

// Launch profiles
export { buildLaunchProfile } from './launch-profile.js';

// Session management
export {
  createSession,
  updateServiceStatus,
  recordHealthCheck,
  checkHealth,
  closeSession,
  getSession,
  listSessions,
  getActiveSessions,
} from './session-manager.js';

// Tool registry
export {
  registerTool,
  registerTools,
  getTool,
  listTools,
  listToolsByKind,
  getLaunchTools,
  deregisterTool,
  resetToolRegistry,
} from './tool-registry.js';
