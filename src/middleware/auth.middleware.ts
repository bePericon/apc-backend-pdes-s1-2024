import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../class/ApiResponse';

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookie = req.cookies['access_token'];

    if (!cookie) {
      return res
        .status(StatusCodes.NETWORK_AUTHENTICATION_REQUIRED)
        .send(
          new ApiResponse(
            'Es necesario que inicie sesión de nuevo',
            StatusCodes.NETWORK_AUTHENTICATION_REQUIRED,
            null
          )
        );
    }

    next();
  } catch (err) {
    throw new Error();
  }
};

export default authMiddleware;
