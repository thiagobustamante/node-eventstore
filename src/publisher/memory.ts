'use strict';

import { Message } from '../model/message';
import { HasSubscribers, Publisher, Subscriber, Subscription } from './publisher';


/**
 * A Publisher that handle all the data in memory. It is a very simple implementation that should be used
 * only for development and test purposes.
 */
export class InMemoryPublisher implements Publisher, HasSubscribers {

    private listeners: Map<string, Array<Subscriber>> = new Map();

    public async publish(message: Message): Promise<void> {
        const aggregationListeners = this.listeners.get(message.aggregation);
        if (aggregationListeners != null) {
            aggregationListeners.forEach(subscriber => subscriber(message));
        }
    }

    public async subscribe(aggregation: string, subscriber: Subscriber): Promise<Subscription> {
        let aggregateListeners = this.listeners.get(aggregation);
        if (!aggregateListeners) {
            aggregateListeners = new Array<Subscriber>();
            this.listeners.set(aggregation, aggregateListeners);
        }
        aggregateListeners.push(subscriber);
        return {
            remove: async () => {
                const index = aggregateListeners.indexOf(subscriber);
                aggregateListeners.splice(index, 1);
            }
        }
    }
}
