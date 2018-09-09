'use strict';

/**
 * A Stream of events
 */
export interface Stream {
    /**
     * The parent aggregation for this stream
     */
    aggregation: string;
    /**
     * The stream identifier. Must be unique for each parent aggregation
     */
    id: string;
}
