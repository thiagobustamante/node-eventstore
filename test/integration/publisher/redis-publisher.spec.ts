'use strict';

import * as chai from 'chai';
import 'mocha';
// import * as sinon from 'sinon';
import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream, InMemoryProvider, RedisPublisher } from '../../../src';
import { RedisFactory } from '../../../src/redis/connect';

// const redisMock = require('ioredis-mock');
const expect = chai.expect;

describe('EventStory Redis Publisher (Integration)', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = 'Event Data';
    let count = 0;
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
        // sandbox = sinon.createSandbox();
        // sinon.stub(RedisFactory, 'createClient')
        //     .withArgs(redisConfig)
        //     .returns(new redisMock(redisConfig.standalone.port,
        //         redisConfig.standalone.host, redisConfig.options));
        const redis = RedisFactory.createClient(redisConfig);
        await redis.flushdb();
        eventStore = createEventStore();
        ordersStream = eventStore.getEventStream(aggregation, streamId);
    });

    afterEach(() => {
        // (RedisFactory as any).createClient.restore();
    });

    it('should be able to subscribe and unsubscribe to EventStore changes channel', async () => {
        const eventStoreNotified = createEventStore();
        count = 0;
        const subscription = await eventStoreNotified.subscribe(ordersStream.aggregation, message => {
            count++;
        });
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => count === 1);
        await subscription.remove();
        await ordersStream.addEvent(EVENT_PAYLOAD);
        wait(500);
        expect(count).to.equal(1);
    });

    function createEventStore() {
        return new EventStore(
            new InMemoryProvider(),
            new RedisPublisher(redisConfig));
    }
});
