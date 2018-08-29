'use strict';

import * as chai from 'chai';
import 'mocha';
import { EventStore, EventStream } from '../../src/event-store';
import { RedisProvider } from '../../src/provider/redis';
import { initializeRedis } from '../../src/redis/connect';

const expect = chai.expect;
// tslint:disable:no-unused-expression

describe('EventStory Redis Provider', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = "Event Data";
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
        eventStore = new EventStore(new RedisProvider(redisConfig));
        ordersStream = eventStore.getEventStream(aggregation, streamId);
    });

    it('should be able to add an event to the event stream', async () => {
        const event = await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        expect(event).to.be.not.null;
        expect(event.commitTimestamp).to.be.not.null;
        expect(event.sequence).to.be.not.null;
    });

    it('should be able to get event list from the event stream', async () => {
        await ordersStream.addEvent({ payload: EVENT_PAYLOAD });
        const events = await ordersStream.getEvents()
        expect(events.length).to.equal(1);
        expect(events[0].payload).to.equal(EVENT_PAYLOAD);
        expect(events[0].sequence).to.equal(0);
    });
});
