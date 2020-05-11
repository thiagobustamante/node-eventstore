import * as _ from 'lodash';
import { Collection, MongoClient } from 'mongodb';
import { Event } from '../model/event';
import { Stream } from '../model/stream';
import { PersistenceProvider } from './provider';

/**
 * A Persistence Provider that handle all the data in mongodb.
 */
export class MongoProvider implements PersistenceProvider {
    private mongoURL: string;
    private eventCollection: Collection;
    private countersCollection: Collection;
    private mongoClient: MongoClient;

    constructor(url: string) {
        this.mongoURL = url;
    }

    public async addEvent(stream: Stream, data: any) {
        const events = await this.events();
        const sequence = await this.getNextSequenceValue(this.getKey(stream.aggregation, stream.id)) - 1;
        const commitTimestamp = new Date().getTime();
        const event: Event = {
            commitTimestamp: commitTimestamp,
            payload: data,
            sequence: sequence
        };

        const result = await events.insertOne(_.merge(event, { stream: stream }));
        if (!result.result.ok) {
            throw new Error('Error saving event into the store');
        }

        return event;
    }

    public async getEvents(stream: Stream, offset = 0, limit = 0) {
        const events = await this.events();
        const cursor = events.find({ 'stream.id': stream.id, 'stream.aggregation': stream.aggregation });
        if (offset > 0) {
            cursor.skip(offset);
        }
        if (limit > 0) {
            cursor.limit(limit);
        }

        return await cursor.toArray();
    }

    public async getAggregations(offset = 0, limit = 0): Promise<Array<string>> {
        const events = await this.events();
        const cursor = events.aggregate().group({ _id: '$stream.aggregation' });

        if (offset > 0) {
            cursor.skip(offset);
        }
        if (limit > 0) {
            cursor.limit(limit);
        }
        const aggregations: Array<string> = await cursor.toArray();
        return aggregations;
    }

    public async getStreams(aggregation: string, offset = 0, limit = 0): Promise<Array<string>> {
        const events = await this.events();
        const cursor = events.aggregate()
            .match({ 'stream.aggregation': aggregation })
            .group({ _id: '$stream.id' });

        if (offset > 0) {
            cursor.skip(offset);
        }
        if (limit > 0) {
            cursor.limit(limit);
        }
        const streams: Array<string> = await cursor.toArray();
        return streams;
    }

    private getKey(aggregation: string, streamId: string): string {
        return `${aggregation}:${streamId}`;
    }

    private async events() {
        if (!this.eventCollection) {
            const mongoClient = await this.getMongoClient();
            this.eventCollection = mongoClient.db().collection('events');
        }
        return this.eventCollection;
    }

    private async counters() {
        if (!this.countersCollection) {
            const mongoClient = await this.getMongoClient();
            this.countersCollection = mongoClient.db().collection('counters');
        }
        return this.countersCollection;
    }

    private async getMongoClient() {
        if (!this.mongoClient) {
            this.mongoClient = await MongoClient.connect(this.mongoURL, { useNewUrlParser: true });
        }
        return this.mongoClient;
    }

    private async getNextSequenceValue(sequenceName: string) {
        const counters = await this.counters();
        const result = await counters.findOneAndUpdate(
            { _id: sequenceName },
            // eslint-disable-next-line @typescript-eslint/camelcase
            { $inc: { sequence_value: 1 } },
            {
                returnOriginal: false,
                upsert: true
            });

        if (!result.ok) {
            throw new Error('Error reading next sequence value');
        }
        return result.value.sequence_value;
    }
}
