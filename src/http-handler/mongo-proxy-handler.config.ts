/* 2018/7/21 */
import { RemoteConfig } from '../http-proxy/model/remote-config';
import { MongoConfig } from '../http-proxy/model/mongo-config';

export const remoteConfig: RemoteConfig = {
    protocol: 'https',
    domain: 'www.domain.com',
    baseUri: '/resource',
};

export const mongoConfig: MongoConfig = {
    uri: 'mongodb://localhost:27017',
    dbName: 'db',
    collectionName: 'collection'
}
