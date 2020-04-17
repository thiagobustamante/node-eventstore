'use strict';

import { DynamoDB } from 'aws-sdk';
import AWS = require('aws-sdk');
import { DocumentClient, ItemList } from 'aws-sdk/clients/dynamodb';
import { AWSConfig } from '../aws/config';
import { Event } from '../model/event';
import { Stream } from '../model/stream';
import { PersistenceProvider } from './provider';


/**
 * A Persistence Provider that handle all the data in Dynamodb.
 */
export class DynamodbProvider implements PersistenceProvider {
    private documentClient: DocumentClient;
    private aggregationsLocalCache: Map<String, String>;

    constructor(awsConfig: AWSConfig) {
        AWS.config.update(awsConfig);

        this.documentClient = new DynamoDB.DocumentClient();
        this.aggregationsLocalCache = new Map();
    }

    public async addEvent(stream: Stream, data: any): Promise<Event> {
        this.addAggregation(stream);
        const commitTimestamp = Date.now();
        const event = {
            aggregation_streamid: `${this.getKey(stream)}`,
            commitTimestamp: commitTimestamp,
            payload: data,
            stream: stream
        };
        const record = {
            Item: event,
            TableName: 'events',
        };

        await this.documentClient.put(record).promise();

        return {
            commitTimestamp: commitTimestamp,
            payload: data,
        } as Event;
    }


    public async getEvents(stream: Stream, offset: number = 0, limit: number = -1): Promise<Array<Event>> {
        const filter = {
            ExpressionAttributeValues: { ':key': this.getKey(stream) },
            KeyConditionExpression: 'aggregation_streamid = :key',
            TableName: 'events',
        };

        const items: ItemList = (await this.documentClient.query(filter).promise()).Items;

        return items.map((data, index) => {
            return {
                commitTimestamp: data.commitTimestamp,
                payload: data.payload,
                sequence: index + 1,
            } as Event;
        });
    }

    public async getAggregations(offset: number = 0, limit: number = -1): Promise<Array<string>> {
        const filter = { TableName: 'aggregations', };

        const items = await this.documentClient.scan(filter).promise();
        return items.Items.map(data => data.aggregation);
    }

    public async getStreams(aggregation: string, offset: number = 0, limit: number = -1): Promise<Array<string>> {
        const params = {
            ConsistentRead: true,
            ExpressionAttributeValues: {
                ':aggregation': aggregation
            },
            KeyConditionExpression: 'aggregation = :aggregation',
            ScanIndexForward: false,
            TableName: 'aggregations',
        };

        const items = (await this.documentClient.query(params).promise()).Items;

        return items.map(data => data.stream);
    }

    private async addAggregation(stream: Stream) {
        if (!this.aggregationsLocalCache.has(stream.aggregation)) {
            const param = {
                Item: {
                    aggregation: stream.aggregation,
                    stream: stream.id
                },
                TableName: 'aggregations',
            };
            this.documentClient.put(param).promise()
            this.aggregationsLocalCache.set(stream.aggregation, stream.id);
        }
    }

    private getKey(stream: Stream): string {
        return `${stream.aggregation}:${stream.id}`;
    }
}
