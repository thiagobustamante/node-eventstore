jest.mock('../../../src/mysql/connect');

import * as _ from 'lodash';
import { MySQLConfig } from '../../../src/mysql/config';
import { MySQL } from '../../../src/mysql/mysql';
import { MySQLFactory } from '../../../src/mysql/connect';

const createPoolMock = MySQLFactory.createPool as jest.Mock;
const getConnectionMock = jest.fn();
const poolMock = {
    getConnection: getConnectionMock
};

const connectionMock = {
    query: jest.fn(),
    release: jest.fn()
};
describe('MySQL', () => {
    beforeAll(() => {
        createPoolMock.mockReturnValue(poolMock);
        getConnectionMock.mockImplementation((callback) => callback(null, connectionMock));
    });

    beforeEach(() => {
        createPoolMock.mockClear();
        getConnectionMock.mockClear();
        connectionMock.query.mockClear();
        connectionMock.release.mockClear();
    });

    it('should be able to create a connection pool for mysql', async () => {
        const mySQLConfig: MySQLConfig = {
            config: {
                database: 'test-db',
                host: 'localhost',
                port: 13306
            }
        };

        const mySql = new MySQL(mySQLConfig);

        expect(createPoolMock).toBeCalledWith(mySQLConfig);
        expect((mySql as any).pool).toEqual(poolMock);
    });

    it('should be able to run a SQL query', async () => {
        const sql = 'some sql string';
        const rows = [{ aField: 'value' }];

        connectionMock.query.mockImplementation((_sql, _args, callback) => callback(null, rows));

        const mySql = new MySQL({});
        const result = await mySql.query(sql);

        expect(getConnectionMock).toBeCalledTimes(1);
        expect(connectionMock.query).toBeCalledWith(sql, [], expect.anything());
        expect(connectionMock.release).toBeCalledTimes(1);
        expect(result).toEqual(rows);
    });

    it('should be able to run a SQL query with arguments', async () => {
        const sql = 'some sql string';
        const args = ['some arguments'];
        const rows = [{ aField: 'value' }];

        connectionMock.query.mockImplementation((_sql, _args, callback) => callback(null, rows));

        const mySql = new MySQL({});
        const result = await mySql.query(sql, args);

        expect(connectionMock.query).toBeCalledWith(sql, args, expect.anything());
        expect(connectionMock.release).toBeCalledTimes(1);
        expect(result).toEqual(rows);
    });

    it('should be able to handle connection errors', async () => {
        const sql = 'some sql string';
        const args = ['some arguments'];
        const error = new Error('Test error');

        getConnectionMock.mockImplementationOnce((callback) => callback(error, null));

        const mySql = new MySQL({});
        expect(() => mySql.query(sql, args)).rejects.toThrow(error);
    });

    it('should be able to handle mysql errors', async () => {
        const sql = 'some sql string';
        const args = ['some arguments'];
        const error = new Error('Test SQL error');

        connectionMock.query.mockImplementation((_sql, _args, callback) => callback(error, null));

        const mySql = new MySQL({});
        expect(() => mySql.query(sql, args)).rejects.toThrow(error);
    });
});
