import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../class/ApiResponse';
import User from '../model/userSchema';

const userValidationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const check = await checkSchema(
      {
        name: { notEmpty: true, errorMessage: 'Debe tener un valor' },
        surname: { notEmpty: true, errorMessage: 'Debe tener un valor' },
        username: { notEmpty: true, errorMessage: 'Debe tener un valor' },
        email: { notEmpty: true, errorMessage: 'Email invalido' },
        password: {
          isLength: { options: { min: 8 }, errorMessage: 'Valor mínimo de 8 caracteres' },
          notEmpty: true,
          errorMessage: 'Debe tener un valor',
        },
      },
      ['body']
    ).run(req);

    const result: { [k: string]: any } = formatResult(check);

    const user = await User.findOne({ email: req.body.email });
    if (user) result.email = 'El email ya pertenece a un usuario';

    if (Object.keys(result).length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(
          new ApiResponse('Error en la validación', StatusCodes.BAD_REQUEST, null, result)
        );
    }

    next();
  } catch (error: any) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        new ApiResponse('Error en el servidor', StatusCodes.INTERNAL_SERVER_ERROR, null)
      );
  }
};

const userSignUpValidationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const check = await checkSchema(
      {
        name: { notEmpty: true, errorMessage: 'Debe tener un valor' },
        email: { notEmpty: true, errorMessage: 'Email invalido' },
        password: {
          isLength: { options: { min: 8 }, errorMessage: 'Valor mínimo de 8 caracteres' },
          notEmpty: true,
          errorMessage: 'Debe tener un valor',
        },
      },
      ['body']
    ).run(req);

    const result: { [k: string]: any } = formatResult(check);

    const user = await User.findOne({ email: req.body.email });
    if (user) result.email = 'El email ya pertenece a un usuario';

    if (Object.keys(result).length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(
          new ApiResponse('Error en la validación', StatusCodes.BAD_REQUEST, null, result)
        );
    }

    next();
  } catch (error: any) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        new ApiResponse('Error en el servidor', StatusCodes.INTERNAL_SERVER_ERROR, null)
      );
  }
};

export { userValidationMiddleware, userSignUpValidationMiddleware };

const formatResult = (result: any[]) => {
  let ret = {};
  result
    .map((elem) =>
      elem.errors.map((err: any) => {
        return { [err.path]: err.msg };
      })
    )
    .flat()
    .forEach((err) => (ret = { ...ret, ...err }));
  return ret;
};
