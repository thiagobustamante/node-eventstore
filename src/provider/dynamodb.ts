'use strict';

import { DynamoDB } from 'aws-sdk';
import AWS = require('aws-sdk');
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Redis } from 'ioredis';
import * as _ from 'lodash';
import { Event } from '../model/event';
import { Stream } from '../model/stream';
import { PersistenceProvider } from './provider';


/**
 * A Persistence Provider that handle all the data in redis.
 */
export class DynamodbProvider implements PersistenceProvider {
    private redis: Redis;
    private documentClient: DocumentClient;

    constructor() {
        AWS.config.update({ region: 'us-east-1' });

        this.documentClient = new DynamoDB.DocumentClient();
    }

    // public async addEvent(stream: Stream, data: any) {
    //     const historyEvents = await this.getEvents(stream);
    //     console.log(`Before: ${JSON.stringify(historyEvents)}. Length: ${historyEvents.length}`);

    //     const commitTimestamp = Date.now();
    //     const sequence = historyEvents.length + 1;
    //     const event = {
    //         commitTimestamp: commitTimestamp,
    //         payload: data,
    //         sequence: sequence
    //     } as Event;

    //     const newevents: Array<Event> = [event];

    //     historyEvents.forEach(i => {
    //         newevents.push(i);
    //     });

    //     console.log(`After: ${JSON.stringify(newevents)}. Length: ${newevents.length}`);

    //     const item = {
    //         aggregation_streamid: `${this.getKey(stream)}`,
    //         events: newevents
    //     };
    //     const param = {
    //         Item: item,
    //         TableName: 'events',
    //     };

    //     await this.documentClient.put(param, (error, _) => {
    //         if (error) {
    //             throw new Error(error.message);
    //         }
    //     });

    //     return {
    //         commitTimestamp: commitTimestamp,
    //         payload: data,
    //         sequence: sequence
    //     } as Event;
    // }

    public async addEvent(stream: Stream, data: any) {
        const commitTimestamp = Date.now();
        const sequence = await this.getNextSequenceValue(this.getKey(stream));

        const item = {
            aggregation_streamid: `${this.getKey(stream)}`,
            events: {
                commitTimestamp: commitTimestamp,
                payload: data
            },
            sequence: sequence,
        };
        const param = {
            Item: item,
            TableName: 'events',
        };

        await this.documentClient.put(param, (error, _) => {
            if (error) {
                throw new Error(error.message);
            }
        });

        return {
            commitTimestamp: commitTimestamp,
            payload: data,
            sequence: sequence
        } as Event;
    }


    public async getEvents(stream: Stream, offset: number = 0, limit: number = -1): Promise<Array<Event>> {

        const params = {
            ConsistentRead: true,
            ExpressionAttributeValues: {
                ':a': this.getKey(stream)
            },
            KeyConditionExpression: 'aggregation_streamid = :a',
            TableName: 'events',
        };

        const events = await this.documentClient.query(params).promise().then(result =>
            result.Items.map(item => item.events));
        return events;
    }

    public async getAggregations(offset: number = 0, limit: number = -1): Promise<Array<string>> {
        const aggregations: Array<string> = await this.redis.zrange('meta:aggregations', offset, limit);
        return aggregations;
    }

    public async getStreams(aggregation: string, offset: number = 0, limit: number = -1): Promise<Array<string>> {
        const streams: Array<string> = await this.redis.zrange(`meta:aggregations:${aggregation}`, offset, limit);
        return streams;
    }

    private getKey(stream: Stream): string {
        return `${stream.aggregation}:${stream.id}`;
    }

    private async getNextSequenceValue(sequenceName: string) {
        // TODO FAZER UM getCounts que vai inicializar um Count para uma sequência.
        const attributes = await this.documentClient.update({
            'ExpressionAttributeNames': {
                '#v': 'currentValue'
            },
            'ExpressionAttributeValues': {
                ':a': 1
            },
            'Key': {
                'counterName': sequenceName
            },
            'ReturnValues': 'UPDATED_NEW',
            'TableName': 'counters',
            'UpdateExpression': 'SET #v = #v + :a',
        }).promise();

        return attributes.Attributes.currentValue;
    }
}
