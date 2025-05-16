import { NextFunction, Request, Response } from "express";

// Custom error class for known errors
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  else if ((err as any).code === 11000) {
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
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack }),
  });
};

// Catch 404 and forward to error handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(new AppError(`Not Found - ${req.originalUrl}`, 404));
};
