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

    constructor(awsConfig: AWSConfig) {
        AWS.config.update(awsConfig);

        this.documentClient = new DynamoDB.DocumentClient();
    }

    public async addEvent(stream: Stream, data: any) {
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
        const params = {
            ConsistentRead: true,
            ExpressionAttributeValues: {
                ':a': this.getKey(stream)
            },
            KeyConditionExpression: 'aggregation_streamid = :a',
            ScanIndexForward: false,
            TableName: 'events',
        };

        const items: ItemList = (await this.documentClient.query(params).promise()).Items;

        return items.map(data => {
            return {
                commitTimestamp: data.commitTimestamp,
                payload: data.payload,
            } as Event;
        });
    }

    public async getAggregations(offset: number = 0, limit: number = -1): Promise<Array<string>> {
        const params = {
            TableName: 'aggregations',
        };

        const items = await (await this.documentClient.scan(params).promise());

        return items.Items.map(data => data.aggregation);
    }

    public async getStreams(aggregation: string, offset: number = 0, limit: number = -1): Promise<Array<string>> {
        const params = {
            ConsistentRead: true,
            ExpressionAttributeValues: {
                ':a': aggregation
            },
            KeyConditionExpression: 'aggregation = :a',
            ScanIndexForward: false,
            TableName: 'aggregations',
        };

        const items = await (await this.documentClient.query(params).promise()).Items;

        return items.map(data => data.stream);
    }

    private async addAggregation(stream: Stream) {
        const param = {
            Item: {
                aggregation: stream.aggregation,
                stream: stream.id
            },
            TableName: 'aggregations',
        };

        await this.documentClient.put(param).promise();
    }

    private getKey(stream: Stream): string {
        return `${stream.aggregation}:${stream.id}`;
    }
}
