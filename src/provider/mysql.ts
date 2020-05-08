import { Event } from '../model/event';
import { Stream } from '../model/stream';
import { MySQLConfig } from '../mysql/config';
import { MySQL } from '../mysql/mysql';
import { PersistenceProvider } from './provider';

/**
 * A Persistence Provider that handle all the data in mysql.
 */
export class MySQLProvider implements PersistenceProvider {
    private mysql: MySQL;
    private initialized = false;

    constructor(config: MySQLConfig) {
        this.mysql = new MySQL(config);
    }

    public async addEvent(stream: Stream, data: any) {
        await this.ensureTables();
        let result = await this.mysql.query('INSERT INTO events(streamId, aggregation, payload, sequence) ' +
            'SELECT ?,?,?,COUNT(*) FROM events ' +
            'WHERE streamId = ? AND aggregation = ?',
            [stream.id, stream.aggregation, JSON.stringify(data), stream.id, stream.aggregation]);

        result = await this.mysql.query('SELECT sequence, commitTimestamp FROM events WHERE id=?', [result.insertId]);

        const event: Event = {
            commitTimestamp: result.commitTimestamp,
            payload: data,
            sequence: result.sequence
        };
        return event;
    }

    public async getEvents(stream: Stream, offset: number = 0, limit: number = -1) {
        await this.ensureTables();
        if (limit <= 0) {
            limit = Number.MAX_SAFE_INTEGER;
        }
        const result: Array<any> = await this.mysql.query('SELECT * FROM events WHERE streamId=? AND aggregation=? LIMIT ?,?',
            [stream.id, stream.aggregation, offset, limit]);
        return result.map(data => {
            return {
                commitTimestamp: data.commitTimestamp,
                payload: JSON.parse(data.payload),
                sequence: data.sequence
            };
        });
    }

    public async getAggregations(offset: number = 0, limit: number = -1): Promise<Array<string>> {
        await this.ensureTables();
        if (limit <= 0) {
            limit = Number.MAX_SAFE_INTEGER;
        }
        return await this.mysql.query('SELECT DISTINCT aggregation FROM events LIMIT ?,?',
            [offset, limit]);
    }

    public async getStreams(aggregation: string, offset: number = 0, limit: number = -1): Promise<Array<string>> {
        await this.ensureTables();
        if (limit <= 0) {
            limit = Number.MAX_SAFE_INTEGER;
        }
        return await this.mysql.query('SELECT DISTINCT streamId FROM events WHERE aggregation = ? LIMIT ?,?',
            [aggregation, offset, limit]);
    }

    private async ensureTables() {
        if (!this.initialized) {
            await this.createTables();
            this.initialized = true;
        }
    }

    private async createTables() {
        await this.mysql.query('CREATE TABLE IF NOT EXISTS events ('
            + 'id BIGINT NOT NULL AUTO_INCREMENT,'
            + 'streamId VARCHAR(40) NOT NULL,'
            + 'aggregation VARCHAR(40) NOT NULL,'
            + 'payload TEXT,'
            + 'sequence INT,'
            + 'commitTimestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,'
            + 'PRIMARY KEY (id),'
            + 'INDEX AGGREGATION_INDEX(aggregation),'
            + 'INDEX STREAM_ID_INDEX(streamId)'
            + ')');
    }
}
