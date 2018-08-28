'use strict';

import { Event } from './event';

/**
 * A Meesage sent by a {@link Publisher} to inform {@link Subscriber}s
 * that new {@link Event}s was added to the {@link EventStore}
 */
export interface Message {
    /**
     * The name of the parent aggregation
     */
    aggregation: string;
    /**
     * The {@link EventStream} identifier
     */
    streamId: string;
    /**
     * The {@link Event} that was added to the stream
     */
    event: Event;
}
