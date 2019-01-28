/* 2018/7/14 */
import * as express from 'express';
import {
    SimpleProxyHandler
} from '../http-handler/simple-proxy-handler';

const router = express.Router();
let simpleProxyHandler = new SimpleProxyHandler();

router.get('/*', simpleProxyHandler.handle);
