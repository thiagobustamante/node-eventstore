import AWS = require('aws-sdk');
import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { SQSPublisher } from '../../../src/publisher/sqs';

chai.use(sinonChai);
const expect = chai.expect;

// tslint:disable:no-unused-expression
describe('EventStory Memory Publisher', () => {

    let awsConfigStub: sinon.SinonStub;
    let sqsStub: sinon.SinonStub;
    let promiseStub: sinon.SinonStubbedInstance<any>;
    let sendMessageStub: sinon.SinonStubbedInstance<any>;

    beforeEach(() => {
        promiseStub = sinon.stub();
        sendMessageStub = sinon.spy((data: any): any => {
            return {
                promise: promiseStub,
            };
        });

        awsConfigStub = sinon.stub(AWS, "config").returns({ update: (): any => null });
        sqsStub = sinon.stub(AWS, 'SQS').returns({
            sendMessage: sendMessageStub,
        });
    });

    afterEach(() => {
        awsConfigStub.restore();
        sqsStub.restore();
    });

    it('should send a message', async () => {
        promiseStub.resolves({
            MessageId: '12345'
        });
        const sqsPublisher = new SQSPublisher('http://local', { region: 'any region' });

        const messageBody = {
            event: {
                commitTimestamp: 1234567,
                payload: 'anything',
                sequence: 1,
            },
            stream: { aggregation: 'orders', id: '1' },
        };
        const published = await sqsPublisher.publish(messageBody);

        expect(published).to.have.been.true;
        expect(sendMessageStub).to.have.been.calledWithExactly({
            MessageAttributes: {
                aggregation: { DataType: "String", StringValue: "orders" },
                commitTimestamp: { DataType: "Number", StringValue: "1234567" },
                id: { DataType: "String", StringValue: "1" }
            },
            MessageBody: JSON.stringify(messageBody),
            MessageDeduplicationId: "orders:1:1234567",
            MessageGroupId: "orders",
            QueueUrl: "http://local"
        });
    });
});