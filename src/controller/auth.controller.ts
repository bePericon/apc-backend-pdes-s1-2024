import { Controller, Get, Post } from '@overnightjs/core';
import Logger from 'jet-logger';
import User from '../model/userSchema';
import ApiResponse from '../class/ApiResponse';
import { StatusCodes } from 'http-status-codes';
import { compareSync } from 'bcrypt';
import { Request, Response } from 'express';
import axios from 'axios';

@Controller('api/auth')
export default class AuthController {
  @Get('login')
  private async login(req: Request, res: Response) {
    Logger.info(req.query, true);

    const user = await User.findOne({ email: req.query.email as string }).exec();

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(new ApiResponse('El usuario no existe', StatusCodes.NOT_FOUND, req.query));
    }

    //Validate password
    const result = compareSync(req.query.password as string, user.password);
    if (!result) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(new ApiResponse('Contraseña incorrecta', StatusCodes.BAD_REQUEST, null));
    }

    const accessToken = await this.refreshAccessToken();

    return (
      res
        .status(StatusCodes.OK)
        //.cookie('access_token', accessToken, { maxAge: 10000 }); // 10 seconds
        .cookie('access_token', accessToken, {
          maxAge: 60000 * 60 * 4, // 4 hours
        })
        .cookie('user_id', user._id, {
          maxAge: 60000 * 60 * 4, // 4 hours
        })
        .json(
          new ApiResponse('Se ha iniciado sesión correctamente', StatusCodes.OK, user)
        )
    );
  }

  private async refreshAccessToken() {
    const config = {
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
    };

    const body = {
      grant_type: 'refresh_token',
      client_id: '4948848510539929',
      client_secret: 'BEf4FIMU3lkTqxmEHSVsD3eWWaDiC2Zl',
      refresh_token: 'TG-660d64aefb4bec0001b6eee8-321855410',
    };

    const { data } = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      body,
      config
    );

    return data.access_token;
  }

  @Get('refresh')
  private async refresh(req: Request, res: Response) {
    Logger.info(req.body, true);

    const accessToken = await this.refreshAccessToken();
    return res
      .status(StatusCodes.OK)
      .cookie('access_token', accessToken, {
        maxAge: 60000 * 60 * 4, // 4 hours
      })
      .json(
        new ApiResponse(
          'Se refresco el access_token exitosamente',
          StatusCodes.OK,
          accessToken
        )
      );
  }
}

/**
 * @swagger
 * /api/auth/login:
 *  get:
 *    summary: Iniciar sesión en la app
 *    tags:
 *      - Auth
 *    parameters:
 *      - name: email
 *        in: query
 *        description: El email del usuario
 *        required: true
 *        schema:
 *          type: string
 *      - name: password
 *        in: query
 *        description: La contraseña del usuario
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: Se ha iniciado sesión correctamente
 *        headers:
 *          Set-Cookie:
 *            description: Se devuelve una cookie llamada *access_token*, la cual es necesaria incluir en los endpoints que necesitan autorización
 *            schema:
 *              type: string
 *              example: access_token=APP_USR-4948848510539929-042122-df1b7386b2947a765eea63331e473740-321855410
 *      400:
 *        description: Contraseña incorrecta
 *      404:
 *        description: El usuario no existe
 *      500:
 *        description: Error interno en el servidor
 */
