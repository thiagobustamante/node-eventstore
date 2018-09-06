'use strict';

import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);
const expect = chai.expect;

describe('RedisFactory', () => {
    let redisStub: sinon.SinonStub;
    let RedisFactory: any;

    beforeEach(() => {
        redisStub = sinon.stub(require('ioredis'), 'constructor');
        RedisFactory = proxyquire('../../../src/redis/connect', { ioredis: redisStub }).RedisFactory;
    });

    afterEach(() => {
        redisStub.restore();
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

        expect(redisStub).to.have.been.calledOnceWithExactly(config.standalone.port,
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

        expect(redisStub).to.have.been.calledOnceWithExactly(6379, config.standalone.host, {});
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

        expect(() => RedisFactory.createClient(config)).to.throw();
    });

    it('should be able to create a client to connect to a redis using sentinel', async () => {
        const config = {
            options: {
                db: 6
            },
            sentinel: {
                name: "Test",
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

        expect(redisStub).to.have.been.calledOnceWithExactly(
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

        const clusterStub = sinon.stub(require('ioredis'), 'Cluster');
        RedisFactory = proxyquire('../../../src/redis/connect', { ioredis: clusterStub }).RedisFactory;
        RedisFactory.createClient(config);

        expect(clusterStub).to.have.been.calledOnceWithExactly(
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

        clusterStub.restore();
    });
});
