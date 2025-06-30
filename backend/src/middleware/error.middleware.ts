import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "@/types/api";

export class CustomError extends Error {
  public statusCode?: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, statusCode?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "CustomError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ErrorMiddleware {
  public static handleError = (
    error: CustomError,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    console.error("Error occurred:", {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });

    const statusCode = error.statusCode || 500;
    const errorResponse: ErrorResponse = {
      error: error.name || "Internal Server Error",
      message: error.message || "An unexpected error occurred",
      status_code: statusCode,
      details: error.details,
    };

    // Don't expose internal errors in production
    if (statusCode === 500 && process.env.NODE_ENV === "production") {
      errorResponse.message = "Internal Server Error";
      delete errorResponse.details;
    }

    res.status(statusCode).json(errorResponse);
  };

  public static notFound = (req: Request, _res: Response, next: NextFunction): void => {
    const error: CustomError = new Error(`Route not found: ${req.method} ${req.url}`);
    error.statusCode = 404;
    next(error);
  };

  public static asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  public static createError = (
    message: string,
    statusCode: number = 500,
    details?: unknown
  ): CustomError => {
    const error: CustomError = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
  };

  public static gitHubError = (
    message: string,
    statusCode: number = 500,
    details?: unknown
  ): CustomError => {
    const error: CustomError = new Error(`GitHub API Error: ${message}`);
    error.statusCode = statusCode;
    error.code = "GITHUB_API_ERROR";
    error.details = details;
    return error;
  };

  public static validationError = (
    message: string,
    details?: unknown
  ): CustomError => {
    const error: CustomError = new Error(`Validation Error: ${message}`);
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    error.details = details;
    return error;
  };

  public static authenticationError = (
    message: string = "Authentication failed"
  ): CustomError => {
    const error: CustomError = new Error(message);
    error.statusCode = 401;
    error.code = "AUTHENTICATION_ERROR";
    return error;
  };

  public static authorizationError = (
    message: string = "Insufficient permissions"
  ): CustomError => {
    const error: CustomError = new Error(message);
    error.statusCode = 403;
    error.code = "AUTHORIZATION_ERROR";
    return error;
  };

  public static notFoundError = (
    resource: string = "Resource"
  ): CustomError => {
    const error: CustomError = new Error(`${resource} not found`);
    error.statusCode = 404;
    error.code = "NOT_FOUND_ERROR";
    return error;
  };

  public static rateLimitError = (
    message: string = "Rate limit exceeded"
  ): CustomError => {
    const error: CustomError = new Error(message);
    error.statusCode = 429;
    error.code = "RATE_LIMIT_ERROR";
    return error;
  };

  public static serverError = (
    message: string = "Internal server error",
    details?: unknown
  ): CustomError => {
    const error: CustomError = new Error(message);
    error.statusCode = 500;
    error.code = "SERVER_ERROR";
    error.details = details;
    return error;
  };

  public static errorHandler = (
    error: CustomError | Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    console.error("Error occurred:", {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });

    const statusCode = error instanceof CustomError ? error.statusCode || 500 : 500;
    const errorResponse: ErrorResponse = {
      error: error instanceof CustomError ? error.name || "Internal Server Error" : "Internal Server Error",
      message: error instanceof CustomError ? error.message || "An unexpected error occurred" : "An unexpected error occurred",
      status_code: statusCode,
      details: error instanceof CustomError ? error.details : undefined,
    };

    // Don't expose internal errors in production
    if (statusCode === 500 && process.env.NODE_ENV === "production") {
      errorResponse.message = "Internal Server Error";
      delete errorResponse.details;
    }

    res.status(statusCode).json(errorResponse);
  };
} 