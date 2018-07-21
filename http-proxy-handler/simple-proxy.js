/* 2018/7/14 */
'use strict';
const log4js = require('log4js');
const rpn = require('request-promise-native');

const logger = log4js.getLogger('SimpleProxy');

const headerKeyAccessControlAllowOrigin = 'access-control-allow-origin';
const headerKeyContentType = 'content-type';

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
    }).then(response => {
        logger.info(`Access remote succeed, status: ${response.statusCode}. ${remoteUri}`)

        let reasponseHeaders = response.headers;
        for (let headerKey in reasponseHeaders) {
            if (headerKey === headerKeyContentType) {
                logger.debug(`Content type: ${reasponseHeaders[headerKey]}`);
            } else if (headerKey === headerKeyAccessControlAllowOrigin) {
                continue;
            } else {
                res.setHeader(headerKey, reasponseHeaders[headerKey]);
            }
        }
        res.send(response.body);
    }).catch(err => {
        logger.error(`Access remote failed, status: ${err.statusCode}. ${remoteUri}`);
        res.end();
    });
}

module.exports = {
    invokeRemote
}
