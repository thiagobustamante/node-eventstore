import { EventStore, EventStream } from './event-store';
import { Event } from './model/event';
import { Stream } from './model/stream';
import { PersistenceProvider } from './provider/provider';
import { Publisher } from './publisher/publisher';

/**
 * An Event Stream
 */
export class EventStreamImpl implements EventStream {
    private stream: Stream;
    private eventStore: EventStore;

    public constructor(eventStore: EventStore, stream: Stream) {
        this.eventStore = eventStore;
        this.stream = stream;
    }

    /**
     * The event stream identifier
     * The event stream
     */
    public get streamId(): string {
        return this.stream.id;
    }

    /**
     * The parent aggregation for this event stream
     */
    public get aggregation(): string {
        return this.stream.aggregation;
    }

    /**
     * Rertieve a list containing all the events in the stream in order.
     * @param offset The start position in the stream list
     * @param limit The desired quantity events
     * @return All the events
     */
    public getEvents(offset?: number, limit?: number): Promise<Array<Event>> {
        return this.getProvider().getEvents(this.stream, offset, limit);
    }

    /**
     * Add a new event to the end of the event stream.
     * @param data The event data
     * @param type The Event type
     * @return The event, updated with informations like its sequence order and commitTimestamp
     */
    public async addEvent(data: any, type?: string) {
        const addedEvent: Event = await this.getProvider().addEvent(this.stream, data, type);
        if (this.eventStore.publisher) {
            await (this.eventStore.publisher as Publisher).publish({
                event: addedEvent,
                stream: this.stream
            });
        }
        return addedEvent;
    }

    private getProvider(): PersistenceProvider {
        return this.eventStore.provider;
    }
}
