'use strict';

import * as chai from 'chai';
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
            exec: () => this,
            incr: (key: string) => 1,
            lrange: (key: string, offset?: number, limit?: number) => [],
            multi: () => this,
            rpush: (key: string, value: string) => this,
            time: () => this,
            zadd: (key: string, weight: string, value: string) => this,
            zrange: (key: string, offset?: number, limit?: number) => []
        });
        factoryStub = sinon.stub(RedisFactory, 'createClient').returns(redisStub as any);
        RedisProvider = proxyquire('../../../src/provider/redis', { '../redis/connect': factoryStub }).RedisProvider;
    });

    afterEach(() => {
        factoryStub.restore();
    });

    it('should be able to ask redis the events range', async () => {
        redisStub.lrange.returns(['{ "payload": "EVENT PAYLOAD"}']);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getEvents({ aggregation: "orders", id: "1" }, 2, 5);
        expect(redisStub.lrange).to.have.been.calledOnceWithExactly(`orders:1`, 2, 5);
        expect(events.length).to.equal(1);
        expect(events[0].payload).to.equal('EVENT PAYLOAD');
    });

    it('should be able to ask redis the events', async () => {
        redisStub.lrange.returns(['{ "payload": "EVENT PAYLOAD"}']);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getEvents({ aggregation: "orders", id: "1" });
        expect(redisStub.lrange).to.have.been.calledOnceWithExactly(`orders:1`, 0, -1);
        expect(events.length).to.equal(1);
        expect(events[0].payload).to.equal('EVENT PAYLOAD');
    });

    it('should be able to ask redis the aggregations range', async () => {
        redisStub.zrange.returns(['orders']);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getAggregations(2, 5);
        expect(redisStub.zrange).to.have.been.calledOnceWithExactly('meta:aggregations', 2, 5);
        expect(events.length).to.equal(1);
        expect(events[0]).to.equal('orders');
    });

    it('should be able to ask redis the aggregations', async () => {
        redisStub.zrange.returns(['orders', 'offers', 'checkout', 'customers']);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getAggregations();
        expect(redisStub.zrange).to.have.been.calledOnceWithExactly('meta:aggregations', 0, -1);
        expect(events.length).to.equal(4);
        expect(events[0]).to.equal('orders');
    });

    it('should be able to ask redis the streams range', async () => {
        redisStub.zrange.returns(['1']);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getStreams('orders', 2, 5);
        expect(redisStub.zrange).to.have.been.calledOnceWithExactly('meta:aggregations:orders', 2, 5);
        expect(events.length).to.equal(1);
        expect(events[0]).to.equal('1');
    });

    it('should be able to ask redis the streams', async () => {
        redisStub.zrange.returns(['1', '2', '3', '4']);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const events = await redisProvider.getStreams('orders');
        expect(redisStub.zrange).to.have.been.calledOnceWithExactly('meta:aggregations:orders', 0, -1);
        expect(events.length).to.equal(4);
        expect(events[0]).to.equal('1');
    });

    it('should be able to add an Event to the Event Stream', async () => {
        redisStub.incr.returns(1);
        redisStub.time.returns(1);
        redisStub.multi.returns(redisStub);
        redisStub.rpush.returns(redisStub);
        redisStub.zadd.returns(redisStub);

        const redisProvider: any = new RedisProvider({ standalone: { host: 'localhost' } });
        const event = await redisProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
        expect(redisStub.incr).to.have.been.calledOnceWithExactly('sequences:{orders:1}');
        expect(redisStub.time).to.have.been.calledOnce;
        expect(redisStub.multi).to.have.been.calledOnce;
        expect(redisStub.rpush).to.have.been.calledOnceWithExactly('orders:1', '{"commitTimestamp":1,"payload":"EVENT PAYLOAD","sequence":0}');
        expect(redisStub.zadd).to.have.been.calledTwice;
        expect(redisStub.zadd).to.calledWithExactly(`meta:aggregations`, '1', 'orders');
        expect(redisStub.zadd).to.calledWithExactly(`meta:aggregations:orders`, '1', '1');
        expect(redisStub.exec).to.have.been.calledOnce;
        expect(event.sequence).to.equal(0);
        expect(event.commitTimestamp).to.equal(1);
    });
});
