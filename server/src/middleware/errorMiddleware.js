export const notFound = (req, res, next) => {
  const error = new Error(`Endpoint Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || (err.name === 'ValidationError' || err.code === 11000 ? 400 : res.statusCode === 200 ? 500 : res.statusCode);
  if (statusCode === 429) res.set('Retry-After', '60');

  res.status(statusCode).json({
    success: false,
    message: err.code === 11000 ? 'An account with this email already exists.' : statusCode === 500 ? 'An unexpected server error occurred. Please try again.' : err.message,
  });
};
