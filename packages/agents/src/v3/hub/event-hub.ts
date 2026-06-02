import { ProjectStateStore } from '../state-store.js';
import type { ProjectStateV3 } from '../state-types.js';
import { PubSub, Topic, Subscription } from '@google-cloud/pubsub';

export type EventDomain = 'lifecycle' | 'data' | 'command';

export interface HubEvent<T = any> {
  domain: EventDomain;
  type: string;
  projectId: string;
  payload: T;
  timestamp: number;
}

export type EventHandler<T = any> = (event: HubEvent<T>) => Promise<void> | void;

export class EventHub {
  private subscribers: Map<string, EventHandler[]> = new Map();
  private store: ProjectStateStore;
  private pubsub: PubSub;
  private topicName = 'cs-events-topic';
  private subscriptionName = 'cs-events-sub';
  private topic?: Topic;
  private subscription?: Subscription;
  private initialized = false;

  constructor(store: ProjectStateStore) {
    this.store = store;
    this.pubsub = new PubSub({ projectId: 'connected-strategy-local' }); // Local/default config
  }

  /**
   * Initialize GCP Pub/Sub resources
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      [this.topic] = await this.pubsub.topic(this.topicName).get({ autoCreate: true });
      [this.subscription] = await this.topic.subscription(this.subscriptionName).get({ autoCreate: true });
      
      this.subscription.on('message', (message) => {
        try {
          const event = JSON.parse(message.data.toString()) as HubEvent;
          message.ack();
          
          const handlers = this.subscribers.get(event.type) || [];
          for (const handler of handlers) {
            Promise.resolve(handler(event)).catch(console.error);
          }
        } catch (e) {
          console.error('Failed to parse PubSub message:', e);
          message.nack();
        }
      });
      
      this.subscription.on('error', (error) => {
        console.error('PubSub subscription error:', error);
      });
      
      this.initialized = true;
      console.log('✅ EventHub connected to GCP Pub/Sub');
    } catch (err) {
      console.warn('⚠️ Could not connect to GCP Pub/Sub. Running EventHub in-memory fallback.', err);
    }
  }

  /**
   * Subscribe to a specific event type.
   */
  subscribe<T = any>(eventType: string, handler: EventHandler<T>): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }

  /**
   * Publish an event to all subscribers.
   */
  async publish<T = any>(event: HubEvent<T>): Promise<void> {
    if (this.initialized && this.topic) {
      // Publish to GCP Pub/Sub
      const dataBuffer = Buffer.from(JSON.stringify(event));
      await this.topic.publishMessage({ data: dataBuffer, attributes: { eventType: event.type } });
    } else {
      // In-memory fallback
      const handlers = this.subscribers.get(event.type) || [];
      const promises = handlers.map(handler => handler(event));
      await Promise.all(promises);
    }
  }

  /**
   * Read current state from the Blackboard (ProjectStateStore).
   */
  getState(projectId: string): ProjectStateV3 | null {
    return this.store.load(projectId);
  }

  /**
   * Mutate the state in the Blackboard (ProjectStateStore).
   */
  updateState(projectId: string, updater: (state: ProjectStateV3) => void): void {
    const state = this.store.load(projectId);
    if (!state) {
      throw new Error(`State not found for project ${projectId}`);
    }
    updater(state);
    this.store.save(state);
  }

  /**
   * Add a citation.
   */
  appendCitation(projectId: string, citation: any): void {
    this.store.appendCitation(projectId, citation);
  }
}
