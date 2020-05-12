jest.mock('amqplib');

import { Message } from '../../../src/model/message';
import { RabbitMQPublisher } from '../../../src/publisher/rabbitmq';
import * as amqp from 'amqplib';

const amqpConnectMock = amqp.connect as jest.Mock;
const channelMock = {
    assertExchange: jest.fn(),
    assertQueue: jest.fn(),
    bindQueue: jest.fn(),
    cancel: jest.fn(),
    consume: jest.fn(),
    deleteQueue: jest.fn(),
    publish: jest.fn()
};
const connectionMock = {
    createChannel: jest.fn()
};

describe('EventStory RabbitMQ Publisher', () => {
    beforeAll(() => {
        amqpConnectMock.mockResolvedValue(connectionMock);
        connectionMock.createChannel.mockResolvedValue(channelMock);
    });

    beforeEach(() => {
        amqpConnectMock.mockClear();
        channelMock.assertExchange.mockClear();
        channelMock.assertQueue.mockClear();
        channelMock.bindQueue.mockClear();
        channelMock.cancel.mockClear();
        channelMock.consume.mockClear();
        channelMock.deleteQueue.mockClear();
        channelMock.publish.mockClear();
        connectionMock.createChannel.mockClear();
    });

    it('should be able to publish events to rabbitmq', async () => {
        const rabbitmqPublisher: any = new RabbitMQPublisher('amqp://localhost');

        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: 'PAYLOAD',
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };
        await rabbitmqPublisher.publish(message);
        await rabbitmqPublisher.publish(message);

        expect(amqpConnectMock).toBeCalledWith('amqp://localhost');
        expect(connectionMock.createChannel).toBeCalledTimes(1);
        expect(channelMock.assertExchange).toBeCalledTimes(1);
        expect(channelMock.assertExchange).toBeCalledWith(message.stream.aggregation, 'fanout', { durable: false });
        expect(channelMock.publish).toBeCalledTimes(2);
        expect(channelMock.publish).toBeCalledWith(
            message.stream.aggregation, '', Buffer.from(JSON.stringify(message)));
    });

    it('should be able to subscribe to listen changes in the eventstore', async () => {
        channelMock.assertQueue.mockResolvedValue({ queue: '123' });
        channelMock.consume.mockImplementation((queue, callback) => {
            callback({ content: Buffer.from(JSON.stringify({ payload: 'MESSAGE_CONTENT' })) });
            return { consumerTag: '321' };
        });
        const rabbitmqPublisher: any = new RabbitMQPublisher('amqp://localhost');
        const subscriber = jest.fn();
        const subscription = await rabbitmqPublisher.subscribe('orders', subscriber);
        await rabbitmqPublisher.subscribe('orders', jest.fn());

        await subscription.remove();

        expect(amqpConnectMock).toBeCalledTimes(1);
        expect(amqpConnectMock).toBeCalledWith('amqp://localhost');
        expect(connectionMock.createChannel).toBeCalledTimes(1);
        expect(channelMock.assertExchange).toBeCalledTimes(1);
        expect(channelMock.assertExchange).toBeCalledWith('orders', 'fanout', { durable: false });
        expect(channelMock.assertQueue).toBeCalledTimes(2);
        expect(channelMock.assertQueue).toBeCalledWith('', { exclusive: true });
        expect(channelMock.bindQueue).toBeCalledTimes(2);
        expect(channelMock.bindQueue).toBeCalledWith('123', 'orders', '');
        expect(channelMock.consume).toBeCalledTimes(2);
        expect(channelMock.consume).toBeCalledWith('123', expect.anything(), { noAck: true });
        expect(channelMock.cancel).toBeCalledWith('321');
        expect(channelMock.deleteQueue).toBeCalledWith('123');
        expect(subscriber).toBeCalledWith({ payload: 'MESSAGE_CONTENT' });
    });
});
