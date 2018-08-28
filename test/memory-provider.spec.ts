'use strict';

import * as chai from 'chai';
import 'mocha';
import { EventStore, EventStream } from '../src/event-store';
import { InMemoryProvider } from '../src/provider/memory';
// import { InMemoryPublisher } from '../src/publisher/memory';

const expect = chai.expect;

describe('EventStory Memory Provider', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = "Event Data";

    beforeEach(() => {
        const streamId = "1";
        const aggregation = "orders";
        eventStore = new EventStore(
            new InMemoryProvider());
        ordersStream = eventStore.getEventStream(aggregation, streamId);
    });

    it('should be able to add an event to the EventStream', async () => {
        const eventPromise = await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        expect(eventPromise).to.have.property('commitTimestamp');
        expect(eventPromise).to.have.property('sequence');
    });

    it('should be able to read events from the EventStream', async () => {
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        const events = await ordersStream.getEvents();
        expect(events.length).to.equals(1);
        expect(events[0].payload).to.equals(EVENT_PAYLOAD);
        expect(events[0].sequence).to.equals(0);
    });
});
