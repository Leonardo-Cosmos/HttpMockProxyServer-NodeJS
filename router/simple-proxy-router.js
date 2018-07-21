/* 2018/7/14 */
const express = require('express');
const router = express.Router();

const simpleProxyHandler = require('../http-handler/simple-proxy-handler');

router.get('/*', simpleProxyHandler.handle);

module.exports = router;
