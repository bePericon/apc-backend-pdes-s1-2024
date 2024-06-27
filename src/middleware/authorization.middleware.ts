import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../class/ApiResponse';
import User from '../model/userSchema';

const authorizationMiddleware = async (req: Request, res: Response, next: NextFunction) => {

  const foundUser = await User.findById(req.userId).populate('roles');
  const isAdmin = foundUser?.roles.find((role) => role.name === 'admin');
  
  if(!isAdmin) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send(
        new ApiResponse(
          'El usuario no tiene los permisos necesarios',
          StatusCodes.UNAUTHORIZED,
          null
        )
      );
  }

  next();
};

export default authorizationMiddleware;