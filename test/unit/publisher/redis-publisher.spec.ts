jest.mock('../../../src/redis/connect');

import { Message } from '../../../src/model/message';
import { RedisFactory } from '../../../src/redis/connect';
import { RedisPublisher } from '../../../src/publisher/redis'; '';

const createClientMock = RedisFactory.createClient as jest.Mock;
const redisMock = {
    on: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
};

describe('EventStory Redis Publisher', () => {
    beforeAll(() => {
        createClientMock.mockReturnValue(redisMock as any);
    });

    afterEach(() => {
        createClientMock.mockClear();
        redisMock.on.mockClear();
        redisMock.publish.mockClear();
        redisMock.subscribe.mockClear();
        redisMock.unsubscribe.mockClear();
    });

    it('should be able to publish events to redis', async () => {
        const redisPublisher = new RedisPublisher({ standalone: { host: 'localhost' } });

        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: 'PAYLOAD',
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };
        redisMock.publish.mockResolvedValue(1);
        const status = await redisPublisher.publish(message);

        expect(redisMock.publish).toBeCalledWith(message.stream.aggregation, JSON.stringify(message));
        expect(redisMock.publish).toBeCalledTimes(1);
        expect(status).toBeTruthy();
    });

    it('should be able to notify when no listener reacted to a publish event', async () => {
        const redisPublisher = new RedisPublisher({ standalone: { host: 'localhost' } });

        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: 'PAYLOAD',
                sequence: 2
            },
            stream: {
                aggregation: 'offers',
                id: '1'
            }
        };
        redisMock.publish.mockResolvedValue(0);
        const status = await redisPublisher.publish(message);

        expect(redisMock.publish).toBeCalledTimes(1);
        expect(redisMock.publish).toBeCalledWith(message.stream.aggregation, JSON.stringify(message));
        expect(status).toBeFalsy();
    });

    it('should be able to subscribe to listen changes in the eventstore', async () => {
        redisMock.on.mockResolvedValue(redisMock);
        const redisPublisher = new RedisPublisher({ standalone: { host: 'localhost' } });

        const subscriberOrdersStub = jest.fn();
        const subscriberOrdersStub2 = jest.fn();
        const subscription = await redisPublisher.subscribe('orders', subscriberOrdersStub);
        await redisPublisher.subscribe('orders', () => subscriberOrdersStub2);

        await subscription.remove();

        expect(redisMock.subscribe).toBeCalledTimes(2);
        expect(redisMock.subscribe).toBeCalledWith('orders');
        expect(redisMock.on).toBeCalledTimes(1);
        expect(redisMock.unsubscribe).not.toBeCalled();
    });

    it('should be able to unsubscribe to redis channel', async () => {
        redisMock.on.mockResolvedValue(redisMock);
        const redisPublisher = new RedisPublisher({ standalone: { host: 'localhost' } });

        const subscriberOrdersStub = jest.fn();
        const subscription = await redisPublisher.subscribe('orders', subscriberOrdersStub);
        await subscription.remove();

        expect(redisMock.subscribe).toBeCalledWith('orders');
        expect(redisMock.subscribe).toBeCalledTimes(1);
        expect(redisMock.on).toBeCalledTimes(1);
        expect(redisMock.unsubscribe).toBeCalledWith('orders');
        expect(redisMock.unsubscribe).toBeCalledTimes(1);
    });
});
