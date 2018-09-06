'use strict';

import * as Redis from 'ioredis';
import * as Joi from 'joi';
import * as _ from 'lodash';
import { RedisConfig } from './config';

const redisNodeSchema = Joi.object().keys({
    host: Joi.string().required(),
    password: Joi.string(),
    port: Joi.alternatives([Joi.string(), Joi.number().positive()])
});

const redisConfigSchema = Joi.object().keys({
    cluster: Joi.alternatives([Joi.array().items(redisNodeSchema), redisNodeSchema]),
    options: Joi.object().keys({
        connectionName: Joi.string(),
        db: Joi.number().positive(),
        keyPrefix: Joi.string(),
        password: Joi.string()
    }),
    sentinel: Joi.object().keys({
        name: Joi.string().required(),
        nodes: Joi.alternatives([Joi.array().items(redisNodeSchema), redisNodeSchema]).required()
    }),
    standalone: redisNodeSchema
}).xor('standalone', 'sentinel', 'cluster');


export class RedisFactory {
    public static createClient(config: RedisConfig): Redis.Redis {
        config = RedisFactory.validateParams(config);
        let client;

        config = _.defaults(config, {
            options: {}
        });

        if (config.cluster) {
            config.cluster.forEach(node => {
                node.port = _.toSafeInteger(node.port);
                node.host = node.host;
            });
            client = new Redis.Cluster(config.cluster as any, {
                redisOptions: config.options,
                scaleReads: 'all'
            });
        } else if (config.sentinel) {
            const params = _.defaults(config.options, {
                name: config.sentinel.name,
                sentinels: config.sentinel.nodes
            });
            config.sentinel.nodes.forEach(node => {
                node.port = _.toSafeInteger(node.port);
                node.host = node.host;
            });
            client = new Redis(params);
        } else {
            config.standalone = _.defaults(config.standalone, {
                host: 'localhost',
                port: 6379
            });

            if (config.standalone.password) {
                config.options.password = config.standalone.password;
            }

            client = new Redis(_.toSafeInteger(config.standalone.port),
                config.standalone.host, config.options);
        }

        return client;
    }

    private static validateParams(config: RedisConfig) {
        const result = Joi.validate(config, redisConfigSchema);
        if (result.error) {
            throw result.error;
        }
        return result.value;
    }

}
