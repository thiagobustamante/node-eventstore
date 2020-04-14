'use strict';

import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
chai.use(sinonChai);
import AWS = require('aws-sdk');
import { DynamoDB } from 'aws-sdk';
import { DynamodbProvider } from '../../../src/provider/dynamodb';

const expect = chai.expect;

// tslint:disable:no-unused-expression
describe('EventStory Dynamodb Provider', () => {


    let putStub: sinon.SinonStubbedInstance<any>;
    // let queryStub: sinon.SinonStubbedInstance<any>;

    let clock: sinon.SinonFakeTimers;
    const now = new Date();

    beforeEach(() => {

        clock = sinon.useFakeTimers(now.getTime());


        putStub = sinon.spy((data: any): any => {
            return {
                promise: (): any => ({})
            };
        });

        sinon.stub(AWS, "config").returns({ update: (): any => null });
        sinon.stub(DynamoDB, 'DocumentClient').returns({
            put: putStub,
            query: (): any => null,
            scan: (): any => null,
        });
    });

    afterEach(() => {
        clock.restore();
    });

    it('should be able to add an Event to the Event Stream', async () => {
        const dynamodbProvider: any = new DynamodbProvider({ region: 'any region' });
        await dynamodbProvider.addEvent({ aggregation: 'orders', id: '1' }, 'EVENT PAYLOAD');

        expect(putStub).to.have.been.calledTwice;

        expect(putStub.getCall(0)).to.have.been.calledWithExactly({ Item: { aggregation: "orders", stream: "1" }, TableName: "aggregations" });
        expect(putStub.getCall(1)).to.have.been.calledWithExactly(
            {
                Item: {
                    aggregation_streamid: "orders:1",
                    commitTimestamp: now.getTime(),
                    payload: "EVENT PAYLOAD",
                    stream: { aggregation: "orders", id: "1" }
                },
                TableName: "events"
            }
        );
    });

    // it('should be able to ask mongo the streams', async () => {

    // });



});
