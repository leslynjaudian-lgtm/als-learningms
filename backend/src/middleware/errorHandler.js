/**
 * Global error-handling middleware.
 * Must have four parameters so Express recognises it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.stack || err.message || err);

  // Map common Prisma & Express errors to appropriate HTTP status codes
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Requested record was not found.',
      message: 'Requested record was not found.',
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with the provided unique identifier already exists.',
      message: 'A record with the provided unique identifier already exists.',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Invalid related record reference.',
      message: 'Invalid related record reference.',
    });
  }

  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      error: 'Invalid JSON request payload.',
      message: 'Invalid JSON request payload.',
    });
  }

  const status = Number(err.status || err.statusCode) || 500;
  const isServerError = status >= 500;
  const safeMessage = isServerError
    ? 'An internal server error occurred. Please try again.'
    : err.message || 'Request could not be completed.';

  res.status(status).json({
    error: safeMessage,
    message: safeMessage,
  });
}
