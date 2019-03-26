'use strict';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as _ from 'lodash';
import 'mocha';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { MySQLConfig } from '../../../src/mysql/config';

chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

// tslint:disable:no-unused-expression

describe('MySQL', () => {
    let mySqlFactoryStub: sinon.SinonStubbedInstance<any>;
    let poolStub: sinon.SinonStubbedInstance<any>;
    let connectionStub: sinon.SinonStubbedInstance<any>;
    let MySQL: any;

    beforeEach(() => {
        connectionStub = sinon.stub({
            query: (sql: string, args: Array<any>, callback: (e: any, rows: any) => void) => this,
            release: () => this
        });

        poolStub = sinon.stub({
            getConnection: (callback: (err: any, connection: any) => void) => this
        });

        mySqlFactoryStub = sinon.stub({
            createPool: (config: MySQLConfig) => this,
        });
        mySqlFactoryStub.createPool.returns(poolStub);
        MySQL = proxyquire('../../../src/mysql/mysql', {
            './connect': {
                MySQLFactory: mySqlFactoryStub
            }
        }).MySQL;
    });

    afterEach(() => {
        mySqlFactoryStub.createPool.restore();
        poolStub.getConnection.restore();
        connectionStub.query.restore();
        connectionStub.release.restore();
    });

    it('should be able to create a connection pool for mysql', async () => {
        const mySQLConfig: MySQLConfig = {
            config: {
                database: 'test-db',
                host: 'localhost',
                port: 3306
            }
        };

        const mySql = new MySQL(mySQLConfig);

        expect(mySqlFactoryStub.createPool).to.have.been.calledOnceWithExactly(mySQLConfig);
        expect(mySql.pool).to.be.equal(poolStub);
    });

    it('should be able to run a SQL query', async () => {
        const sql = 'some sql string';
        const args = ['some arguments'];
        const rows = [{ aField: 'value' }];

        const mySql = new MySQL({});
        poolStub.getConnection.yields(null, connectionStub);
        connectionStub.query.yields(null, rows);

        const result = await mySql.query(sql, args);

        expect(connectionStub.query).to.have.been.calledOnceWith(sql, args, sinon.match.func);
        expect(connectionStub.release).to.have.been.calledOnce;
        expect(result).to.be.equals(rows);
    });

    it('should be able to handle connection errors', (done) => {
        const sql = 'some sql string';
        const args = ['some arguments'];
        const error = new Error('Test error');

        const mySql = new MySQL({});
        poolStub.getConnection.yields(error, null);

        const result = mySql.query(sql, args);
        expect(result).to.eventually.be.rejectedWith(error).and.notify(done);
    });

    it('should be able to handle mysql errors', (done) => {
        const sql = 'some sql string';
        const args = ['some arguments'];
        const error = new Error('Test error');

        const mySql = new MySQL({});
        poolStub.getConnection.yields(null, connectionStub);
        connectionStub.query.yields(error, null);

        const result = mySql.query(sql, args);
        expect(connectionStub.query).to.have.been.calledOnceWith(sql, args, sinon.match.func);
        expect(connectionStub.release).to.have.been.calledOnce;
        expect(result).to.eventually.be.rejectedWith(error).and.notify(done);
    });
});
