import AWS = require('aws-sdk');
import DynamoDB = require("aws-sdk/clients/dynamodb");
import { AWSConfig } from "../aws/config";

export class DynamoDBConfig {
    private dynamoDB: DynamoDB;

    constructor(awsConfig: AWSConfig) {
        AWS.config.update(awsConfig);

        this.dynamoDB = new AWS.DynamoDB();
    }

    public async createTables(eventTableName: string, aggregationTableName: string) {
        await this.dynamoDB.createTable(this.eventsScheme(eventTableName)).promise();
        await this.dynamoDB.createTable(this.aggregationsScheme(aggregationTableName)).promise();
    }

    public async exists(eventTableName: string, aggregationTableName: string) {
        return this.dynamoDB.listTables({})
            .promise()
            .then((data) => {
                const exists = data.TableNames.filter(name => {
                    return name === eventTableName || name === aggregationTableName;
                }).length > 0;
                return exists;
            });
    }

    private eventsScheme = (tableName: string) => {
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
            TableName: tableName,
        };
    }

    private aggregationsScheme = (tableName: string) => {
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
            TableName: tableName,
        };
    }
}