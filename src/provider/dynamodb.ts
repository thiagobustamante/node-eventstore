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
    private dynamoDB: DynamoDB;
    private initialized = false;

    constructor(awsConfig: AWSConfig) {
        AWS.config.update(awsConfig);

        this.documentClient = new DynamoDB.DocumentClient();
        this.dynamoDB = new AWS.DynamoDB();
    }

    public async addEvent(stream: Stream, data: any) {
        await this.ensureTables();

        this.addAggregation(stream);
        const commitTimestamp = Date.now();
        const item = {
            aggregation_streamid: `${this.getKey(stream)}`,
            commitTimestamp: commitTimestamp,
            payload: data,
            stream: stream
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
        } as Event;
    }


    public async getEvents(stream: Stream, offset: number = 0, limit: number = -1): Promise<Array<Event>> {
        await this.ensureTables();
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
        await this.ensureTables();
        const params = {
            TableName: 'aggregations',
        };

        const items = await (await this.documentClient.scan(params).promise());

        return items.Items.map(data => data.aggregation);
    }

    public async getStreams(aggregation: string, offset: number = 0, limit: number = -1): Promise<Array<string>> {
        await this.ensureTables();
        const params = {
            Key: {
                'aggregation': aggregation
            },
            TableName: 'aggregations',
        };

        const items = await (await this.documentClient.scan(params).promise()).Items;

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

        await this.documentClient.put(param, (error, _) => {
            if (error) {
                throw new Error(error.message);
            }
        });
    }

    private getKey(stream: Stream): string {
        return `${stream.aggregation}:${stream.id}`;
    }

    private async ensureTables() {
        if (!this.initialized) {
            await this.createTables();
            this.initialized = true;
        }
    }

    private async createTables() {
        await this.dynamoDB.createTable(this.eventsScheme()).promise().catch(error => { this.initialized = true; });

        await this.dynamoDB.createTable(this.aggregationsScheme()).promise().catch(error => { this.initialized = true; });
    }

    private eventsScheme = () => {
        return {
            AttributeDefinitions: [
                {
                    AttributeName: "aggregation_streamid",
                    AttributeType: "S"
                },
                {
                    AttributeName: "commitTimestamp",
                    AttributeType: "N"
                }
            ],
            KeySchema: [
                {
                    AttributeName: "aggregation_streamid",
                    KeyType: "HASH",
                },
                {
                    AttributeName: "commitTimestamp",
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            TableName: "events",
        };
    }

    private aggregationsScheme = () => {
        return {
            AttributeDefinitions: [
                {
                    AttributeName: "aggregation",
                    AttributeType: "S"
                },
                {
                    AttributeName: "stream",
                    AttributeType: "S"
                }
            ],
            KeySchema: [
                {
                    AttributeName: "aggregation",
                    KeyType: "HASH",
                },
                {
                    AttributeName: "stream",
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            TableName: "aggregations",
        };
    }
}
