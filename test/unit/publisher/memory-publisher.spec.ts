'use strict';

import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { InMemoryPublisher, Message } from '../../../src';

chai.use(sinonChai);
const expect = chai.expect;

// tslint:disable:no-unused-expression
describe('EventStory Memory Publisher', () => {
    const EVENT_PAYLOAD = 'Event Data';
    let memoryPublisher: InMemoryPublisher;

    beforeEach(() => {
        memoryPublisher = new InMemoryPublisher();
    });

    it('should be able to publish messages to listeners', async () => {

        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: EVENT_PAYLOAD,
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };

        const subscriberStub = sinon.stub();
        await memoryPublisher.subscribe('orders', subscriberStub);
        const status = await memoryPublisher.publish(message);

        expect(subscriberStub).to.have.been.calledOnceWithExactly(message);
        expect(status).to.be.true;
    });

    it('should be able to notify multiple listeners', async () => {
        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: EVENT_PAYLOAD,
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };

        const subscriberStub = sinon.stub();
        const subscriber2Stub = sinon.stub();
        await memoryPublisher.subscribe('orders', subscriberStub);
        await memoryPublisher.subscribe('orders', subscriber2Stub);
        const status = await memoryPublisher.publish(message);

        expect(subscriberStub).to.have.been.calledOnceWithExactly(message);
        expect(subscriber2Stub).to.have.been.calledOnceWithExactly(message);
        expect(status).to.be.true;
    });

    it('should be able to check if a message was published', async () => {
        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: EVENT_PAYLOAD,
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };

        const status = await memoryPublisher.publish(message);

        expect(status).to.be.false;
    });
});
