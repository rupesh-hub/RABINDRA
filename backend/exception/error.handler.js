// const { constants } = require("../constants/constants");
import { constants } from "./constants.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  switch (statusCode) {
    case constants.VALIDATION_ERROR:
      res.json({
        title: "Validation Failed",
        message: err.message,
        trace: err.stack,
      });
      break;

    case constants.NOT_FOUND:
      res.json({
        title: "Not Found",
        message: err.message,
        trace: err.stack,
      });
      break;

    case constants.UNAUTHORIZED:
      res.json({
        title: "Unauthorized",
        message: "Authentication is required.",
        trace: err.stack,
      });
      break;

    case constants.FORBIDDEN:
      res.json({
        title: "Forbidden",
        message: "You do not have permission to access this resource.",
        trace: err.stack,
      });
      break;

    case constants.CONFLICT:
      res.json({
        title: "Conflict",
        message: "There is a conflict with the current state of the resource.",
        trace: err.stack,
      });
      break;

    case constants.SERVER_ERROR:
    default:
      res.json({
        title: "Server Error",
        message: "An internal server error occurred.",
        trace: err.stack,
      });
      break;
  }
};
