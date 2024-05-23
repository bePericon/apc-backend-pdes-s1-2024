import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../class/ApiResponse';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config/config';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    access_token?: string;
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {

  const authorization = req.get('authorization');

  const existCorrectAuthorization =
    authorization && authorization.toLocaleLowerCase().startsWith('bearer');
  let decodedTokenCorrect = true;

  let token = '';
  let decodedToken = null;
  let cookie = null;

  if (existCorrectAuthorization) {
    token = authorization.substring(7);
    try {
      decodedToken = jwt.verify(token, config.secret_token as string) as JwtPayload;
      decodedTokenCorrect = decodedToken.id!;
      cookie = decodedToken.access_token!;
    } catch (err) {
      decodedTokenCorrect = false;
    }
  }

  if (!existCorrectAuthorization || !token || !decodedToken || !decodedTokenCorrect) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send(
        new ApiResponse(
          'El token es invalido o no existe',
          StatusCodes.UNAUTHORIZED,
          null
        )
      );
  }

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
  req.userId = decodedToken.id;
  req.access_token = cookie;

  next();
};

export default authMiddleware;

/**
 * @swagger
 * components:
 *  securitySchemes:
 *    bearerAuth:
 *      type: http
 *      scheme: bearer
 *      bearerFormat: JWT
 */
