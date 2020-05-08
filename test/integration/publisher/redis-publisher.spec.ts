import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream, InMemoryProvider, RedisPublisher } from '../../../src';
import { RedisFactory } from '../../../src/redis/connect';

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
        const subscriberStub = jest.fn();

        const subscription = await eventStoreNotified.subscribe(ordersStream.aggregation, subscriberStub);
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => subscriberStub.mock.calls.length === 1);
        await subscription.remove();
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await wait(10);
        expect(subscriberStub).toBeCalledTimes(1);
    });

    it('should be able to notify multiple listeners for a channel', async () => {
        const eventStoreNotified = createEventStore();

        const subscriberStub = jest.fn();
        const subscriber2Stub = jest.fn();
        await eventStoreNotified.subscribe('orders', subscriberStub);
        await eventStoreNotified.subscribe('orders', subscriber2Stub);
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => subscriberStub.mock.calls.length === 1 && subscriber2Stub.mock.calls.length === 1);
    });

    it('should not notify listeners about other aggregation changes', async () => {
        const eventStoreNotified = createEventStore();
        const customersStream = eventStore.getEventStream('customers', '1');

        const subscriberOffersStub = jest.fn();
        const subscriberOrdersStub = jest.fn();
        await eventStoreNotified.subscribe('offers', subscriberOffersStub);
        await eventStoreNotified.subscribe('orders', subscriberOrdersStub);
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await customersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => subscriberOrdersStub.mock.calls.length === 1);
        await wait(10);

        expect(subscriberOffersStub).not.toBeCalled();
        expect(subscriberOrdersStub).toBeCalledTimes(1);
    });

    function createEventStore() {
        return new EventStore(
            new InMemoryProvider(),
            new RedisPublisher(redisConfig));
    }
});
