/* 2018/7/14 */
import * as log4js from 'log4js';
import * as request from 'request';
import * as rpn from 'request-promise-native';

import { Request, Response } from 'express';

import { SimpleProxyConfig } from './model/simple-proxy-config';
import { ResponseResult } from './model/response-result';

const logger = log4js.getLogger('SimpleProxy');

const headerKeyAccessControlAllowOrigin = 'access-control-allow-origin';
const headerKeyContentType = 'content-type';

export class SimpleProxy {

    invokeRemoteByRPN(req: Request, res: Response, config: SimpleProxyConfig) {

        let resourceUrl = req.url;
        logger.info(`Requested resource: ${resourceUrl}`);

        let remoteUri = `https://${config.remoteDomain}${config.remoteBaseUrl}${resourceUrl}`;
        logger.info(`Get data from remote ${remoteUri}`);

        rpn({
            uri: remoteUri,
            method: 'GET',
            resolveWithFullResponse: true,
            rejectUnauthorized: false
        }).then(response => {
            logger.info(`Access remote succeed, status: ${response.statusCode}. ${remoteUri}`);

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

    /**
     * Invoke remote server.
     * @param method  
     * @param req 
     * @param res 
     * @param config 
     */
    invokeRemote(method: string, req: Request, res: Response, config: SimpleProxyConfig) {

        let resourceUrl = req.url;
        logger.info(`Requested resource: ${resourceUrl}`);

        let remoteUri = `${config.remoteProtocol}://${config.remoteDomain}${config.remoteBaseUrl}${resourceUrl}`;
        logger.info(`Invoke remote ${remoteUri}`);

        new Promise((resolve, reject) => {
            let result = new ResponseResult();
            let chunks = [];
            request({
                method: method,
                uri: remoteUri,
                headers: req.headers,
                body: req.body,
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
            logger.info(`Access remote succeed, status: ${result.statusCode}. ${remoteUri}`);

            let reasponseHeaders = result.headers;
            logger.debug(JSON.stringify(reasponseHeaders));
            for (let headerKey in reasponseHeaders) {
                if (headerKey === headerKeyAccessControlAllowOrigin) {
                    continue;
                } else {
                    res.setHeader(headerKey, reasponseHeaders[headerKey]);
                }
            }

            //res.send(result.bodyBuffer.toString('utf-8'));
            res.statusCode = result.statusCode;
            res.write(result.bodyBuffer);
        }).catch(err => {
            logger.error(`Access remote failed, status: ${err.statusCode}. ${remoteUri}`);
            res.end(err.error);
        });
    }
}
