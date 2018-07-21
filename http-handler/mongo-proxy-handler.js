/* 2018/7/21 */
'use strict';
const mongoProxy = require('../http-proxy-handler/mongo-proxy');
const config = require('./mongo-proxy-handler.config');

function handle(req, res) {
    mongoProxy.invokeRemote(req, res, config);
}

module.exports = {
    handle
};
