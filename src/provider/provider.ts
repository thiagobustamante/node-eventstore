'use strict';

import { Event } from '../model/event';
import { Stream } from '../model/stream';

/**
 * A Persistence provider for the {@link EventStore}. It is responsible for write and read {@link Event}s
 * in the {@link EventStream}
 */
export interface PersistenceProvider {

    /**
     * Add a new {@link Event} in the {@link EventStream}
     * @param stream The associated stream
     * @param data The Event data
     * @return The updated event, after persisted.
     */
    addEvent(stream: Stream, data: any): Promise<Event>;

    /**
     * Retrieves a ranged list of events in the {@link EventStream}
     * @param stream The associated stream
     * @param offset The start position in the events list
     * @param limit The desired quantity events
     * @return A List with events in the {@link EventStream}
     */
    getEvents(stream: Stream, offset?: number, limit?: number): Promise<Array<Event>>;

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
