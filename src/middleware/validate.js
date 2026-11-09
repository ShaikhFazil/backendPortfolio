const ApiError = require('../utils/ApiError');

// zod-schema -> express middleware. Replaces req[source] with the parsed value.
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.') || '(root)',
      message: i.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  if (source === 'query') {
    // req.query is a getter on Express 5-style setups; mutate safely
    Object.defineProperty(req, 'validatedQuery', { value: result.data, writable: true });
  } else {
    req[source] = result.data;
  }
  next();
};

module.exports = validate;
