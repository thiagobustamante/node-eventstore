'use strict';

import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Message } from '../../../src/model/message';

chai.use(sinonChai);
const expect = chai.expect;
// tslint:disable:no-unused-expression

describe('EventStory RabbitMQ Publisher', () => {
    let channelStub: sinon.SinonStubbedInstance<any>;
    let connectionStub: sinon.SinonStubbedInstance<any>;
    let amqpStub: sinon.SinonStubbedInstance<any>;
    let RabbitMQPublisher: any;
    beforeEach(() => {
        amqpStub = sinon.stub({ connect: (url: string) => null });
        connectionStub = sinon.stub({ createChannel: () => null });
        channelStub = sinon.stub({
            assertExchange: (exchange: string, type: string, options?: any) => null,
            assertQueue: (queue: string, options?: any) => null,
            bindQueue: (queue: string, source: string, pattern: string) => null,
            cancel: (consumerTag: string) => null,
            consume: (queue: string, onMessage: (msg: Message | null) => any) => null,
            deleteQueue: (queue: string) => null,
            publish: (exchange: string, routingKey: string, content: Buffer) => true
        });

        amqpStub.connect.returns(connectionStub);
        connectionStub.createChannel.returns(channelStub);
        RabbitMQPublisher = proxyquire('../../../src/publisher/rabbitmq', { amqplib: amqpStub }).RabbitMQPublisher;
    });

    it('should be able to publish events to rabbitmq', async () => {
        const rabbitmqPublisher: any = new RabbitMQPublisher("amqp://localhost");

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

        expect(amqpStub.connect).to.have.been.calledOnceWithExactly("amqp://localhost");
        expect(connectionStub.createChannel).to.have.been.calledOnce;
        expect(channelStub.assertExchange).to.have.been.calledOnceWithExactly(message.stream.aggregation, 'fanout', { durable: false });
        expect(channelStub.publish).to.have.been.calledTwice;
        expect(channelStub.publish).to.have.been.calledWithExactly(
            message.stream.aggregation, '', new Buffer(JSON.stringify(message)));
    });

    it('should be able to subscribe to listen changes in the eventstore', async () => {
        channelStub.assertQueue.returns({ queue: '123' });
        channelStub.consume.returns({ consumerTag: '321' });
        const rabbitmqPublisher: any = new RabbitMQPublisher("amqp://localhost");

        const subscription = await rabbitmqPublisher.subscribe('orders', () => {
            // 
        });
        await rabbitmqPublisher.subscribe('orders', () => {
            // 
        });

        await subscription.remove();

        expect(amqpStub.connect).to.have.been.calledOnceWithExactly("amqp://localhost");
        expect(connectionStub.createChannel).to.have.been.calledOnce;
        expect(channelStub.assertExchange).to.have.been.calledOnceWithExactly('orders', 'fanout', { durable: false });
        expect(channelStub.assertQueue).to.have.been.calledTwice;
        expect(channelStub.assertQueue).to.have.been.calledWithExactly('', { exclusive: true });
        expect(channelStub.bindQueue).to.have.been.calledTwice;
        expect(channelStub.bindQueue).to.have.been.calledWithExactly('123', 'orders', '');
        expect(channelStub.consume).to.have.been.calledTwice;
        expect(channelStub.cancel).to.have.been.calledWithExactly('321');
        expect(channelStub.deleteQueue).to.have.been.calledWithExactly('123');
    });

});
