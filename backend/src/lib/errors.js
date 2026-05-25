export class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export const notFound = (msg = 'Resource not found') => new AppError(404, 'NOT_FOUND', msg);
export const forbidden = (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg);
export const badRequest = (msg = 'Bad request') => new AppError(400, 'BAD_REQUEST', msg);
export const conflict = (msg = 'Conflict') => new AppError(409, 'CONFLICT', msg);
export const unauthorized = (msg = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', msg);
