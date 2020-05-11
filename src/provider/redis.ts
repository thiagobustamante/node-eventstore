import { Redis } from 'ioredis';
import { Event } from '../model/event';
import { Stream } from '../model/stream';
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

    public async addEvent(stream: Stream, data: any) {
        const sequence = await this.redis.incr(`sequences:{${this.getKey(stream.aggregation, stream.id)}}`) - 1;
        const time = await this.redis.time();
        const commitTimestamp = parseInt(time, 10);
        const event: Event = {
            commitTimestamp: commitTimestamp,
            payload: data,
            sequence: sequence
        };
        await this.redis.multi()
            .rpush(this.getKey(stream.aggregation, stream.id), JSON.stringify(event))
            .zadd(`meta:aggregations:${stream.aggregation}`, '1', stream.id)
            .zadd('meta:aggregations', '1', stream.aggregation)
            .exec();
        return event;
    }

    public async getEvents(stream: Stream, offset = 0, limit = -1) {
        const history: Array<string> = await this.redis.lrange(this.getKey(stream.aggregation, stream.id), offset, limit);
        return history.map(data => JSON.parse(data));
    }

    public async getAggregations(offset = 0, limit = -1): Promise<Array<string>> {
        const aggregations: Array<string> = await this.redis.zrange('meta:aggregations', offset, limit);
        return aggregations;
    }

    public async getStreams(aggregation: string, offset = 0, limit = -1): Promise<Array<string>> {
        const streams: Array<string> = await this.redis.zrange(`meta:aggregations:${aggregation}`, offset, limit);
        return streams;
    }

    private getKey(aggregation: string, streamId: string): string {
        return `${aggregation}:${streamId}`;
    }
}
