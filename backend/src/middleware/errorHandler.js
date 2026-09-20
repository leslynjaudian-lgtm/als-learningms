/**
 * Global error-handling middleware.
 * Must have four parameters so Express recognises it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.stack || err.message);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
