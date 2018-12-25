/* 2018/7/21 */
'use strict';
import * as log4js from 'log4js';
import * as request from 'request';
import * as MongoDB from 'mongodb';

import { Request, Response } from 'express';

import { RemoteConfig } from './model/remote-config';
import { MongoConfig } from './model/mongo-config';
import { ResponseData } from './model/response-data';
import { ResponseResult } from './model/response-result';

const logger = log4js.getLogger('MongoProxy');
const MongoClient = MongoDB.MongoClient;

const headerKeyAccessControlAllowOrigin = 'access-control-allow-origin';
const headerKeyContentLength = 'content-length';

export class MongoProxy {

    /**
     * Get data from remote. If access remote successfully, save to MongoDB.
     * @param req 
     * @param res 
     * @param remoteConfig
     * @param mongoConfig 
     */
    invokeRemote(req: Request, res: Response, remoteConfig: RemoteConfig, mongoConfig: MongoConfig) {

        let resourceUri = req.url;
        logger.info(`Requested resource: ${resourceUri}`);

        this.requestRemote(resourceUri, remoteConfig)
            .then(responseData => {
                if (responseData) {
                    this.sendResponse(res, responseData);
                    this.saveToMongoDB(resourceUri, responseData, mongoConfig);
                } else {
                    res.end();
                }
            });
    }


    /**
     * Load data from MongoDB.
     * @param req 
     * @param res 
     * @param mongoConfig 
     */
    invokeMongo(req: Request, res: Response, mongoConfig: MongoConfig) {

        let resourceUri = req.url;
        logger.info(`Requested resource: ${resourceUri}`);

        this.loadFromMongoDB(resourceUri, mongoConfig)
            .then(responseData => {
                if (responseData) {
                    this.sendResponse(res, responseData);
                } else {
                    res.end();
                }
            });
    }

    /**
     * Get data from remote. If access remote successfully, save to MongoDB.
     * If access remote failed, load from MongoDB.
     * @param req 
     * @param res 
     * @param remoteConfig 
     * @param mongoConfig 
     */
    invokeRemoteMongoMixed(req: Request, res: Response, remoteConfig: RemoteConfig, mongoConfig: MongoConfig) {

        let resourceUri = req.url;
        logger.info(`Requested resource: ${resourceUri}`);

        this.requestRemote(resourceUri, remoteConfig)
            .then(remoteData => {
                if (remoteData) {
                    this.sendResponse(res, remoteData);
                    this.saveToMongoDB(resourceUri, remoteData, mongoConfig);
                } else {
                    this.loadFromMongoDB(resourceUri, mongoConfig)
                        .then(dbData => {
                            if (dbData) {
                                this.sendResponse(res, dbData);
                            } else {
                                res.end();
                            }
                        });
                }
            });
    }


    /**
     * Load data from MongoDB. If load from MongoDB failed, get data from remote. 
     * @param req 
     * @param res 
     * @param mongoConfig
     * @param remoteConfig 
     */
    invokeMongoRemoteMixed(req: Request, res: Response, mongoConfig: MongoConfig, remoteConfig: RemoteConfig) {

        let resourceUri = req.url;
        logger.info(`Requested resource: ${resourceUri}`);

        this.loadFromMongoDB(resourceUri, mongoConfig)
            .then(dbData => {
                if (dbData) {
                    this.sendResponse(res, dbData);
                } else {
                    this.requestRemote(resourceUri, remoteConfig)
                        .then(remoteData => {
                            if (remoteData) {
                                this.sendResponse(res, remoteData);
                                this.saveToMongoDB(resourceUri, remoteData, mongoConfig);
                            } else {
                                res.end();
                            }
                        });
                }
            });
    }

    /**
     * Request data as HTTP client.
     * @param resourceUri 
     * @param config 
     */
    private requestRemote(resourceUri: string, config: RemoteConfig) {

        let remoteUri = `${config.protocol}://${config.domain}${config.baseUri}${resourceUri}`;
        logger.info(`Get data from remote: ${remoteUri}`);

        return new Promise((resolve, reject) => {
            let result = new ResponseResult;
            let chunks = [];
            request.get({
                url: remoteUri,
                agentOptions: {
                    rejectUnauthorized: false
                }
            })
                .on('response', response => {
                    result.statusCode = response.statusCode;
                    result.headers = response.headers;
                    if (result.bodyBuffer) {
                        resolve(result);
                    }
                })
                .on('error', err => {
                    reject(err);
                })
                .on('data', chunk => {
                    chunks.push(chunk);
                })
                .on('end', () => {
                    result.bodyBuffer = Buffer.concat(chunks);
                    if (result.headers) {
                        resolve(result);
                    }
                });
        }).then((result: ResponseResult) => {
            logger.info(`Access remote successfully, status: ${result.statusCode}. ${remoteUri}`);

            let body = ResponseData.buildBody(result.headers, result.bodyBuffer);
            let responseData = new ResponseData(result.headers, body);
            return Promise.resolve(responseData);
        }).catch(err => {
            logger.error(`Access remote failed, status: ${JSON.stringify(err)}. ${remoteUri}`);
        });
    }

    /**
     * Send data as HTTP server.
     * @param res 
     * @param responseData 
     */
    private sendResponse(res: Response, responseData: ResponseData) {
        let bodyBuffer = ResponseData.parseBody(responseData.headers, responseData.body);

        let responseHeaders = responseData.headers;
        for (let headerKey in responseHeaders) {
            if (headerKey === headerKeyAccessControlAllowOrigin) {
                continue;
            } else if (headerKey === headerKeyContentLength) {
                res.setHeader(headerKeyContentLength, bodyBuffer.length);
            } else {
                res.setHeader(headerKey, responseHeaders[headerKey]);
            }
        }

        if (!responseData.headers[headerKeyContentLength]) {
            res.setHeader(headerKeyContentLength, bodyBuffer.length);
        }

        res.write(bodyBuffer);
    }

    /**
     * Save response data to MongoDB.
     * @param resourceUri 
     * @param responseData 
     * @param config 
     */
    private saveToMongoDB(resourceUri: string, responseData: ResponseData, config: MongoConfig) {
        logger.info(`Save ${resourceUri} to MongoDB`);

        let mongoClient;
        let db;
        let collection;

        MongoClient.connect(config.uri, {
            useNewUrlParser: true
        }).then(client => {
            mongoClient = client;

            db = client.db(config.dbName);
            collection = db.collection(config.collectionName);

            return collection.findOne({
                url: resourceUri
            }, {});
        }).then(result => {
            if (result) {
                if (result.body === responseData.body) {
                    logger.debug(`Unchanged resource ${resourceUri}`);
                    return Promise.resolve();
                } else {
                    logger.debug(`Update resource ${resourceUri}`);
                    return collection.updateOne({
                        url: resourceUri
                    }, {
                            $set: {
                                headers: responseData.headers,
                                body: responseData.body
                            }
                        }, {});
                }
            } else {
                logger.debug(`Insert resource ${resourceUri}`);
                return collection.insertOne({
                    url: resourceUri,
                    headers: responseData.headers,
                    body: responseData.body
                }, {});
            }
        }).then(result => {
            if (result) {
                logger.debug(`Saved ${resourceUri} successfully ${JSON.stringify(result.result)}`);
            }
            mongoClient.close();
        }).catch(err => {
            logger.error(`Save ${resourceUri} to MongoDB failed ${JSON.stringify(err)}`);
        });
    }

    /**
     * Load response data from MongoDB.
     * @param resourceUri 
     * @param config 
     */
    private loadFromMongoDB(resourceUri: string, config: MongoConfig) {
        logger.info(`Load ${resourceUri} from MongoDB`);

        let mongoClient;
        let db;
        let collection;

        return MongoClient.connect(config.uri, {
            useNewUrlParser: true
        }).then(client => {
            mongoClient = client;

            db = client.db(config.dbName);
            collection = db.collection(config.collectionName);

            return collection.findOne({
                url: resourceUri
            }, {});
        }).then(result => {
            logger.debug(`Loaded ${resourceUri} successfully`);
            mongoClient.close();
            let responseData = new ResponseData(result.headers, result.body);
            return Promise.resolve(responseData);
        }).catch(err => {
            logger.error(`Load ${resourceUri} from MongoDB failed ${JSON.stringify(err)}`);
        });
    }

}



