'use strict';

import { Redis } from 'ioredis';
import { Event } from '../model/event';
import { RedisConfig } from '../redis/config';
import { initializeRedis } from '../redis/connect';
import { Provider } from './provider';

/**
 * A Persistence Provider that handle all the data in redis.
 */
export class RedisProvider implements Provider {
    private redis: Redis;

    constructor(config: RedisConfig) {
        this.redis = initializeRedis(config);
    }

    public async addEvent(aggregation: string, streamId: string, event: Event) {
        event.sequence = await this.redis.incr(`sequences:{${this.getKey(aggregation, streamId)}}`) - 1;
        const time = await this.redis.time()
        event.commitTimestamp = parseInt(time, 10);
        await this.redis.rpush(this.getKey(aggregation, streamId), JSON.stringify(event));
        return event;
    }

    public async getEvents(aggregation: string, streamId: string) {
        const history: Array<string> = await this.redis.lrange(this.getKey(aggregation, streamId), 0, -1);
        return history.map(data => JSON.parse(data));
    }

    private getKey(aggregation: string, streamId: string): string {
        return `${aggregation}:${streamId}`;
    }
}
