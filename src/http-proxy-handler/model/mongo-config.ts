/* 2018/8/5 */

export class MongoConfig {

    constructor(
        public uri: string,
        public dbName: string,
        public collectionName: string) {
    }
    
}

