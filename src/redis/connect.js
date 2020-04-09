'use strict';
exports.__esModule = true;
var Redis = require("ioredis");
var Joi = require("joi");
var _ = require("lodash");
var redisNodeSchema = Joi.object().keys({
    host: Joi.string().required(),
    password: Joi.string(),
    port: Joi.alternatives([Joi.string(), Joi.number().positive()])
});
var redisConfigSchema = Joi.object().keys({
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
var RedisFactory = /** @class */ (function () {
    function RedisFactory() {
    }
    RedisFactory.createClient = function (config) {
        config = RedisFactory.validateParams(config);
        var client;
        config = _.defaults(config, {
            options: {}
        });
        if (config.cluster) {
            config.cluster.forEach(function (node) {
                node.port = _.toSafeInteger(node.port);
            });
            client = new Redis.Cluster(config.cluster, {
                redisOptions: config.options,
                scaleReads: 'all'
            });
        }
        else if (config.sentinel) {
            var params = _.defaults(config.options, {
                name: config.sentinel.name,
                sentinels: config.sentinel.nodes
            });
            config.sentinel.nodes.forEach(function (node) {
                node.port = _.toSafeInteger(node.port);
            });
            client = new Redis(params);
        }
        else {
            config.standalone = _.defaults(config.standalone, {
                port: 6379
            });
            if (config.standalone.password) {
                config.options.password = config.standalone.password;
            }
            client = new Redis(_.toSafeInteger(config.standalone.port), config.standalone.host, config.options);
        }
        return client;
    };
    RedisFactory.validateParams = function (config) {
        var result = Joi.validate(config, redisConfigSchema);
        if (result.error) {
            throw result.error;
        }
        return result.value;
    };
    return RedisFactory;
}());
exports.RedisFactory = RedisFactory;
