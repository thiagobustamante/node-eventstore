import AWS = require('aws-sdk');
import DynamoDB = require('aws-sdk/clients/dynamodb');
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { AWSDynamoConfig } from '../../aws/config';

export abstract class DynamoDBTable {
    protected documentClient: DocumentClient;
    protected tableConfig: AWSDynamoConfig;
    private dynamoDB: DynamoDB;
    private initialized = false;

    constructor(dynamo: AWS.DynamoDB, documentClient: DocumentClient, tableConfig: AWSDynamoConfig) {
        this.dynamoDB = dynamo;
        this.documentClient = documentClient;
        this.tableConfig = tableConfig;
    }

    protected async ensureTables() {
        if (!this.initialized) {
            if (!await this.tableExists()) {
                await this.createTable();
            }
            this.initialized = true;
        }
    }

    protected abstract scheme(): DynamoDB.Types.CreateTableInput;

    protected getReadCapacityUnits() {
        return this.tableConfig.readCapacityUnits;
    }

    protected getWriteCapacityUnits() {
        return this.tableConfig.writeCapacityUnits;
    }

    protected getTableName() {
        return this.tableConfig.tableName;
    }

    private async createTable(): Promise<void> {
        await this.dynamoDB.createTable(this.scheme()).promise();
    }

    private async tableExists(): Promise<boolean> {
        const tables = await this.dynamoDB.listTables({}).promise();
        return tables.TableNames.includes(this.getTableName());
    }
}