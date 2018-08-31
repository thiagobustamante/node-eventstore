'use srtrict';

import { Event } from '../model/event';

/**
 * A Persistence provider for the {@link EventStore}. It is responsible for write and read {@link Event}s
 * in the {@link EventStream}
 */
export interface Provider {

    /**
     * Add a new {@link Event} in the {@link EventStream}
     * @param aggregation The parent aggregation
     * @param streamId The {@link EventStream} identifier
     * @param event The Event
     * @return The updated event, after persisted.
     */
    addEvent(aggregation: string, streamId: string, event: Event): Promise<Event>;

    /**
     * Retrieves a ranged list of events in the {@link EventStream}
     * @param aggregation The parent aggregation
     * @param streamId The {@link EventStream} identifier
     * @param offset The start position in the events list
     * @param limit The desired quantity events
     * @return A List with events in the {@link EventStream}
     */
    getEvents(aggregation: string, streamId: string, offset?: number, limit?: number): Promise<Array<Event>>;

    /**
     * Retrieves a ranged aggregation list
     * @param offset The start position in the aggregation list
     * @param limit The desired quantity aggregations
     * @return The aggregation list
     */
    getAggregations(offset?: number, limit?: number): Promise<Array<string>>;

    /**
     * Retrieves a ranged stream list
     * @param aggregation The aggregation
     * @param offset The start position in the stream list
     * @param limit The desired quantity streams
     * @return The stream list
     */
    getStreams(aggregation: string, offset?: number, limit?: number): Promise<Array<string>>;
}
