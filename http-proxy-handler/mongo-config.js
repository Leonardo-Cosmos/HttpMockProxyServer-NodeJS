/* 2018/8/5 */
'use strict';

function MongoConfig(uri, dbName, collectionName) {
    this.uri = uri;
    this.dbName = dbName;
    this.collectionName = collectionName;
}

module.exports = MongoConfig;
