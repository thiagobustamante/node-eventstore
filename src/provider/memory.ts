'use strict';

import { Event } from '../model/event';
import { Provider } from './provider';

/**
 * A Persistence Provider that handle all the data in memory. It is a very simple implementation that should be used
 * only for development and test purposes.
 */
export class InMemoryProvider implements Provider {
    private store: Map<string, Map<string, Array<Event>>> = new Map();

    public async addEvent(aggregation: string, streamId: string, event: Event) {
        const currentEvents = await this.getEvents(aggregation, streamId);
        event.commitTimestamp = new Date().getTime();
        event.sequence = currentEvents.length;
        currentEvents.push(event);
        return event;
    }

    public async getEvents(aggregation: string, streamId: string) {
        let streams = this.store.get(aggregation);
        if (!streams) {
            streams = new Map<string, Array<Event>>();
            this.store.set(aggregation, streams);
        }
        let history = streams.get(streamId);
        if (!history) {
            history = new Array<Event>();
            streams.set(streamId, history);
        }
        return history;
    }
}
