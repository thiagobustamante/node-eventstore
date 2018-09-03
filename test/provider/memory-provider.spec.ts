'use strict';

import * as chai from 'chai';
import 'mocha';
import { EventStore, EventStream } from '../../src';
import { InMemoryProvider } from '../../src/provider';

const expect = chai.expect;

describe('EventStory Memory Provider', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = 'Event Data';

    beforeEach(() => {
        const streamId = '1';
        const aggregation = 'orders';
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

    it('should be able to get event ranged list from the event stream', async () => {
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD + '_1' });
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD + '_2' });
        const events = await ordersStream.getEvents(1, 5);
        expect(events.length).to.equal(2);
        expect(events[0].payload).to.equal(EVENT_PAYLOAD + '_1');
        expect(events[0].sequence).to.equal(1);
    });

    it('should be able to get aggregations from the event stream', async () => {
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        const aggregations = await eventStore.getAggregations();
        expect(aggregations.length).to.equal(1);
    });

    it('should be able to get streams from the event stream', async () => {
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        const orders = await eventStore.getStreams('orders');
        expect(orders.length).to.equal(1);
    });

    it('should be able to get ranged aggregations from the event stream', async () => {
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        const aggregations = await eventStore.getAggregations(0, 1);
        expect(aggregations.length).to.equal(1);
    });

    it('should be able to get ranged aggregations from the event stream', async () => {
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        const orders = await eventStore.getStreams('orders', 0, 1);
        expect(orders.length).to.equal(1);
    });
});
