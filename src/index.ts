/* 2018/7/14 */
import * as http from 'http';
import * as log4js from 'log4js';
import app from './app';

log4js.configure({
    appenders: {
      console: {
        type: 'stdout'
      }
    },
    categories: {
      default: {
        appenders: ['console'],
        level: 'debug'
      }
    }
  });

const port = process.env.PORT || 32080

const logger = log4js.getLogger('Server');

app.listen(port);
logger.info(`Server is listening on ${port}`)

app.on('error', onError);
//app.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    /*var addr = app.address();
    var bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
    logger.info('Listening on ' + bind);*/
}
