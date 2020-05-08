jest.mock('aws-sdk');
jest.mock('../../../../src/provider/dynamo/events');

import { DynamodbProvider } from '../../../../src/provider/dynamo/dynamodb';
import AWS = require('aws-sdk');
import { AWSConfig } from '../../../../src/aws/config';
import { EventsTable } from '../../../../src/provider/dynamo/events';
import { Stream } from '../../../../src/model/stream';

const configUpdateMock = AWS.config.update as jest.Mock;
const DocumentClientMock = AWS.DynamoDB.DocumentClient as jest.Mock;
const DynamoDBMock: jest.Mock = AWS.DynamoDB as any;
const EventsTableMock: jest.Mock = EventsTable as any;
const EventsTableAddEventMock = jest.fn();
const EventsTableGetEventsMock = jest.fn();

describe('DynamodbProvider', () => {
    
    const dynamodb = { dynamo: 'db' };
    const documentClient = { dynamo: 'db' };

    beforeEach(() => {
        configUpdateMock.mockClear();
        DocumentClientMock.mockClear();
        DynamoDBMock.mockClear();
        EventsTableMock.mockClear();
        EventsTableAddEventMock.mockClear();
        EventsTableGetEventsMock.mockClear();

        EventsTableMock.mockReturnValue({
            addEvent: EventsTableAddEventMock,
            getEvents: EventsTableGetEventsMock
        })
        DynamoDBMock.mockReturnValue(dynamodb);
        DocumentClientMock.mockReturnValue(documentClient);
    });
    
    describe('constructor()', () => {
        it('should configure AWS and create EventsTable', async () => {
            const awsConfig: AWSConfig = {
                aws: {
                    region: 'test-region'
                },
                eventsTable: {
                    tableName: 'events'
                }
            };

            const dynamodbProvider = new DynamodbProvider(awsConfig);
            
            expect(configUpdateMock).toBeCalledWith(awsConfig.aws);
            expect(DocumentClientMock).toBeCalledWith({ convertEmptyValues: true });
            expect(DynamoDBMock).toBeCalledTimes(1);
            expect(EventsTableMock).toBeCalledWith(dynamodb, documentClient, awsConfig.eventsTable);
            expect(dynamodbProvider).toBeDefined();
        });
    });

    describe('addEvent()', () => {
        it('should delegate to EventsTable add the event', async () => {
            const awsConfig: any = {};

            const stream: Stream = { aggregation: 'my-aggregation', id: 'my-id' };
            const eventData = { data: 'my-event-data' };
            const returnedEvent = { payload: eventData };
            EventsTableAddEventMock.mockResolvedValue(returnedEvent)
            
            const dynamodbProvider = new DynamodbProvider(awsConfig);
            const event = await dynamodbProvider.addEvent(stream, eventData);
            
            expect(EventsTableMock).toBeCalledWith(dynamodb, documentClient, awsConfig.eventsTable);
            expect(EventsTableAddEventMock).toBeCalledWith(stream, eventData);
            expect(event).toEqual(returnedEvent);
        });
    });  
    
    describe('getEvents()', () => {
        it('should delegate to EventsTable add the event', async () => {
            const awsConfig: any = {};

            const stream: Stream = { aggregation: 'my-aggregation', id: 'my-id' };
            const offset = '3';
            const limit = 4;
            const eventData = { data: 'my-event-data' };
            const returnedEvents = [{ payload: eventData }];
            EventsTableGetEventsMock.mockResolvedValue(returnedEvents)
            
            const dynamodbProvider = new DynamodbProvider(awsConfig);
            const events = await dynamodbProvider.getEvents(stream, offset, limit);
            
            expect(EventsTableMock).toBeCalledWith(dynamodb, documentClient, awsConfig.eventsTable);
            expect(EventsTableGetEventsMock).toBeCalledWith(stream, offset, limit);
            expect(events).toEqual(returnedEvents);
        });
    });    
    
    describe('getAggregations()', () => {
        it('should throw a not supported error', async () => {
            const awsConfig: any = {};
            const dynamodbProvider = new DynamodbProvider(awsConfig);            
            expect(dynamodbProvider.getAggregations()).rejects.toEqual(new Error('Operation not supported for this provider'));
        });
    });     

    describe('getStreams()', () => {
        it('should throw a not supported error', async () => {
            const awsConfig: any = {};
            const dynamodbProvider = new DynamodbProvider(awsConfig);            
            const aggregation = 'my-aggregation';
            expect(dynamodbProvider.getStreams(aggregation)).rejects.toEqual(new Error('Operation not supported for this provider'));
        });
    });
})