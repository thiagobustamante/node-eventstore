import { InMemoryPublisher, Message } from '../../../src';

describe('EventStory Memory Publisher', () => {
    const EVENT_PAYLOAD = 'Event Data';
    let memoryPublisher: InMemoryPublisher;

    beforeEach(() => {
        memoryPublisher = new InMemoryPublisher();
    });

    it('should be able to publish messages to listeners', async () => {

        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: EVENT_PAYLOAD,
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };

        const subscriberMock = jest.fn();
        await memoryPublisher.subscribe('orders', subscriberMock);
        const status = await memoryPublisher.publish(message);

        expect(subscriberMock).toBeCalledTimes(1);
        expect(subscriberMock).toBeCalledWith(message);
        expect(status).toBeTruthy();
    });

    it('should be able to notify multiple listeners', async () => {
        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: EVENT_PAYLOAD,
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };

        const subscriberMock = jest.fn();
        const subscriber2Mock = jest.fn();
        await memoryPublisher.subscribe('orders', subscriberMock);
        await memoryPublisher.subscribe('orders', subscriber2Mock);
        const status = await memoryPublisher.publish(message);

        expect(subscriberMock).toBeCalledTimes(1);
        expect(subscriberMock).toBeCalledWith(message);
        expect(subscriber2Mock).toBeCalledTimes(1);
        expect(subscriber2Mock).toBeCalledWith(message);
        expect(status).toBeTruthy();
    });

    it('should be able to check if a message was published', async () => {
        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: EVENT_PAYLOAD,
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };

        const status = await memoryPublisher.publish(message);

        expect(status).toBeFalsy();
    });
});
