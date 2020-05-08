jest.mock('ioredis');

import * as _ from 'lodash';
import * as Redis from 'ioredis';
import { RedisFactory } from '../../../src/redis/connect';

const redisMock: jest.Mock = Redis as any;
const redisClusterMock: jest.Mock = Redis.Cluster as any;
describe('RedisFactory', () => {

    beforeEach(() => {
        redisMock.mockClear();
        redisClusterMock.mockClear();
    });

    it('should be able to create a client to connect to a standalone redis', async () => {
        const config = {
            options: {
                db: 6
            },
            standalone: {
                host: 'localhost',
                password: 'test',
                port: 6379
            }
        };

        RedisFactory.createClient(config);

        expect(redisMock).toBeCalledTimes(1);
        expect(redisMock).toBeCalledWith(config.standalone.port,
            config.standalone.host,
            _.merge(config.options, { password: config.standalone.password }));
    });

    it('should be able to create a client to connect to a standalone redis, using default configurations', async () => {
        const config = {
            standalone: {
                host: 'localhost'
            }
        };

        RedisFactory.createClient(config);

        expect(redisMock).toBeCalledTimes(1);
        expect(redisMock).toBeCalledWith(6379, config.standalone.host, {});
    });

    it('should be able to validate redis config params', async () => {
        const config = {
            options: {
                db: 6
            },
            standalone: {
                host: 'localhost',
                invalidOption: 'invalid',
                password: 'test',
                port: 6379
            }
        };

        expect(() => RedisFactory.createClient(config)).toThrow();
    });

    it('should be able to create a client to connect to a redis using sentinel', async () => {
        const config = {
            options: {
                db: 6
            },
            sentinel: {
                name: 'Test',
                nodes: [
                    {
                        host: 'localhost',
                        password: 'test',
                        port: '6379'
                    }
                ]
            }
        };

        RedisFactory.createClient(config);

        expect(redisMock).toBeCalledTimes(1);
        expect(redisMock).toBeCalledWith(
            _.merge(config.options, {
                name: config.sentinel.name,
                sentinels: [
                    {
                        host: 'localhost',
                        password: 'test',
                        port: 6379
                    }
                ]
            }));
    });

    it('should be able to create a client to connect to a redis cluster', async () => {
        const config = {
            cluster: [
                {
                    host: 'localhost',
                    password: 'test',
                    port: '6379'
                }
            ],
            options: {
                db: 6
            }
        };

        RedisFactory.createClient(config);

        expect(redisClusterMock).toBeCalledTimes(1);
        expect(redisClusterMock).toBeCalledWith(
            [
                {
                    host: 'localhost',
                    password: 'test',
                    port: 6379
                }
            ]
            , {
                redisOptions: config.options,
                scaleReads: 'all'
            });
    });
});
