/* 2018/7/21 */
'use strict';
const log4js = require('log4js');
const rpn = require('request-promise-native');

const logger = log4js.getLogger('MongoProxy');
const MongoClient = require('mongodb').MongoClient;

const headerKeyAccessControlAllowOrigin = 'access-control-allow-origin';

function invokeRemote(req, res, config) {

    let resourceUrl = req.url;
    logger.info(`Requested resource: ${resourceUrl}`);

    let remoteUri = `https://${config.remoteDomain}${config.remoteBaseUrl}${resourceUrl}`;
    logger.debug(`Get data from remote. ${remoteUri}`);

    rpn({
        uri: remoteUri,
        method: 'GET',
        resolveWithFullResponse: true,
        rejectUnauthorized: false
    }).then(remoteRes => {
        logger.info(`Access remote succeed, status: ${remoteRes.statusCode}. ${remoteUri}`);

        sendResponse(res, remoteRes);
        return Promise.resolve(remoteRes);
    }).then(
        remoteRes => saveToMongoDB(config, resourceUrl, remoteRes)
    ).catch(err => {
        logger.error(`Access remote failed, status: ${err.statusCode}. ${remoteUri}`);

        loadFromMongoDB(resourceUrl, config)
            .then(dbRes => {
                if (dbRes) {
                    sendResponse(res, dbRes);
                } else {
                    res.end();
                }
            });
    });
}

function sendResponse(res, dataRes) {
    let reasponseHeaders = dataRes.headers;
    for (let headerKey in reasponseHeaders) {
        if (headerKey === headerKeyAccessControlAllowOrigin) {
            continue;
        } else {
            res.setHeader(headerKey, reasponseHeaders[headerKey]);
        }
    }
    res.send(dataRes.body);
}

function saveToMongoDB(config, resourceUrl, response) {
    logger.info(`Save ${resourceUrl} to MongoDB`);

    let mongoClient;
    let db;
    let collection;

    MongoClient.connect(config.mongoUrl, {
        useNewUrlParser: true
    }).then(client => {
        mongoClient = client;

        db = client.db(config.mongoDbName);
        collection = db.collection(config.mongoCollectionName);

        return collection.findOne({
            url: resourceUrl
        }, {});
    }).then(result => {
        if (result) {
            if (result.body === response.body) {
                logger.debug(`Unchanged resource ${resourceUrl}`);
                return Promise.resolve();
            } else {
                logger.debug(`Update resource ${resourceUrl}`);
                return collection.updateOne({
                    url: resourceUrl
                }, {
                    $set: {
                        headers: response.headers,
                        body: response.body
                    }
                }, {});
            }
        } else {
            logger.debug(`Insert resource ${resourceUrl}`);
            return collection.insertOne({
                url: resourceUrl,
                headers: response.headers,
                body: response.body
            }, {});
        }
    }).then(result => {
        if (result) {
            logger.debug(`Saved ${resourceUrl} successfully ${JSON.stringify(result.result)}`);
        }
        mongoClient.close();
    }).catch(err => {
        logger.error(`Save ${resourceUrl} to MongoDB failed ${JSON.stringify(err)}`);
    });
}

function loadFromMongoDB(resourceUrl, config) {
    logger.info(`Load ${resourceUrl} from MongoDB`);

    let mongoClient;
    let db;
    let collection;

    return MongoClient.connect(config.mongoUrl, {
        useNewUrlParser: true
    }).then(client => {
        mongoClient = client;

        db = client.db(config.mongoDbName);
        collection = db.collection(config.mongoCollectionName);

        return collection.findOne({
            url: resourceUrl
        }, {});
    }).then(result => {
        logger.debug(`Loaded ${resourceUrl} successfully`)
        mongoClient.close();
        return Promise.resolve(result);
    }).catch(err => {
        logger.error(`Load ${resourceUrl} from MongoDB failed ${JSON.stringify(err)}`);
    });
}

module.exports = {
    invokeRemote
}