'use strict';

import * as chai from 'chai';
import 'mocha';
// import * as sinon from 'sinon';
import { EventStore, EventStream, RedisProvider } from '../../../src';
import { RedisFactory } from '../../../src/redis/connect';
// const redisMock = require('ioredis-mock');

const expect = chai.expect;
// tslint:disable:no-unused-expression

describe('EventStory Redis Provider', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = 'Event Data';
    const redisConfig = {
        options: {
            db: 6
        },
        standalone: {
            host: 'localhost',
            port: 6379
        }
    };
    beforeEach(async () => {
        const streamId = '1';
        const aggregation = 'orders';
        // sinon.stub(RedisFactory, 'createClient')
        //     .withArgs(redisConfig)
        //     .returns(new redisMock(redisConfig.standalone.port,
        //         redisConfig.standalone.host, redisConfig.options));

        const redis = RedisFactory.createClient(redisConfig);
        await redis.flushdb();
        eventStore = new EventStore(new RedisProvider(redisConfig));
        ordersStream = eventStore.getEventStream(aggregation, streamId);
    });

    afterEach(() => {
        // (RedisFactory as any).createClient.restore();
    });

    it('should be able to add an event to the event stream', async () => {
        const event = await ordersStream.addEvent(EVENT_PAYLOAD);
        expect(event).to.be.not.null;
        expect(event.commitTimestamp).to.be.not.null;
        expect(event.sequence).to.be.not.null;
    });

    it('should be able to get event list from the event stream', async () => {
        await ordersStream.addEvent(EVENT_PAYLOAD);
        const events = await ordersStream.getEvents()
        expect(events.length).to.equal(1);
        expect(events[0].payload).to.equal(EVENT_PAYLOAD);
        expect(events[0].sequence).to.equal(0);
    });

    it('should be able to get event ranged list from the event stream', async () => {
        const eventStream = eventStore.getEventStream('orders', '2');
        await eventStream.addEvent(EVENT_PAYLOAD);
        await eventStream.addEvent(EVENT_PAYLOAD + '_1');
        await eventStream.addEvent(EVENT_PAYLOAD + '_2');
        const events = await eventStream.getEvents(1, 5);
        expect(events.length).to.equal(2);
        expect(events[0].payload).to.equal(EVENT_PAYLOAD + '_1');
        expect(events[0].sequence).to.equal(1);
    });

    it('should be able to get aggregations from the event stream', async () => {
        const eventStream = eventStore.getEventStream('orders', '3');
        await eventStream.addEvent(EVENT_PAYLOAD);
        const aggregations = await eventStore.getAggregations();
        expect(aggregations.length).to.equal(1);
    });

    it('should be able to get streams from the event stream', async () => {
        const eventStream = eventStore.getEventStream('orders', '4');
        await eventStream.addEvent(EVENT_PAYLOAD);
        const orders = await eventStore.getStreams('orders');
        expect(orders.length).to.equal(1);
    });

    it('should be able to get ranged aggregations from the event stream', async () => {
        const eventStream = eventStore.getEventStream('orders', '5');
        await eventStream.addEvent(EVENT_PAYLOAD);
        const aggregations = await eventStore.getAggregations(0, 1);
        expect(aggregations.length).to.equal(1);
    });

    it('should be able to get ranged aggregations from the event stream', async () => {
        const eventStream = eventStore.getEventStream('orders', '5');
        await eventStream.addEvent(EVENT_PAYLOAD);
        const orders = await eventStore.getStreams('orders', 0, 1);
        expect(orders.length).to.equal(1);
    });
});
