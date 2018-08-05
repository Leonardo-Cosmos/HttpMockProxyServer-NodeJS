/* 2018/7/21 */
'use strict';
const mongoProxy = require('../http-proxy-handler/mongo-proxy');
const RemoteConfig = require('../http-proxy-handler/remote-config');
const MongoConfig = require('../http-proxy-handler/mongo-config');
const config = require('./mongo-proxy-handler.config');

function handle(req, res) {

    let remoteConfig = new RemoteConfig(config.remoteProtocol, config.remoteDomain, config.remoteBaseUri);
    let mongoConfig = new MongoConfig(config.mongoUrl, config.mongoDbName, config.mongoCollectionName);
    mongoProxy.invokeRemoteMongoMixed(req, res, remoteConfig, mongoConfig);
    //mongoProxy.invokeMongoRemoteMixed(req, res, mongoConfig, remoteConfig);
}

module.exports = {
    handle
};
