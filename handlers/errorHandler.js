/*
  Catch Errors Handler
*/

const constants = require("../service/constants");

exports.catchErrors = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => {
      //Validation Errors
      if (typeof err === "string") {
        res.status(constants.responseStatusCode.badRequest).json({
          info: constants.failureCode,
          message: err,
        });
      } else {
        next(err);
      }
    });
  };
};

/*
  MongoDB Validation Error Handler

  Detect if there are mongodb validation errors that we send them nicely back.
*/

exports.mongoseErrors = (err, req, res, next) => {
  if (!err.errors) return next(err);
  const errorKeys = Object.keys(err.errors);
  let message = "";
  errorKeys.forEach((key) => (message += err.errors[key].message + ", "));

  message = message.substr(0, message.length - 2);

  res.status(constants.responseStatusCode.badRequest).json({
    info: constants.failureCode,
    message,
  });
};

/*
  Development Error Handler

  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/
exports.developmentErrors = (err, req, res, next) => {
  err.stack = err.stack || "";
  const errorDetails = {
    info: constants.failureCode,
    message: err.message,
    status: err.status,
    stack: err.stack,
  };

  res
    .status(err.status || constants.responseStatusCode.internalServerError)
    .json(errorDetails); // send JSON back
};

/*
  Production Error Handler

  No stacktraces and error details are leaked to user
*/
exports.productionErrors = (err, req, res, next) => {
  res.status(err.status || constants.responseStatusCode.badRequest).json({
    info: constants.failureCode,
    error: "Internal Server Error",
  }); // send JSON back
};

/*
404 Page Error
*/

exports.notFound = (req, res, next) => {
  res.status(constants.responseStatusCode.notFound).json({
    info: constants.failureCode,
    message: "Route not found",
  });
};
