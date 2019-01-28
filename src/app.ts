import * as express from 'express'
import * as simpleProxyRouter from './router/simple-proxy-router';
import * as mongoProxyRouter from './router/mongo-proxy-router';

class App {
    public express: express.Express;

    constructor() {
        this.express = express();
        this.mountRoutes();
    }

    private mountRoutes(): void {
        /*const router = express.Router();
        router.get('/', (req, res) => {
            res.json({
                message: 'Hello World!'
            });
        })
        this.express.use('/', router);*/
        this.express.use('/simple-proxy', simpleProxyRouter as express.Router);
        this.express.use('/mongo-proxy', mongoProxyRouter as express.Router);
    }
}

export default new App().express;