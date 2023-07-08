const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please try again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please login again.', 401);

const handleDuplicateFieldErrorDB = (err) => {
  const value = Object.values(err.keyValue);
  const message = `Duplicate field value: ${value}, Use another one.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  const messsage = `Invalid input data. ${errors}`;
  return new AppError(messsage, 400);
};

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE
  console.error('Error 💥', err);
  return res.status(res.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // OPERATIONAL , TRUSTED ERRORS : SEND MESSAGE TO CLIENT
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // PROGRAMMING OR OTHER UNKOWN ERRORS : DON'T LEAK ERROR DETAILS
    // 1) LOG ERROR
    console.error('Error 💥', err);
    // 2) SEND GENERIC MESSAGE
    return res.status(err.statusCode).json({
      status: err.status,
      message: 'Something went worng',
    });
  }

  // B) RENDERED WEBSITE
  // OPERATIONAL , TRUSTED ERRORS : SEND MESSAGE TO CLIENT
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      status: err.status,
      msg: err.message,
    });
  }
  // PROGRAMMING OR OTHER UNKOWN ERRORS : DON'T LEAK ERROR DETAILS
  // 1) LOG ERROR
  console.error('Error 💥', err);
  // 2) SEND GENERIC MESSAGE
  return res.status(err.statusCode).render('error', {
    status: err.status,
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
