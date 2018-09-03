'use strict';

import * as chai from 'chai';
import 'mocha';
import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream } from '../../src';
import { InMemoryProvider } from '../../src/provider';
import { RabbitMQPublisher } from '../../src/publisher';

const expect = chai.expect;

describe('EventStory RabbitMQ Publisher', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = 'Event Data';
    let count = 0;
    const rabbitmqUrl = 'amqp://localhost';

    beforeEach(async () => {
        const streamId = '1';
        const aggregation = 'orders';
        eventStore = createEventStore();
        ordersStream = eventStore.getEventStream(aggregation, streamId);
    });

    it('should be able to subscribe and unsubscribe to EventStore changes channel', async () => {
        count = 0;
        const subscription = await eventStore.subscribe(ordersStream.aggregation, message => {
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
            new RabbitMQPublisher(rabbitmqUrl));
    }
});
