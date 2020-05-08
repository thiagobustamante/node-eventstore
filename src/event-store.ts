import * as _ from 'lodash';
import { EventStreamImpl } from './event-stream';
import { Event } from './model/event';
import { PersistenceProvider } from './provider/provider';
import { HasSubscribers, Publisher, Subscriber, Subscription } from './publisher/publisher';

/**
 * The EventStore itself. To create EventStore instances, use the {@link EventStoreBuilder}
 */
export class EventStore implements EventStore, HasSubscribers {

    private persistenceProvider: PersistenceProvider;
    private storePublisher: Publisher;

    public constructor(provider: PersistenceProvider, publisher?: Publisher) {
        this.persistenceProvider = provider;
        this.storePublisher = publisher;
    }

    public get provider(): PersistenceProvider {
        if (_.isNil(this.persistenceProvider)) {
            throw new Error('No Provider configured in EventStore.');
        }
        return this.persistenceProvider;
    }

    public get publisher(): Publisher | HasSubscribers {
        return this.storePublisher;
    }

    /**
     * Retrieve an event stream.
     * @param aggregation The parent aggregation for the event stream
     * @param streamId The stream identifier. Can be any string
     * @return The existing stream. If no stream exists for to the given id, a new one
     * will be created when the first event is added to the stream.
     */
    public getEventStream(aggregation: string, streamId: string): EventStream {
        return new EventStreamImpl(this, { aggregation: aggregation, id: streamId });
    }

    /**
     * Add a new subscription to notifications channel associated with the given aggregation.
     * It is necessary to have a valid {@link Publisher} configured that supports subscriptions.
     * @param aggregation The aggregation for the stream events
     * @param subscriber Declares the function to be called to handle new messages
     * @return A subscription. Can be used to remove the subscription to the publisher channel.
     */
    public subscribe(aggregation: string, subscriber: Subscriber): Promise<Subscription> {
        if (this.publisher && (this.publisher as HasSubscribers).subscribe) {
            return (this.publisher as HasSubscribers).subscribe(aggregation, subscriber);
        }
        throw new Error('There is no valid Publisher configured. '
            + 'Configure a Publisher that implements HasSubscribers int erface');
    }

    /**
     * Retrieves a ranged aggregation list
     * @param offset The start position in the aggregation list
     * @param limit The desired quantity aggregations
     * @return The aggregation list
     */
    public async getAggregations(offset?: number, limit?: number) {
        return this.provider.getAggregations(offset, limit);
    }

    /**
     * Retrieves a ranged stream list
     * @param aggregation The aggregation
     * @param offset The start position in the stream list
     * @param limit The desired quantity streams
     * @return The stream list
     */
    public async getStreams(aggregation: string, offset?: number, limit?: number) {
        return this.provider.getStreams(aggregation, offset, limit);
    }
}

/**
 * An Event Stream
 */
export interface EventStream {
    /**
     * The event stream identifier
     */
    streamId: string;
    /**
     * The parent aggregation for this event stream
     */
    aggregation: string;
    /**
     * Rertieve a list containing all the events in the stream in order.
     * @param offset The start position in the stream list
     * @param limit The desired quantity events
     * @return All the events
     */
    getEvents(offset?: number, limit?: number): Promise<Array<Event>>;
    /**
     * Add a new event to the end of the event stream.
     * @param data The event data
     * @return The event, updated with informations like its sequence order and commitTimestamp
     */
    addEvent(data: any): Promise<Event>;
}
