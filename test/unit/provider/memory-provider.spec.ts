'use strict';

import * as chai from 'chai';
import 'mocha';
import { EventStore, EventStream, InMemoryProvider } from '../../../src';

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
        const event = await ordersStream.addEvent(EVENT_PAYLOAD);
        expect(event).to.have.property('commitTimestamp');
        expect(event).to.have.property('sequence');
    });

    it('should be able to read events from the EventStream', async () => {
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await ordersStream.addEvent(EVENT_PAYLOAD + '_1');
        const events = await ordersStream.getEvents();
        expect(events.length).to.equals(2);
        expect(events[0].payload).to.equals(EVENT_PAYLOAD);
        expect(events[0].sequence).to.equals(0);
    });

    it('should be able to get event ranged list from the event stream', async () => {
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await ordersStream.addEvent(EVENT_PAYLOAD + '_1');
        await ordersStream.addEvent(EVENT_PAYLOAD + '_2');
        const events = await ordersStream.getEvents(1, 5);
        expect(events.length).to.equal(2);
        expect(events[0].payload).to.equal(EVENT_PAYLOAD + '_1');
        expect(events[0].sequence).to.equal(1);
    });

    it('should be able to get aggregations from the event stream', async () => {
        await ordersStream.addEvent(EVENT_PAYLOAD);
        const aggregations = await eventStore.getAggregations();
        expect(aggregations.length).to.equal(1);
    });

    it('should be able to get streams from the event stream', async () => {
        await ordersStream.addEvent(EVENT_PAYLOAD);
        const orders = await eventStore.getStreams('orders');
        expect(orders.length).to.equal(1);
    });

    it('should be able to get ranged aggregations from the event stream', async () => {
        await ordersStream.addEvent(EVENT_PAYLOAD);
        const offersStream = eventStore.getEventStream('offers', '1');
        await offersStream.addEvent(EVENT_PAYLOAD);
        const checkoutStream = eventStore.getEventStream('checkout', '1');
        await checkoutStream.addEvent(EVENT_PAYLOAD);
        const customersStream = eventStore.getEventStream('customers', '1');
        await customersStream.addEvent(EVENT_PAYLOAD);
        const aggregations = await eventStore.getAggregations(1, 2);
        expect(aggregations.length).to.equal(2);
        expect(aggregations[0]).to.equal('customers');
        expect(aggregations[1]).to.equal('offers');
    });

    it('should be able to get ranged aggregations from the event stream', async () => {
        await ordersStream.addEvent(EVENT_PAYLOAD);
        const orders2Stream = eventStore.getEventStream('orders', '2');
        await orders2Stream.addEvent(EVENT_PAYLOAD);
        const orders3Stream = eventStore.getEventStream('orders', '3');
        await orders3Stream.addEvent(EVENT_PAYLOAD);
        const orders4Stream = eventStore.getEventStream('orders', '4');
        await orders4Stream.addEvent(EVENT_PAYLOAD);
        const orders5Stream = eventStore.getEventStream('orders', '5');
        await orders5Stream.addEvent(EVENT_PAYLOAD);
        const orders6Stream = eventStore.getEventStream('orders', '6');
        await orders6Stream.addEvent(EVENT_PAYLOAD);
        const orders = await eventStore.getStreams('orders', 2, 3);
        expect(orders.length).to.equal(3);
        expect(orders[0]).to.equal('3');
        expect(orders[1]).to.equal('4');
        expect(orders[2]).to.equal('5');
    });

    it('should return an empty list of aggregations when there is no aggregation', async () => {
        const aggregations = await eventStore.getAggregations();
        expect(aggregations.length).to.equal(0);
    });

    it('should return an empty list of streams when there is no aggregation', async () => {
        const orders = await eventStore.getStreams('orders');
        expect(orders.length).to.equal(0);
    });

});
