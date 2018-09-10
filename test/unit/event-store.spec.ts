'use strict';

import * as chai from 'chai';
import 'mocha';
import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream, InMemoryProvider, InMemoryPublisher } from '../../src';

const expect = chai.expect;

describe('EventStory', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = 'Event Data';
    const STREAM_ID = '1';
    const AGGREGATION = 'orders';

    beforeEach(() => {
        eventStore = new EventStore(new InMemoryProvider(), new InMemoryPublisher());
        ordersStream = eventStore.getEventStream(AGGREGATION, STREAM_ID);
    });

    it('should be able to add an event to the EventStream', async () => {
        expect(ordersStream.streamId).to.equal(STREAM_ID);
        expect(ordersStream.aggregation).to.equal(AGGREGATION);
    });

    it('should be able to get the aggregations list', async () => {
        await ordersStream.addEvent('payload');
        const aggregations = await eventStore.getAggregations();

        expect(aggregations.length).to.equal(1);
        expect(aggregations[0]).to.equal(AGGREGATION);
    });

    it('should raise an Error if no persistence provider is set', async () => {
        const store = new EventStore(null);
        expect(() => store.provider).to.throw('No Provider configured in EventStore.');
    });

    it('should raise an Error if subscribe is called withou a valid publisher', async () => {
        const store = new EventStore(new InMemoryProvider());
        expect(() => store.subscribe('test', () => {
            chai.assert.fail('Should not be called');
        })).to.throw('There is no valid Publisher configured. '
            + 'Configure a Publisher that implements HasSubscribers int erface');
    });

    it('should be able to listen to EventStream changes', (done) => {
        eventStore.subscribe(ordersStream.aggregation, (message) => {
            expect(message.stream.aggregation).to.equal(ordersStream.aggregation);
            expect(message.stream.id).to.equal(ordersStream.streamId);
            expect(message.event.payload).to.equal(EVENT_PAYLOAD);
            done();
        }).then(() => ordersStream.addEvent(EVENT_PAYLOAD));
    });

    it('should be able to unsubscribe from EventStore changes channel', async () => {
        let count = 0;
        const subscription = await eventStore.subscribe(ordersStream.aggregation, message => {
            count++;
        });
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => count === 1);
        await subscription.remove();
        await ordersStream.addEvent(EVENT_PAYLOAD);
        wait(500);
        expect(count).to.equal(1);
    });
});
