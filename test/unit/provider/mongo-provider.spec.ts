'use strict';

import { fail } from 'assert';
import * as chai from 'chai';
import 'mocha';
import { MongoClient } from 'mongodb';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
chai.use(sinonChai);
const expect = chai.expect;
// tslint:disable:no-unused-expression

describe('EventStory Mongo Provider', () => {
    let mongoClientStub: sinon.SinonStub;
    let dbStub: sinon.SinonStubbedInstance<any>;
    let collectionStub: sinon.SinonStubbedInstance<any>;
    let aggregationCursorStub: sinon.SinonStubbedInstance<any>;
    let cursorStub: sinon.SinonStubbedInstance<any>;
    let mongoStub: sinon.SinonStubbedInstance<any>;
    let MongoProvider: any;

    beforeEach(() => {
        aggregationCursorStub = sinon.stub({
            group: (data: any) => null,
            limit: (count: number) => null,
            match: (data: any) => null,
            skip: (offset: number) => null,
            toArray: () => null
        });
        cursorStub = sinon.stub({
            limit: (count: number) => null,
            skip: (offset: number) => null,
            toArray: () => null
        });
        collectionStub = sinon.stub({
            aggregate: () => null,
            find: (query: any) => null,
            findOneAndUpdate: (filter: any, update: any, options?: any) => null,
            insertOne: (doc: any) => null
        });
        dbStub = sinon.stub({ collection: () => null });
        mongoStub = sinon.stub({ db: () => null });

        aggregationCursorStub.match.returns(aggregationCursorStub);
        aggregationCursorStub.group.returns(aggregationCursorStub);
        aggregationCursorStub.skip.returns(aggregationCursorStub);
        aggregationCursorStub.limit.returns(aggregationCursorStub);
        collectionStub.aggregate.returns(aggregationCursorStub);
        cursorStub.skip.returns(cursorStub);
        cursorStub.limit.returns(cursorStub);
        collectionStub.find.returns(cursorStub);
        dbStub.collection.returns(collectionStub);
        mongoStub.db.returns(dbStub);
        mongoClientStub = sinon.stub(MongoClient, 'connect').resolves(mongoStub);
        MongoProvider = proxyquire('../../../src/provider/mongo', { 'mongo': mongoClientStub }).MongoProvider;
    });

    afterEach(() => {
        mongoClientStub.restore();
    });

    it('should be able to ask mongo the events range', async () => {
        cursorStub.toArray.returns(Promise.resolve([{ payload: 'EVENT PAYLOAD' }]));

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getEvents({ aggregation: "orders", id: "1" }, 2, 5);
        expect(mongoStub.db).to.have.been.calledOnce;
        expect(dbStub.collection).to.have.been.calledOnceWithExactly('events');
        expect(collectionStub.find).to.have.been.calledWithExactly({ 'stream.id': '1', 'stream.aggregation': 'orders' });
        expect(cursorStub.skip).to.have.been.calledWithExactly(2);
        expect(cursorStub.limit).to.have.been.calledWithExactly(5);
        expect(events[0].payload).to.equal('EVENT PAYLOAD');
    });

    it('should be able to ask mongo the events', async () => {
        cursorStub.toArray.returns(Promise.resolve([{ payload: 'EVENT PAYLOAD' }]));

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getEvents({ aggregation: "orders", id: "1" });
        expect(mongoStub.db).to.have.been.calledOnce;
        expect(dbStub.collection).to.have.been.calledOnceWithExactly('events');
        expect(collectionStub.find).to.have.been.calledWithExactly({ 'stream.id': '1', 'stream.aggregation': 'orders' });
        expect(cursorStub.skip).to.not.have.been.called;
        expect(cursorStub.limit).to.not.have.been.called;
        expect(events[0].payload).to.equal('EVENT PAYLOAD');
    });

    it('should be able to ask mongo the aggregations range', async () => {
        aggregationCursorStub.toArray.returns(['orders']);

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getAggregations(2, 5);

        expect(mongoStub.db).to.have.been.calledOnce;
        expect(dbStub.collection).to.have.been.calledOnceWithExactly('events');
        expect(collectionStub.aggregate).to.have.been.called;
        expect(aggregationCursorStub.group).to.have.been.calledWithExactly({ _id: '$stream.aggregation' });
        expect(aggregationCursorStub.skip).to.have.been.calledWithExactly(2);
        expect(aggregationCursorStub.limit).to.have.been.calledWithExactly(5);
        expect(events.length).to.equal(1);
        expect(events[0]).to.equal('orders');
    });

    it('should be able to ask mongo the aggregations', async () => {
        aggregationCursorStub.toArray.returns(['orders', 'offers', 'checkout', 'customers']);

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getAggregations();

        expect(mongoStub.db).to.have.been.calledOnce;
        expect(dbStub.collection).to.have.been.calledOnceWithExactly('events');
        expect(collectionStub.aggregate).to.have.been.called;
        expect(aggregationCursorStub.group).to.have.been.calledWithExactly({ _id: '$stream.aggregation' });
        expect(aggregationCursorStub.skip).to.not.have.been.called;
        expect(aggregationCursorStub.limit).to.not.have.been.called;
        expect(events.length).to.equal(4);
        expect(events[0]).to.equal('orders');
    });

    it('should be able to ask mongo the streams range', async () => {
        aggregationCursorStub.toArray.returns(['1']);

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getStreams('orders', 2, 5);

        expect(mongoStub.db).to.have.been.calledOnce;
        expect(dbStub.collection).to.have.been.calledOnceWithExactly('events');
        expect(collectionStub.aggregate).to.have.been.called;
        expect(aggregationCursorStub.match).to.have.been.calledWithExactly({ 'stream.aggregation': 'orders' });
        expect(aggregationCursorStub.group).to.have.been.calledWithExactly({ _id: '$stream.id' });
        expect(aggregationCursorStub.skip).to.have.been.calledWithExactly(2);
        expect(aggregationCursorStub.limit).to.have.been.calledWithExactly(5);
        expect(events.length).to.equal(1);
        expect(events[0]).to.equal('1');
    });

    it('should be able to ask mongo the streams', async () => {
        aggregationCursorStub.toArray.returns(['1', '2', '3', '4']);

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        const events = await mongoProvider.getStreams('orders');

        expect(mongoStub.db).to.have.been.calledOnce;
        expect(dbStub.collection).to.have.been.calledOnceWithExactly('events');
        expect(collectionStub.aggregate).to.have.been.called;
        expect(aggregationCursorStub.match).to.have.been.calledWithExactly({ 'stream.aggregation': 'orders' });
        expect(aggregationCursorStub.group).to.have.been.calledWithExactly({ _id: '$stream.id' });
        expect(aggregationCursorStub.skip).to.not.have.been.called;
        expect(aggregationCursorStub.limit).to.not.have.been.called;
        expect(events.length).to.equal(4);
        expect(events[0]).to.equal('1');
    });

    it('should be able to add an Event to the Event Stream', async () => {
        collectionStub.findOneAndUpdate.returns({ value: { sequence_value: 1 }, ok: true });
        collectionStub.insertOne.returns(Promise.resolve({ result: { ok: true } }));

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        const event = await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');

        expect(mongoClientStub).to.have.been.calledOnce;
        expect(mongoStub.db).to.have.been.calledTwice;
        expect(dbStub.collection).to.have.been.calledTwice;
        expect(dbStub.collection).to.have.been.calledWithExactly('events');
        expect(dbStub.collection).to.have.been.calledWithExactly('counters');
        expect(collectionStub.findOneAndUpdate).to.have.been.calledWithExactly(
            { _id: `orders:1` },
            { $inc: { sequence_value: 1 } },
            {
                returnOriginal: false,
                upsert: true
            });
        expect(collectionStub.insertOne).to.have.been.calledWithMatch(
            sinon.match({
                commitTimestamp: sinon.match.number,
                payload: 'EVENT PAYLOAD',
                sequence: 0,
                stream: sinon.match({ aggregation: 'orders', id: '1' })
            }));
        expect(event.sequence).to.equal(0);
        // expect(event.commitTimestamp).to.equal(1);
    });

    it('should be able to handle errors in sequence reading', async () => {
        collectionStub.findOneAndUpdate.returns({ value: {}, ok: false });

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        try {
            await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
            fail('An Error was expected');
        } catch (e) {
            expect(e.message).to.be.equal('Error reading next sequence value');
        }

        expect(mongoStub.db).to.have.been.calledTwice;
        expect(dbStub.collection).to.have.been.calledTwice;
        expect(dbStub.collection).to.have.been.calledWithExactly('events');
        expect(dbStub.collection).to.have.been.calledWithExactly('counters');
        expect(collectionStub.findOneAndUpdate).to.have.been.calledWithExactly(
            { _id: `orders:1` },
            { $inc: { sequence_value: 1 } },
            {
                returnOriginal: false,
                upsert: true
            });
    });

    it('should be able to handle errors in object writing', async () => {
        collectionStub.findOneAndUpdate.returns({ value: { sequence_value: 1 }, ok: true });
        collectionStub.insertOne.returns(Promise.resolve({ result: { ok: false } }));

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        try {
            await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
            fail('An Error was expected');
        } catch (e) {
            expect(e.message).to.be.equal('Error saving event into the store');
        }

        expect(mongoStub.db).to.have.been.calledTwice;
        expect(dbStub.collection).to.have.been.calledTwice;
        expect(dbStub.collection).to.have.been.calledWithExactly('events');
        expect(dbStub.collection).to.have.been.calledWithExactly('counters');
        expect(collectionStub.findOneAndUpdate).to.have.been.calledWithExactly(
            { _id: `orders:1` },
            { $inc: { sequence_value: 1 } },
            {
                returnOriginal: false,
                upsert: true
            });
        expect(collectionStub.insertOne).to.have.been.calledWithMatch(
            sinon.match({
                commitTimestamp: sinon.match.number,
                payload: 'EVENT PAYLOAD',
                sequence: 0,
                stream: sinon.match({ aggregation: 'orders', id: '1' })
            }));
        // expect(event.commitTimestamp).to.equal(1);
    });

    it('should only initiate collections once', async () => {
        collectionStub.findOneAndUpdate.returns({ value: { sequence_value: 1 }, ok: true });
        collectionStub.insertOne.returns(Promise.resolve({ result: { ok: true } }));

        const mongoProvider: any = new MongoProvider('mongodb://localhost:27017/eventstore');
        await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');
        await mongoProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD_2');

        expect(mongoClientStub).to.have.been.calledOnce;
        expect(mongoStub.db).to.have.been.calledTwice;
        expect(dbStub.collection).to.have.been.calledTwice;
        expect(dbStub.collection).to.have.been.calledWithExactly('events');
        expect(dbStub.collection).to.have.been.calledWithExactly('counters');
    });

});
