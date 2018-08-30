'use strict';

import * as amqp from 'amqplib';
import { Message } from '../model/message';
import { HasSubscribers, Publisher, Subscriber, Subscription } from './publisher';

/**
 * A Publisher that use RabbitMQ to message communications.
 */
export class RabbitMQPublisher implements Publisher, HasSubscribers {
    private channel: amqp.Channel;
    private url: string;
    private exchanges: Set<string> = new Set();

    constructor(url: string) {
        this.url = url;
    }

    public async publish(message: Message) {
        const channel = await this.getChannel()
        this.ensureExchange(message.aggregation, channel);
        channel.publish(message.aggregation, '', new Buffer(JSON.stringify(message)));
    }

    public async subscribe(aggregation: string, subscriber: Subscriber): Promise<Subscription> {
        const channel = await this.getChannel()
        this.ensureExchange(aggregation, channel);

        const q = await channel.assertQueue('', { exclusive: true });
        channel.bindQueue(q.queue, aggregation, '');
        const response = await channel.consume(q.queue, (msg) => {
            subscriber(JSON.parse(msg.content.toString()));
        }, { noAck: true });
        const consumerTag = response.consumerTag;

        return {
            remove: async () => {
                channel.cancel(consumerTag);
                channel.deleteQueue(q.queue);
            }
        }
    }

    private ensureExchange(aggregation: string, channel: amqp.Channel) {
        if (!this.exchanges.has(aggregation)) {
            channel.assertExchange(aggregation, 'fanout', { durable: false });
            this.exchanges.add(aggregation);
        }
    }

    private async getChannel() {
        if (!this.channel) {
            const conn = await amqp.connect(this.url);
            this.channel = await conn.createChannel();
        }
        return this.channel;
    }
}
