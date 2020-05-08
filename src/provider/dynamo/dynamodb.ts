import { DynamoDB } from 'aws-sdk';
import AWS = require('aws-sdk');
import { AWSConfig } from '../../aws/config';
import { Event } from '../../model/event';
import { Stream } from '../../model/stream';
import { PersistenceProvider } from '../provider';
import { EventsTable } from './events';

/**
 * A Persistence Provider that handle all the data in Dynamodb.
 */
export class DynamodbProvider implements PersistenceProvider {
    private events: EventsTable;

    constructor(awsConfig: AWSConfig) {
        AWS.config.update(awsConfig.aws);

        const documentClient = new DynamoDB.DocumentClient({ convertEmptyValues: true });
        const dynamodb = new AWS.DynamoDB();
        this.events = new EventsTable(dynamodb, documentClient, awsConfig.eventsTable);
    }

    public async addEvent(stream: Stream, data: any): Promise<Event> {
        return this.events.addEvent(stream, data);
    }

    public async getEvents(stream: Stream, offset?: string, limit?: number): Promise<Array<Event>> {
        return this.events.getEvents(stream, offset, limit);
    }

    public async getAggregations(offset?: string, limit?: number): Promise<Array<string>> {
        throw new Error('Operation not supported for this provider');
    }

    public async getStreams(aggregation: string, offset?: string, limit?: number): Promise<Array<string>> {
        throw new Error('Operation not supported for this provider');
    }
}
