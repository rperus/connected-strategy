import { EventEmitter } from 'events';

// Global event bus for real-time telemetry
export const telemetryBus = new EventEmitter();

// Define allowed event types for type safety
export type TelemetryEventName = 
  | 'pipeline:started'
  | 'pipeline:completed'
  | 'pipeline:throttled'
  | 'agent:started'
  | 'agent:completed'
  | 'agent:failed'
  | 'agent:activity'
  | 'project:score_updated';

/**
 * Broadcasts an event to all connected SSE clients.
 */
export function broadcastEvent(event: TelemetryEventName, data: Record<string, unknown>) {
  telemetryBus.emit('broadcast', { event, data, timestamp: new Date().toISOString() });
}
