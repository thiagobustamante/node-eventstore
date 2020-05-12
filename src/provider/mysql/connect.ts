import * as Joi from 'joi';
import * as _ from 'lodash';
import * as MySQL from 'mysql';
import { MySQLConfig } from './config';

const mySQLConfigSchema = Joi.object().keys({
    cluster: Joi.object(),
    config: Joi.object()
}).xor('cluster', 'config');


export class MySQLFactory {
    public static createPool(config: MySQLConfig): MySQL.PoolCluster | MySQL.Pool {
        config = MySQLFactory.validateParams(config);

        let result: MySQL.PoolCluster | MySQL.Pool;

        if (config.cluster) {
            const poolCluster = MySQL.createPoolCluster();
            _.keys(config.cluster).forEach(key => {
                const clusterConfig: MySQL.PoolConfig = config.cluster[key];
                poolCluster.add(key, clusterConfig);
            });
            result = poolCluster;
        } else {
            const pool = MySQL.createPool(config.config);
            result = pool;
        }

        return result;
    }

    private static validateParams(config: MySQLConfig) {
        const result = Joi.validate(config, mySQLConfigSchema);
        if (result.error) {
            throw result.error;
        }
        return result.value;
    }
}


