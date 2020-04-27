
import AWS = require('aws-sdk');
import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { DynamoDBConfig } from '../../../src/dynamodb/config';

chai.use(sinonChai);

const expect = chai.expect;

// tslint:disable:no-unused-expression
describe('Config', () => {

    let dynamodbStub: sinon.SinonStub;
    let createTableStub: sinon.SinonStubbedInstance<any>;
    let promiseStub: sinon.SinonStubbedInstance<any>;
    let listTablesStub: sinon.SinonStubbedInstance<any>;

    beforeEach(() => {

        createTableStub = sinon.spy((data: any): any => {
            return {
                promise: (): any => ({})
            };
        });

        promiseStub = sinon.stub();
        listTablesStub = sinon.spy((data: any): any => {
            return {
                promise: promiseStub,
            };
        });

        sinon.stub(AWS, "config").returns({ update: (): any => null });
        dynamodbStub = sinon.stub(AWS, 'DynamoDB').returns({
            createTable: createTableStub,
            listTables: listTablesStub,
        });
    });

    afterEach(() => {
        dynamodbStub.restore();
    });

    it('should create tables', async () => {
        const dynamoDBConfig: DynamoDBConfig = new DynamoDBConfig({ region: 'any region' });

        await dynamoDBConfig.createTables('events_table_name', 'aggregation_table_name');

        expect(createTableStub).to.have.been.calledTwice;
    });

    it('check if table exists', async () => {
        promiseStub.returns({ TableNames: ['table_a', 'table_b', 'table_c'] });
        const dynamoDBConfig: DynamoDBConfig = new DynamoDBConfig({ region: 'any region' });
        const exists = await dynamoDBConfig.exists('table_a', 'table_b');

        expect(exists).to.have.been.true;
        expect(listTablesStub).to.have.been.calledOnce;
        expect(listTablesStub).to.have.been.calledWithExactly({});
    });

    it('should be false when just one table exists', async () => {
        promiseStub.returns({ TableNames: ['table_a', 'table_c'] });
        const dynamoDBConfig: DynamoDBConfig = new DynamoDBConfig({ region: 'any region' });
        const exists = await dynamoDBConfig.exists('table_a', 'table_b');

        expect(exists).to.have.been.false;
        expect(listTablesStub).to.have.been.calledOnce;
        expect(listTablesStub).to.have.been.calledWithExactly({});
    });

    it('should be false when none table exists', async () => {
        promiseStub.returns({ TableNames: [] });
        const dynamoDBConfig: DynamoDBConfig = new DynamoDBConfig({ region: 'any region' });
        const exists = await dynamoDBConfig.exists('table_a', 'table_b');

        expect(exists).to.have.been.false;
        expect(listTablesStub).to.have.been.calledOnce;
        expect(listTablesStub).to.have.been.calledWithExactly({});
    });
});