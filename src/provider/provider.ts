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
     * Retrieve a list of events in the {@link EventStream}
     * @param aggregation The parent aggregation
     * @param streamId The {@link EventStream} identifier
     * @return A List with events in the {@link EventStream}
     */
    getEvents(aggregation: string, streamId: string): Promise<Array<Event>>;
}
