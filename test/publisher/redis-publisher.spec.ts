'use strict';

import * as chai from 'chai';
import 'mocha';
import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream } from '../../src/event-store';
import { InMemoryProvider } from '../../src/provider/memory';
import { RedisPublisher } from '../../src/publisher/redis';
import { initializeRedis } from '../../src/redis/connect';

const expect = chai.expect;

describe('EventStory Redis Publisher', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = "Event Data";
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
    const redis = initializeRedis(redisConfig);

    beforeEach(async () => {
        const streamId = "1";
        const aggregation = "orders";
        await redis.flushdb();
        eventStore = createEventStore();
        ordersStream = eventStore.getEventStream(aggregation, streamId);
    });

    it('should be able to subscribe and unsubscribe to EventStore changes channel', async () => {
        const eventStoreNotified = createEventStore();
        count = 0;
        const subscription = await eventStoreNotified.subscribe(ordersStream.aggregation, message => {
            // tslint:disable-next-line:no-console
            console.log('trsadsdadasdasd');
            count++;
        });
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        await waitUntil(() => count === 1);
        await subscription.remove();;
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        wait(500);
        expect(count).to.equal(1);
    });

    function createEventStore() {
        return new EventStore(
            new InMemoryProvider(),
            new RedisPublisher(redisConfig));
    }
});
