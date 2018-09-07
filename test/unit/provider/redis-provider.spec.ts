'use strict';

import * as chai from 'chai';
// import { Redis } from 'ioredis';
import * as _ from 'lodash';
import 'mocha';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { RedisFactory } from '../../../src/redis/connect';

chai.use(sinonChai);
const expect = chai.expect;
// tslint:disable:no-unused-expression

describe('EventStory Redis Provider', () => {
    let factoryStub: sinon.SinonStub;
    let redisStub: sinon.SinonStubbedInstance<any>;
    let RedisProvider: any;
    beforeEach(() => {
        redisStub = sinon.stub({
            incr: (key: string) => 1,
            lrange: (key: string, offset?: number, limit?: number) => []
        });
        factoryStub = sinon.stub(RedisFactory, 'createClient')
            .returns(redisStub);
        RedisProvider = proxyquire('../../../src/provider/redis', { './provider': factoryStub }).RedisProvider;
    });

    afterEach(() => {
        factoryStub.restore();
    });

    it('should be able to ask redis the events range', async () => {
        redisStub.lrange.returns(['{ "payload": "EVENT PAYLOAD"}']);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getEvents("orders", "1", 2, 5);
        expect(redisStub.lrange).to.have.been.calledOnceWithExactly(`orders:1`, 2, 5);
        expect(events.length).to.equal(1);
        expect(events[0].payload).to.equal('EVENT PAYLOAD');
    });

    it('should be able to ask redis the events', async () => {
        redisStub.lrange.returns(['{ "payload": "EVENT PAYLOAD"}']);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getEvents("orders", "1");
        expect(redisStub.lrange).to.have.been.calledOnceWithExactly(`orders:1`, 0, -1);
        expect(events.length).to.equal(1);
        expect(events[0].payload).to.equal('EVENT PAYLOAD');
    });

});
