jest.mock('../../../src/redis/connect');

import { RedisFactory } from '../../../src/redis/connect';
import { RedisProvider } from '../../../src/provider/redis';

const createClientMock = RedisFactory.createClient as jest.Mock;
const redisMock = {
    exec: jest.fn(),
    incr: jest.fn(),
    lrange: jest.fn(),
    multi: jest.fn(),
    rpush: jest.fn(),
    time: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn()
};

describe('EventStory Redis Provider', () => {
    beforeAll(() => {
        createClientMock.mockReturnValue(redisMock);
    });

    beforeEach(() => {
        createClientMock.mockClear();
        redisMock.exec.mockClear();
        redisMock.incr.mockClear();
        redisMock.lrange.mockClear();
        redisMock.multi.mockClear();
        redisMock.rpush.mockClear();
        redisMock.time.mockClear();
        redisMock.zadd.mockClear();
        redisMock.zrange.mockClear();
    });

    it('should be able to ask redis the events range', async () => {
        redisMock.lrange.mockResolvedValue(['{ "payload": "EVENT PAYLOAD"}']);

        const redisProvider = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getEvents({ aggregation: 'orders', id: '1' }, 2, 5);
        expect(redisMock.lrange).toBeCalledWith('orders:1', 2, 5);
        expect(events.length).toEqual(1);
        expect(events[0].payload).toEqual('EVENT PAYLOAD');
    });

    it('should be able to ask redis the events', async () => {
        redisMock.lrange.mockResolvedValue(['{ "payload": "EVENT PAYLOAD"}']);

        const redisProvider = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getEvents({ aggregation: 'orders', id: '1' });
        expect(redisMock.lrange).toBeCalledWith('orders:1', 0, -1);
        expect(events.length).toEqual(1);
        expect(events[0].payload).toEqual('EVENT PAYLOAD');
    });

    it('should be able to ask redis the aggregations range', async () => {
        redisMock.zrange.mockResolvedValue(['orders']);

        const redisProvider = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getAggregations(2, 5);
        expect(redisMock.zrange).toBeCalledWith('meta:aggregations', 2, 5);
        expect(events.length).toEqual(1);
        expect(events[0]).toEqual('orders');
    });

    it('should be able to ask redis the aggregations', async () => {
        redisMock.zrange.mockResolvedValue(['orders', 'offers', 'checkout', 'customers']);

        const redisProvider = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getAggregations();
        expect(redisMock.zrange).toBeCalledWith('meta:aggregations', 0, -1);
        expect(events.length).toEqual(4);
        expect(events[0]).toEqual('orders');
    });

    it('should be able to ask redis the streams range', async () => {
        redisMock.zrange.mockResolvedValue(['1']);

        const redisProvider = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getStreams('orders', 2, 5);
        expect(redisMock.zrange).toBeCalledWith('meta:aggregations:orders', 2, 5);
        expect(events.length).toEqual(1);
        expect(events[0]).toEqual('1');
    });

    it('should be able to ask redis the streams', async () => {
        redisMock.zrange.mockResolvedValue(['1', '2', '3', '4']);

        const redisProvider = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getStreams('orders');
        expect(redisMock.zrange).toBeCalledWith('meta:aggregations:orders', 0, -1);
        expect(events.length).toEqual(4);
        expect(events[0]).toEqual('1');
    });

    it('should be able to add an Event to the Event Stream', async () => {
        redisMock.incr.mockResolvedValue(1);
        redisMock.time.mockResolvedValue(1);
        redisMock.multi.mockReturnValue(redisMock);
        redisMock.rpush.mockReturnValue(redisMock);
        redisMock.zadd.mockReturnValue(redisMock);

        const type = 'evtType';
        const redisProvider = new RedisProvider({ standalone: { host: 'localhost' } });
        const event = await redisProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD', type);
        expect(redisMock.incr).toBeCalledWith('sequences:{orders:1}');
        expect(redisMock.time).toBeCalledTimes(1);
        expect(redisMock.multi).toBeCalledTimes(1);
        expect(redisMock.rpush).toBeCalledWith('orders:1', '{"commitTimestamp":1,"payload":"EVENT PAYLOAD","sequence":0,"type":"evtType"}');
        expect(redisMock.zadd).toBeCalledTimes(2);
        expect(redisMock.zadd).toBeCalledWith('meta:aggregations', '1', 'orders');
        expect(redisMock.zadd).toBeCalledWith('meta:aggregations:orders', '1', '1');
        expect(redisMock.exec).toBeCalledTimes(1);
        expect(event.sequence).toEqual(0);
        expect(event.commitTimestamp).toEqual(1);
    });

    it('should use empty as default event type', async () => {
        redisMock.incr.mockResolvedValue(1);
        redisMock.time.mockResolvedValue(1);
        redisMock.multi.mockReturnValue(redisMock);
        redisMock.rpush.mockReturnValue(redisMock);
        redisMock.zadd.mockReturnValue(redisMock);

        const redisProvider = new RedisProvider({ standalone: { host: 'localhost' } });
        const event = await redisProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
        expect(redisMock.incr).toBeCalledWith('sequences:{orders:1}');
        expect(redisMock.time).toBeCalledTimes(1);
        expect(redisMock.multi).toBeCalledTimes(1);
        expect(redisMock.rpush).toBeCalledWith('orders:1', '{"commitTimestamp":1,"payload":"EVENT PAYLOAD","sequence":0,"type":""}');
        expect(redisMock.zadd).toBeCalledTimes(2);
        expect(redisMock.zadd).toBeCalledWith('meta:aggregations', '1', 'orders');
        expect(redisMock.zadd).toBeCalledWith('meta:aggregations:orders', '1', '1');
        expect(redisMock.exec).toBeCalledTimes(1);
        expect(event.sequence).toEqual(0);
        expect(event.commitTimestamp).toEqual(1);
    });
});
