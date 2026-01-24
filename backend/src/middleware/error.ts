import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        logger.error(`Error: ${err.message}`, { stack: err.stack });

        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production error handling
        if (err.isOperational) {
            // Trusted operational errors
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            // Programming or other unknown error
            logger.error('ERROR 💥', err);

            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!'
            });
        }
    }
};
