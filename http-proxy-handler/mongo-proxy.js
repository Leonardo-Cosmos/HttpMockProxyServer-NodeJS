/* 2018/7/21 */
'use strict';
const log4js = require('log4js');
const request = require('request');
const MongoClient = require('mongodb').MongoClient;

const ResponseData = require('./response-data');

const http = require('http');
const IncomingMessage = http.IncomingMessage;
const ServerResponse = http.ServerResponse;
const RemoteConfig = require('./remote-config');
const MongoConfig = require('./mongo-config');

const logger = log4js.getLogger('MongoProxy');

const headerKeyAccessControlAllowOrigin = 'access-control-allow-origin';

/**
 * Get data from remote. If access remote successfully, save to MongoDB.
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 * @param {RemoteConfig} remoteConfig
 * @param {MongoConfig} mongoConfig 
 */
function invokeRemote(req, res, remoteConfig, mongoConfig) {

    let resourceUri = req.url;
    logger.info(`Requested resource: ${resourceUri}`);

    requestRemote(resourceUri, remoteConfig)
        .then(responseData => {
            if (responseData) {
                sendResponse(res, responseData);
                saveToMongoDB(resourceUri, responseData, mongoConfig);
            } else {
                res.end();
            }
        });
}

/**
 * Load data from MongoDB.
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 * @param {MongoConfig} mongoConfig 
 */
function invokeMongo(req, res, mongoConfig) {

    let resourceUri = req.url;
    logger.info(`Requested resource: ${resourceUri}`);

    loadFromMongoDB(resourceUri, mongoConfig)
        .then(responseData => {
            if (responseData) {
                sendResponse(res, responseData);
            } else {
                res.end();
            }
        });
}

/**
 * Get data from remote. If access remote successfully, save to MongoDB.
 * If access remote failed, load from MongoDB.
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 * @param {RemoteConfig} remoteConfig 
 * @param {MongoConfig} mongoConfig 
 */
function invokeRemoteMongoMixed(req, res, remoteConfig, mongoConfig) {

    let resourceUri = req.url;
    logger.info(`Requested resource: ${resourceUri}`);

    requestRemote(resourceUri, remoteConfig)
        .then(remoteData => {
            if (remoteData) {
                sendResponse(res, remoteData);
                saveToMongoDB(resourceUri, remoteData, mongoConfig);
            } else {
                loadFromMongoDB(resourceUri, mongoConfig)
                    .then(dbData => {
                        if (dbData) {
                            sendResponse(res, dbData);
                        } else {
                            res.end();
                        }
                    });
            }
        });
}

/**
 * Load data from MongoDB. If load from MongoDB failed, get data from remote. 
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 * @param {MongoConfig} mongoConfig
 * @param {RemoteConfig} remoteConfig 
 */
function invokeMongoRemoteMixed(req, res, mongoConfig, remoteConfig) {

    let resourceUri = req.url;
    logger.info(`Requested resource: ${resourceUri}`);

    loadFromMongoDB(resourceUri, mongoConfig)
        .then(dbData => {
            if (dbData) {
                sendResponse(res, dbData);
            } else {
                requestRemote(resourceUri, remoteConfig)
                    .then(remoteData => {
                        if (remoteData) {
                            sendResponse(res, remoteData);
                            saveToMongoDB(resourceUri, remoteData, mongoConfig);
                        } else {
                            res.end();
                        }
                    });
            }
        });
}

/**
 * Request data as HTTP client.
 * @param {string} resourceUri 
 * @param {RemoteConfig} config 
 */
function requestRemote(resourceUri, config) {

    let remoteUri = `${config.protocol}://${config.domain}${config.baseUri}${resourceUri}`;
    logger.info(`Get data from remote: ${remoteUri}`);

    return new Promise((resolve, reject) => {
        let result = {};
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
    }).then(result => {
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
 * @param {ServerResponse} res 
 * @param {ResponseData} responseData 
 */
function sendResponse(res, responseData) {
    let responseHeaders = responseData.headers;
    for (let headerKey in responseHeaders) {
        if (headerKey === headerKeyAccessControlAllowOrigin) {
            continue;
        } else {
            res.setHeader(headerKey, responseHeaders[headerKey]);
        }
    }
    let bodyBuffer = ResponseData.parseBody(responseData.headers, responseData.body);
    res.write(bodyBuffer);
}

/**
 * Save response data to MongoDB.
 * @param {string} resourceUri 
 * @param {ResponseData} responseData 
 * @param {MongoConfig} config 
 */
function saveToMongoDB(resourceUri, responseData, config) {
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
 * @param {string} resourceUri 
 * @param {MongoConfig} config 
 */
function loadFromMongoDB(resourceUri, config) {
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

module.exports = {
    invokeRemote,
    invokeMongo,
    invokeRemoteMongoMixed,
    invokeMongoRemoteMixed
};
