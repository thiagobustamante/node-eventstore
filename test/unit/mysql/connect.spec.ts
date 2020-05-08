jest.mock('mysql');

import * as _ from 'lodash';
import { MySQLFactory } from '../../../src/mysql/connect';
import * as MySQL from 'mysql';

const createPoolMock: jest.Mock = MySQL.createPool as any;
const createPoolClusterMock: jest.Mock = MySQL.createPoolCluster as any;
const poolClusterAddMock = jest.fn();
const poolClusterMock = {
    add: poolClusterAddMock
};
describe('MySQL Factory', () => {
    beforeAll(() => {
        createPoolClusterMock.mockReturnValue(poolClusterMock);
    });
    
    beforeEach(() => {
        poolClusterAddMock.mockClear();
        createPoolMock.mockClear();
    });

    it('should be able to create a connection pool for mysql', async () => {
        const mySQL = {
            config: {
                database: 'test-db',
                host: 'localhost',
                port: 13306
            }
        };
        const pool = { a:'pool' };
        createPoolMock.mockReturnValue(pool);

        const result = MySQLFactory.createPool(mySQL);

        expect(createPoolMock).toBeCalledWith(mySQL.config);
        expect(result).toEqual(pool);
    });

    it('should be able to validate mysql config params', async () => {
        const config = {
            config: {
                host: 'localhost',
                password: 'test',
                port: 6379
            },
            invalidOption: 'invalid'
        };

        expect(() => MySQLFactory.createPool(config)).toThrow();
    });

    it('should be able to create a pool to connect to a mySQL cluster', async () => {
        const mySQL = {
            cluster: {
                'master': {
                    database: 'test-db',
                    host: 'localhost',
                    port: 13306
                },
                'slave': {
                    database: 'test-db',
                    host: 'localhost',
                    port: 3307
                }
            }
        };

        const result = MySQLFactory.createPool(mySQL);

        expect(createPoolClusterMock).toBeCalledTimes(1);
        expect(poolClusterAddMock).toBeCalledTimes(2);
        expect(poolClusterAddMock).toBeCalledWith('master', mySQL.cluster.master);
        expect(poolClusterAddMock).toBeCalledWith('slave', mySQL.cluster.slave);
        expect(result).toEqual(poolClusterMock);
    });
});
