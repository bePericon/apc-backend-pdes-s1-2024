import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../class/ApiResponse';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config/config';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const cookie = req.cookies['access_token'];

  const authorization = req.get('authorization');

  const existCorrectAuthorization =
    authorization && authorization.toLocaleLowerCase().startsWith('bearer');
  let decodedTokenCorrect = true;

  let token = '';
  let decodedToken = null;

  if (existCorrectAuthorization) {
    token = authorization.substring(7);
    try {
      decodedToken = jwt.verify(token, config.secret_token as string) as JwtPayload;
      decodedTokenCorrect = decodedToken.id!;
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

  next();
};

export default authMiddleware;

/**
 * @swagger
 * components:
 *  securitySchemes:
 *    cookieAuth:
 *      type: apiKey
 *      in: cookie
 *      name: access_token
 *    bearerAuth:
 *      type: http
 *      scheme: bearer
 *      bearerFormat: JWT
 */
