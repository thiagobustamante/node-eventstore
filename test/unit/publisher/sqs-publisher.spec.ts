jest.mock('aws-sdk');
jest.mock('sqs-consumer');

import { config, SQS } from 'aws-sdk';
const { Consumer } = require('sqs-consumer');
import { SQSPublisher } from '../../../src/publisher/sqs';

const configUpdateMock: jest.Mock = config.update as any;
const consumerCreateMock = Consumer.create as jest.Mock;
const sqsStub: jest.Mock = SQS as any;
const promiseStub = jest.fn();
const sendMessageStub = jest.fn();
const startConsumerStub = {
    start: promiseStub
};

describe('EventStory SQS Publisher', () => {

    beforeAll(() => {
        sendMessageStub.mockReturnValue({
            promise: promiseStub
        });

        sqsStub.mockReturnValue({
            sendMessage: sendMessageStub,
        });

        consumerCreateMock.mockReturnValue(startConsumerStub);
    });

    beforeEach(() => {
        configUpdateMock.mockClear();
        sqsStub.mockClear();
        consumerCreateMock.mockClear();
        promiseStub.mockClear();
        sendMessageStub.mockClear();

    });

    it('should be able to publish events to sqs', async () => {
        promiseStub.mockResolvedValue({
            MessageId: '12345'
        });
        const config = { aws: { region: 'any region' } };
        const sqsPublisher = new SQSPublisher('http://local', config);

        const messageBody = {
            event: {
                commitTimestamp: 1234567,
                payload: 'anything',
                sequence: 1,
            },
            stream: { aggregation: 'orders', id: '1' },
        };
        const published = await sqsPublisher.publish(messageBody);

        expect(configUpdateMock).toBeCalledWith(config.aws);
        expect(published).toBeTruthy();
        expect(sendMessageStub).toBeCalledWith({
            MessageAttributes: {
                aggregation: { DataType: 'String', StringValue: 'orders' },
                commitTimestamp: { DataType: 'Number', StringValue: '1234567' },
                id: { DataType: 'String', StringValue: '1' }
            },
            MessageBody: JSON.stringify(messageBody),
            QueueUrl: 'http://local'
        });
    });

    it('should be able to subscribe to listen changes in the eventstore', async () => {
        const sqsPublisher = new SQSPublisher('http://local', { aws: { region: 'any region' } });

        const subscriberOrdersStub = jest.fn();
        const consumer = await sqsPublisher.subscribe('orders', subscriberOrdersStub);

        const consumerExpected = {
            handleMessage: subscriberOrdersStub,
            queueUrl: 'http://local',
        };
        expect(consumerCreateMock).toBeCalledTimes(1);
        expect(consumerCreateMock).toBeCalledWith(consumerExpected);
        expect(startConsumerStub.start).toBeCalledTimes(1);
        expect(consumer).toEqual(startConsumerStub);
    });
});