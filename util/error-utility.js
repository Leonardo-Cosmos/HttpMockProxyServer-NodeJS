'use strict';

function handleError(res, logger, err) {
    logger.error(err);
    if (err.statusCode !== undefined) {
        res.send({
            success: false,
            statusCode: err.statusCode,
        });
    } else {
        res.send({
            success: false
        });
    }

}

module.exports = {
    handleError
};