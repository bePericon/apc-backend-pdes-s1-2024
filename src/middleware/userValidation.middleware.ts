import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../class/ApiResponse';

const userValidationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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

    const result = formatResult(check);

    if (result.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(new ApiResponse('Error en la validación', StatusCodes.BAD_REQUEST, null, result));
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

export default userValidationMiddleware;

const formatResult = (result: any[]) => {
  return result
    .map((elem) =>
      elem.errors.map((err: any) => {
        return { [err.path]: err.msg };
      })
    )
    .flat();
};
