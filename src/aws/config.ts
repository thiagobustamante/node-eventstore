import { APIVersions, ConfigurationOptions } from 'aws-sdk/lib/config';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';

export interface AWSConfig {
    aws: ConfigurationOptions & ConfigurationServicePlaceholders & APIVersions;
    eventsTable?: AWSDynamoConfig;
}

export interface AWSDynamoConfig {
    tableName?: string;
    readCapacityUnits?: number;
    writeCapacityUnits?: number;
}
