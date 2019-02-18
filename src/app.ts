/* 2018/7/14 */
import * as express from 'express';
import * as cors from 'cors';
import * as simpleProxyRouter from './router/simple-proxy-router';
import * as mongoProxyRouter from './router/mongo-proxy-router';

class App {
    public express: express.Express;

    constructor() {
        this.express = express();
        this.mountRoutes();
    }

    private getDefaultRoute(): express.Router {
        const router = express.Router();
        return router.get('/', (req, res) => {
            res.json({
                message: 'Hello World!'
            });
        });
    }

    private mountRoutes(): void {
        this.express.use(cors({
            origin: ['localhost', /10\.202\.\d+\.\d+/, /192\.168\.\d+\.\d+/, /172\.20\.\d+\.\d+/],
            credentials: true
        }));

        this.express.use('/', this.getDefaultRoute());

        this.express.use('/simple-proxy', simpleProxyRouter.router);
        this.express.use('/mongo-proxy', mongoProxyRouter.router);
    }
}

export default new App().express;
