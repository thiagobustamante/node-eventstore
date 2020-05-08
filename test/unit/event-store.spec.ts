import { wait, waitUntil } from 'test-wait';
import { EventStore, EventStream, InMemoryProvider, InMemoryPublisher } from '../../src';

describe('EventStory', () => {
    let eventStore: EventStore;
    let ordersStream: EventStream;
    const EVENT_PAYLOAD = 'Event Data';
    const STREAM_ID = '1';
    const AGGREGATION = 'orders';

    beforeEach(() => {
        eventStore = new EventStore(new InMemoryProvider(), new InMemoryPublisher());
        ordersStream = eventStore.getEventStream(AGGREGATION, STREAM_ID);
    });

    it('should be able to add an event to the EventStream', async () => {
        expect(ordersStream.streamId).toEqual(STREAM_ID);
        expect(ordersStream.aggregation).toEqual(AGGREGATION);
    });

    it('should be able to get the aggregations list', async () => {
        await ordersStream.addEvent('payload');
        const aggregations = await eventStore.getAggregations();

        expect(aggregations.length).toEqual(1);
        expect(aggregations[0]).toEqual(AGGREGATION);
    });

    it('should raise an Error if no persistence provider is set', async () => {
        const store = new EventStore(null);
        expect(() => store.provider).toThrow('No Provider configured in EventStore.');
    });

    it('should raise an Error if subscribe is called withou a valid publisher', async () => {
        const store = new EventStore(new InMemoryProvider());
        expect(() => store.subscribe('test', () => {
            fail('Should not be called');
        })).toThrow('There is no valid Publisher configured. '
            + 'Configure a Publisher that implements HasSubscribers int erface');
    });

    it('should be able to listen to EventStream changes', (done) => {
        eventStore.subscribe(ordersStream.aggregation, (message) => {
            expect(message.stream.aggregation).toEqual(ordersStream.aggregation);
            expect(message.stream.id).toEqual(ordersStream.streamId);
            expect(message.event.payload).toEqual(EVENT_PAYLOAD);
            done();
        }).then(() => ordersStream.addEvent(EVENT_PAYLOAD));
    });

    it('should be able to unsubscribe from EventStore changes channel', async () => {
        let count = 0;
        const subscription = await eventStore.subscribe(ordersStream.aggregation, message => {
            count++;
        });
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await waitUntil(() => count === 1);
        await subscription.remove();
        await ordersStream.addEvent(EVENT_PAYLOAD);
        await wait(100);
        expect(count).toEqual(1);
    });
});
