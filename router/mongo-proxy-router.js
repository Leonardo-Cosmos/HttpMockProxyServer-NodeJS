/* 2018/7/21 */
const express = require('express');
const router = express.Router();

const mongoProxyHandler = require('../http-handler/mongo-proxy-handler');

router.get('/*', mongoProxyHandler.handle);

module.exports = router;
