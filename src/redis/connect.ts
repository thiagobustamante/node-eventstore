'use strict';

import * as Redis from 'ioredis';
import * as _ from 'lodash';
import { RedisConfig } from './config';

export function initializeRedis(config: RedisConfig): Redis.Redis {
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
