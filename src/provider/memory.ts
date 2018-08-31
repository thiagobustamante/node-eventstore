'use strict';

import * as _ from 'lodash';
import { Event } from '../model/event';
import { Provider } from './provider';

/**
 * A Persistence Provider that handle all the data in memory. It is a very simple implementation that should be used
 * only for development and test purposes.
 */
export class InMemoryProvider implements Provider {
    private store: Map<string, Map<string, Array<Event>>> = new Map();

    public async addEvent(aggregation: string, streamId: string, event: Event) {
        const currentEvents = await this.getEventsList(aggregation, streamId);
        event.commitTimestamp = new Date().getTime();
        event.sequence = currentEvents.length;
        currentEvents.push(event);
        return event;
    }

    public async getEvents(aggregation: string, streamId: string, offset?: number, limit?: number) {
        const history = this.getEventsList(aggregation, streamId);
        return _(history).drop(offset || 0).take(limit || history.length).value();
    }

    public async getAggregations(offset?: number, limit?: number): Promise<Array<string>> {
        const keys = Array.from(this.store.keys());
        return _(keys).sort().drop(offset || 0).take(limit || this.store.size).value();
    }

    public async getStreams(aggregation: string, offset?: number, limit?: number): Promise<Array<string>> {
        const streams = this.store.get(aggregation);
        const keys = Array.from(streams.keys());
        if (streams) {
            return _(keys).sort().drop(offset || 0).take(limit || this.store.size).value();
        }
        return [];
    }

    private getEventsList(aggregation: string, streamId: string) {
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
