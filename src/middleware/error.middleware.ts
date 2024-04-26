import { Request, Response, NextFunction } from 'express';
import { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../class/ApiResponse';

const errorMiddleware = (
  err: Error | AxiosError | string | any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let status = 'Error en el servidor';
  if (typeof err === 'object' && err.message) status = `Error: ${err.message}`;
  if (typeof err === 'string') status = err;

  let statusCode =
    err?.response?.status || err?.status || StatusCodes.INTERNAL_SERVER_ERROR;

  // Set error when catch wrong validation
  let errors: any = {};
  if (err.name === 'ValidationError') {
    Object.keys(err.errors).forEach((key: any) => {
      errors[key] = err.errors[key].message;
    });

    status = 'Error en la validación';
    statusCode = StatusCodes.BAD_REQUEST;
  }

  return res.status(statusCode).send(new ApiResponse(status, statusCode, err, errors));
};

export default errorMiddleware;
