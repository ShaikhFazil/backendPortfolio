class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.expected = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(msg = 'Bad request', details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Not authenticated') { return new ApiError(401, msg); }
  static forbidden(msg = 'Not allowed') { return new ApiError(403, msg); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg); }
  static conflict(msg = 'Conflict') { return new ApiError(409, msg); }
  static tooLarge(msg = 'File too large') { return new ApiError(413, msg); }
  static unavailable(msg = 'Service unavailable') { return new ApiError(503, msg); }
}

module.exports = ApiError;
