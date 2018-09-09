'use strict';

import { Event } from './event';
import { Stream } from './stream';

/**
 * A Meesage sent by a {@link Publisher} to inform {@link Subscriber}s
 * that new {@link Event}s was added to the {@link EventStore}
 */
export interface Message {
    /**
     * The stream associated qith this message
     */
    stream: Stream;
    /**
     * The {@link Event} that was added to the stream
     */
    event: Event;
}
