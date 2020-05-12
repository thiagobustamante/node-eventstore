import { Pool, PoolCluster } from 'mysql';
import { MySQLConfig } from './config';
import { MySQLFactory } from './connect';


export class MySQL {
    private pool: PoolCluster | Pool;

    constructor(config: MySQLConfig) {
        this.pool = MySQLFactory.createPool(config);
    }

    public query(sql: string, args?: any) {
        return new Promise<any>((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    return reject(err);
                }
                connection.query(sql, args || [], (e, rows) => {
                    connection.release();
                    if (e) {
                        return reject(e);
                    }
                    resolve(rows);
                });
            });
        });
    }
}