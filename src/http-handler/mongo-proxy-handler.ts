/* 2018/7/21 */
import { Request, Response } from 'express';
import { HttpHandler } from './http-handler';
import { MongoProxy } from '../http-proxy/mongo-proxy';
import { RemoteConfig } from '../http-proxy/model/remote-config';
import { MongoConfig } from '../http-proxy/model/mongo-config';
import { remoteConfig, mongoConfig } from './mongo-proxy-handler.config';

export class MongoProxyHandler implements HttpHandler {

    private mongoProxy: MongoProxy;

    private remoteConfig: RemoteConfig;

    private mongoConfig: MongoConfig;

    constructor() {
        this.mongoProxy = new MongoProxy();
        this.remoteConfig = remoteConfig;
        this.mongoConfig = mongoConfig;
    }

    handle(req: Request, res: Response) {
        this.mongoProxy.invokeRemoteMongoMixed(req, res, this.remoteConfig, this.mongoConfig);
        // this.mongoProxy.invokeMongoRemoteMixed(req, res, this.mongoConfig, this.remoteConfig);
    }

}
