/* 2018/7/21 */
import { Request, Response } from 'express';
import { HttpHandler } from './http-handler';
import { MongoProxy } from '../http-proxy/mongo-proxy';
import { RemoteConfig } from '../http-proxy/model/remote-config';
import { MongoConfig } from '../http-proxy/model/mongo-config';
import { remoteConfig, mongoConfig } from './mongo-proxy-handler.config';

export class MongoProxyHandler implements HttpHandler {

    private mongoProxy: MongoProxy;

    constructor() {
        this.mongoProxy = new MongoProxy();
    }

    handle(req: Request, res: Response) {
        this.mongoProxy.invokeRemoteMongoMixed(req, res, remoteConfig, mongoConfig);
        // this.mongoProxy.invokeMongoRemoteMixed(req, res, mongoConfig, remoteConfig);
    }

}
