jest.mock('../../../src/mysql/mysql');

import { MySQL } from '../../../src/mysql/mysql';
import { MySQLProvider } from '../../../src/provider/mysql';

const MySqlConstructorMock = MySQL as jest.Mock;
const mySqlMock = {
    query: jest.fn()
};

const ensureTablesSQL = 'CREATE TABLE IF NOT EXISTS events ('
    + 'id BIGINT NOT NULL AUTO_INCREMENT,'
    + 'streamId VARCHAR(40) NOT NULL,'
    + 'aggregation VARCHAR(40) NOT NULL,'
    + 'payload TEXT,'
    + 'sequence INT,'
    + 'commitTimestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,'
    + 'PRIMARY KEY (id),'
    + 'INDEX AGGREGATION_INDEX(aggregation),'
    + 'INDEX STREAM_ID_INDEX(streamId)'
    + ')';

describe('EventStory Redis Provider', () => {
    beforeAll(() => {
        MySqlConstructorMock.mockReturnValue(mySqlMock);
    });

    beforeEach(() => {
        MySqlConstructorMock.mockClear();
        mySqlMock.query.mockClear();
    });

    it('should be able to ask redis the events range', async () => {
        mySqlMock.query.mockResolvedValue([{ commitTimestamp: 'timestamp', payload: '"my event payload"', sequence: 1 }]);
        const config = { config: {} };
        const mySQLProvider = new MySQLProvider(config);
        const events = await mySQLProvider.getEvents({ aggregation: 'orders', id: '1' }, 2, 5);
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT * FROM events WHERE streamId=? AND aggregation=? LIMIT ?,?',
            ['1', 'orders', 2, 5]);
        expect(events.length).toEqual(1);
        expect(events[0]).toEqual({ commitTimestamp: 'timestamp', payload: 'my event payload', sequence: 1 });
        expect(MySqlConstructorMock).toBeCalledWith(config);
    });

    it('should be able to ask redis the events', async () => {
        mySqlMock.query.mockResolvedValue([{ commitTimestamp: 'timestamp', payload: '"my event payload"', sequence: 1 }]);

        const mySQLProvider = new MySQLProvider({});
        const events = await mySQLProvider.getEvents({ aggregation: 'orders', id: '1' });
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT * FROM events WHERE streamId=? AND aggregation=? LIMIT ?,?',
            ['1', 'orders', 0, Number.MAX_SAFE_INTEGER]);
        expect(events.length).toEqual(1);
        expect(events[0]).toEqual({ commitTimestamp: 'timestamp', payload: 'my event payload', sequence: 1 });
    });

    it('should be able to ask redis the events range without limit', async () => {
        mySqlMock.query.mockResolvedValue([{ commitTimestamp: 'timestamp', payload: '"my event payload"', sequence: 1 }]);
        const config = { config: {} };
        const mySQLProvider = new MySQLProvider(config);
        const events = await mySQLProvider.getEvents({ aggregation: 'orders', id: '1' }, 2, 0);
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT * FROM events WHERE streamId=? AND aggregation=? LIMIT ?,?',
            ['1', 'orders', 2, Number.MAX_SAFE_INTEGER]);
        expect(events.length).toEqual(1);
        expect(events[0]).toEqual({ commitTimestamp: 'timestamp', payload: 'my event payload', sequence: 1 });
        expect(MySqlConstructorMock).toBeCalledWith(config);
    });

    it('should be able to ask redis the aggregations range', async () => {
        mySqlMock.query.mockResolvedValue(['orders']);

        const mySQLProvider = new MySQLProvider({});
        const aggregations = await mySQLProvider.getAggregations(2, 5);
        expect(mySqlMock.query).toBeCalledWith('SELECT DISTINCT aggregation FROM events LIMIT ?,?',
            [2, 5]);
        expect(aggregations.length).toEqual(1);
        expect(aggregations[0]).toEqual('orders');
    });

    it('should be able to ask redis the aggregations range without limit', async () => {
        mySqlMock.query.mockResolvedValue(['orders']);

        const mySQLProvider = new MySQLProvider({});
        const aggregations = await mySQLProvider.getAggregations(2, 0);
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT DISTINCT aggregation FROM events LIMIT ?,?',
            [2, Number.MAX_SAFE_INTEGER]);
        expect(aggregations.length).toEqual(1);
        expect(aggregations[0]).toEqual('orders');
    });

    it('should be able to ask redis the aggregations', async () => {
        mySqlMock.query.mockResolvedValue(['orders']);

        const mySQLProvider = new MySQLProvider({});
        const aggregations = await mySQLProvider.getAggregations();
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT DISTINCT aggregation FROM events LIMIT ?,?',
            [0, Number.MAX_SAFE_INTEGER]);
        expect(aggregations.length).toEqual(1);
        expect(aggregations[0]).toEqual('orders');
    });

    it('should be able to ask redis the streams range', async () => {
        mySqlMock.query.mockResolvedValue(['123']);

        const mySQLProvider = new MySQLProvider({});
        const streams = await mySQLProvider.getStreams('orders', 2, 5);
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT DISTINCT streamId FROM events WHERE aggregation = ? LIMIT ?,?',
            ['orders', 2, 5]);
        expect(streams.length).toEqual(1);
        expect(streams[0]).toEqual('123');
    });

    it('should be able to ask redis the streams range without limit', async () => {
        mySqlMock.query.mockResolvedValue(['123']);

        const mySQLProvider = new MySQLProvider({});
        const streams = await mySQLProvider.getStreams('orders', 2, 0);
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT DISTINCT streamId FROM events WHERE aggregation = ? LIMIT ?,?',
            ['orders', 2, Number.MAX_SAFE_INTEGER]);
        expect(streams.length).toEqual(1);
        expect(streams[0]).toEqual('123');
    });

    it('should be able to ask redis the streams', async () => {
        mySqlMock.query.mockResolvedValue(['123']);

        const mySQLProvider = new MySQLProvider({});
        const streams = await mySQLProvider.getStreams('orders');
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT DISTINCT streamId FROM events WHERE aggregation = ? LIMIT ?,?',
            ['orders', 0, Number.MAX_SAFE_INTEGER]);
        expect(streams.length).toEqual(1);
        expect(streams[0]).toEqual('123');
    });

    it('should be checkTables only once', async () => {
        mySqlMock.query.mockResolvedValue(['123']);

        const mySQLProvider = new MySQLProvider({});
        await mySQLProvider.getStreams('orders');
        await mySQLProvider.getStreams('orders');
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('SELECT DISTINCT streamId FROM events WHERE aggregation = ? LIMIT ?,?',
            ['orders', 0, Number.MAX_SAFE_INTEGER]);
        expect(mySqlMock.query).toBeCalledTimes(3);
    });

    it('should be able to add an Event to the Event Stream', async () => {
        mySqlMock.query.mockResolvedValueOnce({});
        mySqlMock.query.mockResolvedValueOnce({ insertId: '1234' });
        mySqlMock.query.mockResolvedValueOnce({ commitTimestamp: 'timestamp', sequence: 111 });

        const mySQLProvider = new MySQLProvider({});
        const event = await mySQLProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
        expect(mySqlMock.query).toBeCalledWith(ensureTablesSQL);
        expect(mySqlMock.query).toBeCalledWith('INSERT INTO events(streamId, aggregation, payload, sequence) ' +
            'SELECT ?,?,?,COUNT(*) FROM events ' +
            'WHERE streamId = ? AND aggregation = ?',
            ['1', 'orders', JSON.stringify('EVENT PAYLOAD'), '1', 'orders']);
        expect(mySqlMock.query).toBeCalledWith('SELECT sequence, commitTimestamp FROM events WHERE id=?',
            ['1234']);
        expect(event).toEqual({
            commitTimestamp: 'timestamp',
            payload: 'EVENT PAYLOAD',
            sequence: 111
        });
    });
});
