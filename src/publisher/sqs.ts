'use strict';

import AWS = require('aws-sdk');
const { Consumer } = require('sqs-consumer');
import { SQS } from 'aws-sdk';
import { AWSConfig } from '../aws/config';
import { Message } from '../model/message';
import { HasSubscribers, Publisher, Subscriber, Subscription } from './publisher';

/**
 * A Publisher that use SQS to message communications.
 */
export class SQSPublisher implements Publisher, HasSubscribers {
    private url: string;
    private sqs: SQS;

    constructor(url: string, awsconfig: AWSConfig) {
        AWS.config.update(awsconfig);
        this.sqs = new AWS.SQS();
        this.url = url;
    }

    public async publish(message: Message): Promise<boolean> {
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
            MessageDeduplicationId: `${message.stream.aggregation}:${message.stream.id}:${message.event.commitTimestamp}`,
            QueueUrl: this.url,
        };

        const messageId = await (await this.sqs.sendMessage(sqsData).promise()).MessageId;
        return messageId !== null && messageId !== undefined;
    }

    public async subscribe(aggregation: string, subscriber: Subscriber): Promise<Subscription> {
        const consumer = Consumer.create({
            handleMessage: subscriber,
            queueUrl: this.url,
        });

        consumer.start();

        return consumer;
    }
}
