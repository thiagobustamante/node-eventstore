jest.mock('mongodb');

import { MongoClient } from 'mongodb';
import { MongoProvider } from '../../../src/provider/mongo';

const mongoClientConnectMock = MongoClient.connect as jest.Mock;
const aggregationCursorMock = {
    group: jest.fn(),
    limit: jest.fn(),
    match: jest.fn(),
    skip: jest.fn(),
    toArray: jest.fn()
};
const dbMock = {
    collection: jest.fn()
};
const collectionMock = {
    aggregate: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    insertOne: jest.fn()
};
const cursorMock = {
    limit: jest.fn(),
    skip: jest.fn(),
    toArray: jest.fn()
};
const mongoMock = { 
    db: jest.fn() 
};

describe('EventStory Mongo Provider', () => {

    beforeAll(() => {
        aggregationCursorMock.match.mockReturnValue(aggregationCursorMock);
        aggregationCursorMock.group.mockReturnValue(aggregationCursorMock);
        aggregationCursorMock.skip.mockReturnValue(aggregationCursorMock);
        aggregationCursorMock.limit.mockReturnValue(aggregationCursorMock);
        collectionMock.aggregate.mockReturnValue(aggregationCursorMock);
        cursorMock.skip.mockReturnValue(cursorMock);
        cursorMock.limit.mockReturnValue(cursorMock);
        collectionMock.find.mockReturnValue(cursorMock);
        dbMock.collection.mockReturnValue(collectionMock);
        mongoMock.db.mockReturnValue(dbMock);       
        mongoClientConnectMock.mockResolvedValue(mongoMock);
    });

    beforeEach(() => {
        aggregationCursorMock.group.mockClear();
        aggregationCursorMock.limit.mockClear();
        aggregationCursorMock.match.mockClear();
        aggregationCursorMock.skip.mockClear();
        aggregationCursorMock.toArray.mockClear();
        dbMock.collection.mockClear();
        collectionMock.aggregate.mockClear();
        collectionMock.find.mockClear();
        collectionMock.findOneAndUpdate.mockClear();
        collectionMock.insertOne.mockClear();
        cursorMock.limit.mockClear();
        cursorMock.skip.mockClear();
        cursorMock.toArray.mockClear();
        mongoMock.db.mockClear();
        mongoClientConnectMock.mockClear();
    });

    it('should be able to ask mongo the events range', async () => {
        cursorMock.toArray.mockResolvedValue([{ payload: 'EVENT PAYLOAD' }]);

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getEvents({ aggregation: 'orders', id: '1' }, 2, 5);
        expect(mongoMock.db).toBeCalledTimes(1);
        expect(dbMock.collection).toBeCalledTimes(1)
        expect(dbMock.collection).toBeCalledWith('events');
        expect(collectionMock.find).toBeCalledWith({ 'stream.id': '1', 'stream.aggregation': 'orders' });
        expect(cursorMock.skip).toBeCalledWith(2);
        expect(cursorMock.limit).toBeCalledWith(5);
        expect(events[0].payload).toEqual('EVENT PAYLOAD');
    });

    it('should be able to ask mongo the events', async () => {
        cursorMock.toArray.mockResolvedValue([{ payload: 'EVENT PAYLOAD' }]);

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getEvents({ aggregation: 'orders', id: '1' });
        expect(mongoMock.db).toBeCalledTimes(1);
        expect(dbMock.collection).toBeCalledTimes(1)
        expect(dbMock.collection).toBeCalledWith('events');
        expect(collectionMock.find).toBeCalledWith({ 'stream.id': '1', 'stream.aggregation': 'orders' });
        expect(cursorMock.skip).not.toBeCalled();
        expect(cursorMock.limit).not.toBeCalled();
        expect(events[0].payload).toEqual('EVENT PAYLOAD');
    });

    it('should be able to ask mongo the aggregations range', async () => {
        aggregationCursorMock.toArray.mockResolvedValue(['orders']);

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getAggregations(2, 5);

        expect(mongoMock.db).toBeCalledTimes(1);
        expect(dbMock.collection).toBeCalledTimes(1)
        expect(dbMock.collection).toBeCalledWith('events');
        expect(collectionMock.aggregate).toBeCalled();
        expect(aggregationCursorMock.group).toBeCalledWith({ _id: '$stream.aggregation' });
        expect(aggregationCursorMock.skip).toBeCalledWith(2);
        expect(aggregationCursorMock.limit).toBeCalledWith(5);
        expect(events.length).toEqual(1);
        expect(events[0]).toEqual('orders');
    });

    it('should be able to ask mongo the aggregations', async () => {
        aggregationCursorMock.toArray.mockResolvedValue(['orders', 'offers', 'checkout', 'customers']);

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getAggregations();

        expect(mongoMock.db).toBeCalledTimes(1);
        expect(dbMock.collection).toBeCalledTimes(1)
        expect(dbMock.collection).toBeCalledWith('events');
        expect(collectionMock.aggregate).toBeCalled();
        expect(aggregationCursorMock.group).toBeCalledWith({ _id: '$stream.aggregation' });
        expect(aggregationCursorMock.skip).not.toBeCalled();
        expect(aggregationCursorMock.limit).not.toBeCalled();
        expect(events.length).toEqual(4);
        expect(events[0]).toEqual('orders');
    });

    it('should be able to ask mongo the streams range', async () => {
        aggregationCursorMock.toArray.mockResolvedValue(['1']);

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getStreams('orders', 2, 5);

        expect(mongoMock.db).toBeCalledTimes(1);
        expect(dbMock.collection).toBeCalledTimes(1)
        expect(dbMock.collection).toBeCalledWith('events');
        expect(collectionMock.aggregate).toBeCalled();
        expect(aggregationCursorMock.match).toBeCalledWith({ 'stream.aggregation': 'orders' });
        expect(aggregationCursorMock.group).toBeCalledWith({ _id: '$stream.id' });
        expect(aggregationCursorMock.skip).toBeCalledWith(2);
        expect(aggregationCursorMock.limit).toBeCalledWith(5);
        expect(events.length).toEqual(1);
        expect(events[0]).toEqual('1');
    });

    it('should be able to ask mongo the streams', async () => {
        aggregationCursorMock.toArray.mockResolvedValue(['1', '2', '3', '4']);

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getStreams('orders');

        expect(mongoMock.db).toBeCalledTimes(1);
        expect(dbMock.collection).toBeCalledTimes(1)
        expect(dbMock.collection).toBeCalledWith('events');
        expect(collectionMock.aggregate).toBeCalled();
        expect(aggregationCursorMock.match).toBeCalledWith({ 'stream.aggregation': 'orders' });
        expect(aggregationCursorMock.group).toBeCalledWith({ _id: '$stream.id' });
        expect(aggregationCursorMock.skip).not.toBeCalled();
        expect(aggregationCursorMock.limit).not.toBeCalled();
        expect(events.length).toEqual(4);
        expect(events[0]).toEqual('1');
    });

    it('should be able to add an Event to the Event Stream', async () => {
        collectionMock.findOneAndUpdate.mockResolvedValue({ value: { sequence_value: 1 }, ok: true });
        collectionMock.insertOne.mockResolvedValue({ result: { ok: true } });

        const mongoURL = 'mongodb://localhost:27017/eventstore';
        const mongoProvider = new MongoProvider(mongoURL);
        const event = await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');

        expect(mongoClientConnectMock).toBeCalledTimes(1);
        expect(mongoClientConnectMock).toBeCalledWith(mongoURL, { useNewUrlParser: true });
        expect(mongoMock.db).toBeCalledTimes(2);
        expect(dbMock.collection).toBeCalledTimes(2);
        expect(dbMock.collection).toBeCalledWith('events');
        expect(dbMock.collection).toBeCalledWith('counters');
        expect(collectionMock.findOneAndUpdate).toBeCalledWith(
            { _id: `orders:1` },
            { $inc: { sequence_value: 1 } },
            {
                returnOriginal: false,
                upsert: true
            });
        expect(collectionMock.insertOne).toBeCalledWith(
            expect.objectContaining({
                commitTimestamp: expect.anything(),
                payload: 'EVENT PAYLOAD',
                sequence: 0,
                stream: expect.objectContaining({ aggregation: 'orders', id: '1' })
            }));
        expect(event.sequence).toEqual(0);
        // expect(event.commitTimestamp).toEqual(1);
    });

    it('should be able to handle errors in sequence reading', async () => {
        collectionMock.findOneAndUpdate.mockResolvedValue({ value: {}, ok: false });

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        try {
            await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
            fail('An Error was expected');
        } catch (e) {
            expect(e.message).toEqual('Error reading next sequence value');
        }

        expect(mongoMock.db).toBeCalledTimes(2);
        expect(dbMock.collection).toBeCalledTimes(2);
        expect(dbMock.collection).toBeCalledWith('events');
        expect(dbMock.collection).toBeCalledWith('counters');
        expect(collectionMock.findOneAndUpdate).toBeCalledWith(
            { _id: `orders:1` },
            { $inc: { sequence_value: 1 } },
            {
                returnOriginal: false,
                upsert: true
            });
    });

    it('should be able to handle errors in object writing', async () => {
        collectionMock.findOneAndUpdate.mockResolvedValue({ value: { sequence_value: 1 }, ok: true });
        collectionMock.insertOne.mockResolvedValue({ result: { ok: false } });

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        try {
            await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
            fail('An Error was expected');
        } catch (e) {
            expect(e.message).toEqual('Error saving event into the store');
        }

        expect(mongoMock.db).toBeCalledTimes(2);
        expect(dbMock.collection).toBeCalledTimes(2);
        expect(dbMock.collection).toBeCalledWith('events');
        expect(dbMock.collection).toBeCalledWith('counters');
        expect(collectionMock.findOneAndUpdate).toBeCalledWith(
            { _id: `orders:1` },
            { $inc: { sequence_value: 1 } },
            {
                returnOriginal: false,
                upsert: true
            });
        expect(collectionMock.insertOne).toBeCalledWith(
            expect.objectContaining({
                commitTimestamp: expect.anything(),
                payload: 'EVENT PAYLOAD',
                sequence: 0,
                stream: expect.objectContaining({ aggregation: 'orders', id: '1' })
            }));
        // expect(event.commitTimestamp).toEqual(1);
    });

    it('should only initiate collections once', async () => {
        collectionMock.findOneAndUpdate.mockResolvedValue({ value: { sequence_value: 1 }, ok: true });
        collectionMock.insertOne.mockResolvedValue({ result: { ok: true } });

        const mongoProvider = new MongoProvider('mongodb://localhost:27017/eventstore');
        await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
        await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD_2');

        expect(mongoClientConnectMock).toBeCalledTimes(1);
        expect(mongoMock.db).toBeCalledTimes(2);
        expect(dbMock.collection).toBeCalledTimes(2);
        expect(dbMock.collection).toBeCalledWith('events');
        expect(dbMock.collection).toBeCalledWith('counters');
    });

});
