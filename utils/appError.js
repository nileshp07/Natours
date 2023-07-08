/* eslint-disable no-unused-expressions */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); //Calling the parent class constructor i.e Error by passing the message as argument to it.

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
