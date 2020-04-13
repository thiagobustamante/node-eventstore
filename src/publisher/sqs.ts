'use strict';

import AWS = require('aws-sdk');
import { SQS } from 'aws-sdk';
import { AWSConfig } from '../aws/config';
import { Message } from '../model/message';
import { HasSubscribers, Publisher, Subscriber, Subscription } from './publisher';

/**
 * A Publisher that use RabbitMQ to message communications.
 */
export class SQSPublisher implements Publisher, HasSubscribers {
    private url: string;
    private sqs: SQS;

    constructor(url: string, awsconfig: AWSConfig) {
        AWS.config.update(awsconfig);
        this.sqs = new AWS.SQS();
        this.url = url;
    }

    public async publish(message: Message) {
        console.log(`Message to be send: ${JSON.stringify(message.event.payload)}`);
        const sqsData = {
            MessageAttributes: {
                "aggregation": {
                    DataType: "String",
                    StringValue: message.stream.aggregation
                },
                "commitTimestamp": {
                    DataType: "Number",
                    StringValue: `${message.event.commitTimestamp}`
                },
                "id": {
                    DataType: "String",
                    StringValue: message.stream.id,
                },
            },
            MessageBody: JSON.stringify(message),
            MessageDeduplicationId: message.stream.aggregation + message.event.commitTimestamp,
            MessageGroupId: message.stream.aggregation,
            QueueUrl: this.url,
        };

        let success = false;
        await this.sqs.sendMessage(sqsData, (error, data) => {
            if (!error) {
                success = true;
            }
            console.log(`Message sent: ${data.MessageId} - ${data.SequenceNumber} - ${data.MD5OfMessageBody}`);
        });

        return success;
    }

    public async subscribe(aggregation: string, subscriber: Subscriber): Promise<Subscription> {
        const { Consumer } = require('sqs-consumer');

        const consumer = Consumer.create({
            handleMessage: subscriber,
            queueUrl: this.url,
        });

        consumer.on('error', (error: { message: any; }) => {
            throw new Error(error.message);
        });

        consumer.on('processing_error', (error: { message: any; }) => {
            throw new Error(error.message);
        });

        consumer.start();


        return consumer;

    }
}
