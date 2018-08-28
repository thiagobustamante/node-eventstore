'use strict';

import * as chai from 'chai';
import 'mocha';
import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream } from '../src/event-store';
import { InMemoryProvider } from '../src/provider/memory';
import { InMemoryPublisher } from '../src/publisher/memory';

const expect = chai.expect;

describe('EventStory Memory Provider', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = "Event Data";
    let count = 0;

    beforeEach(() => {
        const streamId = "1";
        const aggregation = "orders";
        eventStore = new EventStore(
            new InMemoryProvider(),
            new InMemoryPublisher());
        ordersStream = eventStore.getEventStream(aggregation, streamId);
    });

    it('should be able to listen to EventStream changes', (done) => {
        eventStore.subscribe(ordersStream.aggregation, (message) => {
            expect(message.aggregation).to.equal(ordersStream.aggregation);
            expect(message.streamId).to.equal(ordersStream.streamId);
            expect(message.event.payload).to.equal(EVENT_PAYLOAD);
            done();
        }).then(() => ordersStream.addEvent({ payload: EVENT_PAYLOAD }));

    });

    it('should be able to unsubscribe from EventStore changes channel', async () => {
        count = 0;
        const subscription = await eventStore.subscribe(ordersStream.aggregation, message => {
            count++;
        });
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        await waitUntil(() => count === 1);
        await subscription.remove();;
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        wait(500);
        expect(count).to.equal(1);
    });
});
