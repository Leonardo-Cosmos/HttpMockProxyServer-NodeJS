/* 2018/8/5 */
'use strict';

function RemoteConfig(protocol, domain, baseUri) {
    this.protocol = protocol;
    this.domain = domain;
    this.baseUri = baseUri;
}

module.exports = RemoteConfig;
