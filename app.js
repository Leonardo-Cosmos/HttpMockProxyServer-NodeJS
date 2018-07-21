/* 2018/7/14 */
const express = require('express');
const cors = require('cors');

const simpleProxy = require('./router/simple-proxy-router')

const app = express();
 
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use('/simple-proxy', simpleProxy);

module.exports = app;
