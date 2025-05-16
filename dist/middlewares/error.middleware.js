"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
// Custom error class for known errors
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    // Default values for unexpected errors
    let statusCode = 500;
    let message = "Internal Server Error";
    let stack = undefined;
    // Handle known operational errors
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    // Handle mongoose validation errors
    else if (err.name === "ValidationError") {
        statusCode = 400;
        message = err.message;
    }
    // Handle duplicate key errors
    else if (err.code === 11000) {
        statusCode = 409;
        message = "Duplicate field value entered";
    }
    // Handle JWT errors
    else if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }
    // Handle JWT expired errors
    else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }
    // Show stack trace in development
    if (process.env.NODE_ENV === "development") {
        console.error("[Error]", err);
        stack = err.stack;
    }
    // Send error response
    res.status(statusCode).json(Object.assign({ success: false, error: message }, (process.env.NODE_ENV === "development" && { stack })));
};
exports.errorHandler = errorHandler;
// Catch 404 and forward to error handler
const notFoundHandler = (req, res, next) => {
    next(new AppError(`Not Found - ${req.originalUrl}`, 404));
};
exports.notFoundHandler = notFoundHandler;
