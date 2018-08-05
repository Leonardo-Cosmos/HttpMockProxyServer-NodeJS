/* 2018/8/5 */
'use strict';

const headerContentType = 'content-type';
const contentApplicationJavascript = 'application/x-javascript';
const contentApplicationJson = 'application/json';
const contentTextType = 'text/';
const contentCharsetUTF8 = 'charset=utf-8';

/**
 * Check if content is text type.
 * @param {string} contentType 
 */
function isTextContentType(contentType) {
    if (!contentType) {
        return false;        
    }

    return contentType.includes(contentTextType) || contentType.includes(contentCharsetUTF8) ||
        contentType.includes(contentApplicationJavascript) || contentType.includes(contentApplicationJson);
}

/**
 * Build body string by buffer of response stream.
 * @param {*} headers 
 * @param {Buffer} bodyBuffer 
 */
function buildBody(headers, bodyBuffer) {
    let contentType = headers[headerContentType];
    if (isTextContentType(contentType)) {
        return bodyBuffer.toString('utf-8');
    } else {
        return bodyBuffer.toString('base64');
    }
}

/**
 * Parse body string to buffer of response stream.
 * @param {*} headers 
 * @param {string} bodyString 
 */
function parseBody(headers, bodyString) {
    let contentType = headers[headerContentType];
    if (isTextContentType(contentType)) {
        return Buffer.from(bodyString, 'utf-8');
    } else {
        return Buffer.from(bodyString, 'base64');
    }
}

function ResponseData(headers, body) {
    this.headers = headers;
    this.body = body;
}

ResponseData.buildBody = buildBody;
ResponseData.parseBody = parseBody;

module.exports = ResponseData;
