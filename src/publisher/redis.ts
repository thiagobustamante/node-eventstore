'use strict';

import { Redis } from 'ioredis';
import { Message } from '../model/message';
import { RedisConfig } from '../redis/config';
import { RedisFactory } from '../redis/connect';
import { HasSubscribers, Publisher, Subscriber, Subscription } from './publisher';


/**
 * A Publisher that use Redis pub / sub feature to message communications.
 */
export class RedisPublisher implements Publisher, HasSubscribers {
    private redisSubscriber: Redis;
    private redisPublisher: Redis;
    private listeners: Map<string, Array<Subscriber>> = new Map();
    private listenningRedis: boolean = false;

    constructor(config: RedisConfig) {
        this.redisSubscriber = RedisFactory.createClient(config);
        this.redisPublisher = RedisFactory.createClient(config);
    }

    public async publish(message: Message) {
        await this.redisPublisher.publish(message.aggregation, JSON.stringify(message));
    }

    public async subscribe(aggregation: string, subscriber: Subscriber): Promise<Subscription> {
        let subscribers = this.listeners.get(aggregation);
        if (!subscribers) {
            subscribers = new Array<Subscriber>();
            this.listeners.set(aggregation, subscribers);
        }
        subscribers.push(subscriber);
        await this.redisSubscriber.subscribe(aggregation);
        await this.registerRedisListener();

        return {
            remove: async () => {
                this.redisSubscriber.unsubscribe(aggregation);
                const index = subscribers.indexOf(subscriber);
                subscribers.splice(index, 1);
            }
        }
    }

    private async registerRedisListener() {
        if (!this.listenningRedis) {
            this.listenningRedis = true;
            await this.redisSubscriber.on('message', (aggregation, received) => {
                const message: Message = JSON.parse(received);
                const subscribers = this.listeners.get(aggregation);
                if (subscribers) {
                    subscribers.forEach(subscriber => subscriber(message));
                }
            });
        }
    }
}
