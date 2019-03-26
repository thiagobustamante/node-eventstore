'use strict';

import { PoolConfig } from 'mysql';

export interface MySQLConfig {
    /**
     * Configure the connection to a MySQL database.
     */
    config?: PoolConfig;
    /**
     * List of cluster nodes.
     */
    cluster?: { [index: string]: PoolConfig };
}
