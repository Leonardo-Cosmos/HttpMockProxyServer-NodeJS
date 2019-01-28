/* 2018/7/14 */
import { Request, Response } from 'express';
import { HttpHandler } from './http-handler';
import { SimpleProxy } from '../http-proxy/simple-proxy';
import { config } from './simple-proxy-handler.config';

export class SimpleProxyHandler implements HttpHandler {

    private simpleProxy: SimpleProxy;

    constructor(){
        this.simpleProxy = new SimpleProxy();
    }

    handle(req: Request, res: Response) {
        this.simpleProxy.invokeRemote('GET', req, res, config);
    }

}
