/* 2018/7/14 */
'use strict';
const simpleProxy = require('../http-proxy-handler/simple-proxy');
const config = require('./simple-proxy-handler.config');

function handle(req, res) {
    simpleProxy.invokeRemote(req, res, config);
}

module.exports = {
    handle
};
