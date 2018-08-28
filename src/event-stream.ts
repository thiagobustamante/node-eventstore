'use strict';

import { EventStore, EventStream } from './event-store';
import { Event } from './model/event';
import { Provider } from './provider/provider';
import { Publisher } from './publisher/publisher';

/**
 * An Event Stream
 */
export class EventStreamImpl implements EventStream {
    private id: string;
    private parentAggregation: string;
    private eventStore: EventStore;

    public constructor(eventStore: EventStore, aggregation: string, streamId: string) {
        this.eventStore = eventStore;
        this.parentAggregation = aggregation;
        this.id = streamId;
    }

    /**
     * The event stream identifier
     */
    public get streamId(): string {
        return this.id;
    }

    /**
     * The parent aggregation for this event stream
     */
    public get aggregation(): string {
        return this.parentAggregation
    }

    /**
     * Rertieve a list containing all the events in the stream in order.
     * @return All the events
     */
    public getEvents(): Promise<Array<Event>> {
        return this.getProvider().getEvents(this.aggregation, this.streamId);
    }

    /**
     * Add a new event to the end of the event stream.
     * @param event The event
     * @return The event, updated with informations like its sequence order and commitTimestamp
     */
    public async addEvent(event: Event) {
        const addedEvent: Event = await this.getProvider().addEvent(this.aggregation, this.streamId, event);
        if (this.eventStore.publisher) {
            await (this.eventStore.publisher as Publisher).publish({
                aggregation: this.aggregation,
                event: addedEvent,
                streamId: this.streamId
            });
        }
        return addedEvent;
    }

    private getProvider(): Provider {
        if (this.eventStore.provider) {
            return this.eventStore.provider;
        }
        throw new Error('No Provider configured in EventStore.');
    }
}
