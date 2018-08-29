'use strict';

export interface RedisConfig {
    /**
     * Configure the connection to a standalone Redis.
     */
    standalone?: RedisNodeConfig;
    /**
     * Configure client to use Redis Sentinel.
     */
    sentinel?: RedisSentinelConfig;
    /**
     * List of cluster nodes.
     */
    cluster?: Array<RedisNodeConfig>;
    /**
     * Configure additional options to be passed to redis driver.
     */
    options?: RedisOptionsConfig;
}

export interface RedisNodeConfig {
    /**
     * The hostname of the redis node.
     */
    host: string;
    /**
     * The port of the redis node.
     */
    port?: string | number;
    /**
     * The password to connect on the redis node.
     */
    password?: string;
}

export interface RedisSentinelConfig {
    /**
     * List of sentinel nodes.
     */
    nodes: Array<RedisNodeConfig>;
    /**
     * Group os instances to connect (master/slaves group).
     */
    name: string;
}

export interface RedisOptionsConfig {
    /**
     * Fallback password. Used when not defined in a node.
     */
    password?: string;
    /**
     * Prefix to be appended to all keys (defaults to '').
     */
    keyPrefix?: string;
    /**
     * Connection name, for monitoring purposes.
     */
    connectionName?: string;
    /**
     * Database index.
     */
    db?: number;
}