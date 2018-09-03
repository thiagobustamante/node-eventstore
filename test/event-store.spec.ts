'use strict';

import * as chai from 'chai';
import 'mocha';
import { EventStore } from '../src';
import { InMemoryProvider } from '../src/provider';

const expect = chai.expect;

describe('EventStory', () => {
    let eventStore: EventStore;

    beforeEach(() => {
        eventStore = new EventStore(new InMemoryProvider());
    });

    it('should be able to add an event to the EventStream', async () => {
        const streamId = '1';
        const aggregation = 'orders';
        const ordersStream = eventStore.getEventStream(aggregation, streamId);
        expect(ordersStream.streamId).to.equal(streamId);
        expect(ordersStream.aggregation).to.equal(aggregation);
    });

    it('should be able to get the aggregations list', async () => {
        const streamId = '1';
        const aggregation = 'orders';
        const ordersStream = eventStore.getEventStream(aggregation, streamId);
        await ordersStream.addEvent({ payload: 'payload' });
        const aggregations = await eventStore.getAggregations();

        expect(aggregations.length).to.equal(1);
        expect(aggregations[0]).to.equal(aggregation);
    });
});
