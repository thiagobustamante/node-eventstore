'use strict';

import { Redis } from 'ioredis';
import { Event } from '../model/event';
import { RedisConfig } from '../redis/config';
import { RedisFactory } from '../redis/connect';
import { PersistenceProvider } from './provider';

/**
 * A Persistence Provider that handle all the data in redis.
 */
export class RedisProvider implements PersistenceProvider {
    private redis: Redis;

    constructor(config: RedisConfig) {
        this.redis = RedisFactory.createClient(config);
    }

    public async addEvent(aggregation: string, streamId: string, event: Event) {
        event.sequence = await this.redis.incr(`sequences:{${this.getKey(aggregation, streamId)}}`) - 1;
        const time = await this.redis.time()
        event.commitTimestamp = parseInt(time, 10);
        await this.redis.multi()
            .rpush(this.getKey(aggregation, streamId), JSON.stringify(event))
            .zadd(`meta:aggregations:${aggregation}`, '1', streamId)
            .zadd(`meta:aggregations`, '1', aggregation)
            .exec();
        return event;
    }

    public async getEvents(aggregation: string, streamId: string, offset: number = 0, limit: number = -1) {
        const history: Array<string> = await this.redis.lrange(this.getKey(aggregation, streamId), offset, limit);
        return history.map(data => JSON.parse(data));
    }

    public async getAggregations(offset: number = 0, limit: number = -1): Promise<Array<string>> {
        const aggregations: Array<string> = await this.redis.zrange('meta:aggregations', offset, limit);
        return aggregations;
    }

    public async getStreams(aggregation: string, offset: number = 0, limit: number = -1): Promise<Array<string>> {
        const streams: Array<string> = await this.redis.zrange(`meta:aggregations:${aggregation}`, offset, limit);
        return streams;
    }

    private getKey(aggregation: string, streamId: string): string {
        return `${aggregation}:${streamId}`;
    }
}
