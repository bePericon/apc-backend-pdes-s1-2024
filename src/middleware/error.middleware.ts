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
  const statusCode =
    err?.response?.status || err?.status || StatusCodes.INTERNAL_SERVER_ERROR;

  if (err.name === 'ValidationError') {
    let errors: any = {};

    Object.keys(err.errors).forEach((key: any) => {
      errors[key] = err.errors[key].message;
    });

    return res
      .status(StatusCodes.BAD_REQUEST)
      .send(
        new ApiResponse('Error en la validación', StatusCodes.BAD_REQUEST, null, errors)
      );
  }

  return res
    .status(statusCode)
    .send(new ApiResponse('Error en el servidor', statusCode, err));
};

export default errorMiddleware;
