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
        const subscriberStub = sinon.stub();

        const subscription = await eventStoreNotified.subscribe(ordersStream.aggregation, subscriberStub);
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => subscriberStub.calledOnce);
        await subscription.remove();
        await ordersStream.addEvent(EVENT_PAYLOAD);
        wait(500);
        expect(subscriberStub).to.have.callCount(1);
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

    it('should not notify listeners about other aggregation changes', async () => {
        const eventStoreNotified = createEventStore();
        const customersStream = eventStore.getEventStream('customers', '1');

        const subscriberOffersStub = sinon.stub();
        const subscriberOrdersStub = sinon.stub();
        await eventStoreNotified.subscribe('offers', subscriberOffersStub);
        await eventStoreNotified.subscribe('orders', subscriberOrdersStub);
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await customersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => subscriberOrdersStub.calledOnce);
        await wait(10);

        expect(subscriberOffersStub).to.not.have.been.called;
        expect(subscriberOrdersStub).to.have.been.calledOnce;
    });

    function createEventStore() {
        return new EventStore(
            new InMemoryProvider(),
            new RedisPublisher(redisConfig));
    }
});
