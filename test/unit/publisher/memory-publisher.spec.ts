'use strict';

import * as chai from 'chai';
import 'mocha';
import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream, InMemoryProvider, InMemoryPublisher } from '../../../src';

const expect = chai.expect;

// tslint:disable:no-unused-expression
describe('EventStory Memory Publisher', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = 'Event Data';
    let count = 0;

    beforeEach(() => {
        const streamId = '1';
        const aggregation = 'orders';
        eventStore = new EventStore(
            new InMemoryProvider(),
            new InMemoryPublisher());
        ordersStream = eventStore.getEventStream(aggregation, streamId);
    });

    it('should be able to listen to EventStream changes', (done) => {
        eventStore.subscribe(ordersStream.stream.aggregation, (message) => {
            expect(message.stream.aggregation).to.equal(ordersStream.stream.aggregation);
            expect(message.stream.id).to.equal(ordersStream.stream.id);
            expect(message.event.payload).to.equal(EVENT_PAYLOAD);
            done();
        }).then(() => ordersStream.addEvent(EVENT_PAYLOAD));
    });

    it('should be able to unsubscribe from EventStore changes channel', async () => {
        count = 0;
        const subscription = await eventStore.subscribe(ordersStream.stream.aggregation, message => {
            count++;
        });
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => count === 1);
        await subscription.remove();
        await ordersStream.addEvent(EVENT_PAYLOAD);
        wait(500);
        expect(count).to.equal(1);
    });

    it('should be able to notify multiple listeners', async () => {
        let calledFirst = false;
        let calledSecond = false;
        await eventStore.subscribe(ordersStream.stream.aggregation, (message) => {
            calledFirst = true;
        });
        await eventStore.subscribe(ordersStream.stream.aggregation, (message) => {
            calledSecond = true;
        });
        await ordersStream.addEvent(EVENT_PAYLOAD);
        expect(calledFirst).to.be.true;
        expect(calledSecond).to.be.true;
    });
});
