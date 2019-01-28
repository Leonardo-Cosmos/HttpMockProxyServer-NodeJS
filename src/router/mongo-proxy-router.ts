/* 2018/7/21 */
import * as express from 'express';
import {
    MongoProxyHandler
} from '../http-handler/mongo-proxy-handler';

const router = express.Router();
let mongoProxyHandler = new MongoProxyHandler();

router.get('/*', mongoProxyHandler.handle);

module.exports = router;
