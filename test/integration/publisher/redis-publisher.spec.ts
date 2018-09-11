'use strict';

import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream, InMemoryProvider, RedisPublisher } from '../../../src';
import { RedisFactory } from '../../../src/redis/connect';

chai.use(sinonChai);
const expect = chai.expect;

// tslint:disable:no-unused-expression
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
        const redis = RedisFactory.createClient(redisConfig);
        await redis.flushdb();
        eventStore = createEventStore();
        ordersStream = eventStore.getEventStream(aggregation, streamId);
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

    it('should be able to notify multiple listeners for a channel', async () => {
        const eventStoreNotified = createEventStore();

        const subscriberStub = sinon.stub();
        const subscriber2Stub = sinon.stub();
        await eventStoreNotified.subscribe('orders', subscriberStub);
        await eventStoreNotified.subscribe('orders', subscriber2Stub);
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => subscriberStub.calledOnce && subscriber2Stub.calledOnce);
    });

    function createEventStore() {
        return new EventStore(
            new InMemoryProvider(),
            new RedisPublisher(redisConfig));
    }
});
