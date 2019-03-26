'use strict';

import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import { PoolConfig } from 'mysql';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);
const expect = chai.expect;

// tslint:disable:no-unused-expression

describe('MySQL Factory', () => {
    let mySqlStub: sinon.SinonStubbedInstance<any>;
    let poolClusterStub: sinon.SinonStubbedInstance<any>;
    let MySQLFactory: any;

    beforeEach(() => {
        poolClusterStub = sinon.stub({
            add: (config: PoolConfig) => this
        });

        mySqlStub = sinon.stub({
            createPool: (config: PoolConfig) => this,
            createPoolCluster: () => this
        });
        mySqlStub.createPoolCluster.returns(poolClusterStub);

        MySQLFactory = proxyquire('../../../src/mysql/connect', { mysql: mySqlStub }).MySQLFactory;
    });

    afterEach(() => {
        mySqlStub.createPool.restore();
        mySqlStub.createPoolCluster.restore();
    });

    it('should be able to create a connection pool for mysql', async () => {
        const mySQL = {
            config: {
                database: 'test-db',
                host: 'localhost',
                port: 13306
            }
        };

        MySQLFactory.createPool(mySQL);

        expect(mySqlStub.createPool).to.have.been.calledOnceWithExactly(mySQL.config);
    });

    it('should be able to validate mysql config params', async () => {
        const config = {
            config: {
                host: 'localhost',
                password: 'test',
                port: 6379
            },
            invalidOption: 'invalid'
        };

        expect(() => MySQLFactory.createPool(config)).to.throw();
    });

    it('should be able to create a pool to connect to a mySQL cluster', async () => {
        const mySQL = {
            cluster: {
                'master': {
                    database: 'test-db',
                    host: 'localhost',
                    port: 13306
                },
                'slave': {
                    database: 'test-db',
                    host: 'localhost',
                    port: 3307
                }
            }
        };

        MySQLFactory.createPool(mySQL);

        expect(mySqlStub.createPoolCluster).to.have.been.calledOnce;
        expect(poolClusterStub.add).to.have.been.calledTwice;
        expect(poolClusterStub.add).to.have.been.calledWithExactly('master', mySQL.cluster.master);
        expect(poolClusterStub.add).to.have.been.calledWithExactly('slave', mySQL.cluster.slave);
    });
});
