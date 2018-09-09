'use strict';

import * as chai from 'chai';
import 'mocha';
import { EventStore, InMemoryProvider } from '../../src';

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
        await ordersStream.addEvent('payload');
        const aggregations = await eventStore.getAggregations();

        expect(aggregations.length).to.equal(1);
        expect(aggregations[0]).to.equal(aggregation);
    });

    it('should raise an Error if no persistence provider is set', async () => {
        const store = new EventStore(null);
        expect(() => store.provider).to.throw('No Provider configured in EventStore.');
    });

    it('should raise an Error if subscribe is called withou a valid publisher', async () => {
        expect(() => eventStore.subscribe('test', () => {
            chai.assert.fail('Should not be called');
        })).to.throw('There is no valid Publisher configured. '
            + 'Configure a Publisher that implements HasSubscribers int erface');
    });

});
