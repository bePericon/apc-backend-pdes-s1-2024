import { Controller, Get, Middleware, Post } from '@overnightjs/core';
import Logger from 'jet-logger';
import User from '../model/userSchema';
import ApiResponse from '../class/ApiResponse';
import { StatusCodes } from 'http-status-codes';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { userSignUpValidationMiddleware } from '../middleware/userValidation.middleware';
import Role from '../model/roleSchema';

@Controller('api/auth')
export default class AuthController {
  @Post('login')
  private async login(req: Request, res: Response) {
    Logger.info(req.body, true);

    const user = await User.findOne({ email: req.body.email as string })
      .select('-roles -favorites')
      .exec();

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(new ApiResponse('El usuario no existe', StatusCodes.NOT_FOUND, req.body));
    }

    //Validate password
    const result = compareSync(req.body.password as string, user.password);
    if (!result) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(new ApiResponse('Contraseña incorrecta', StatusCodes.BAD_REQUEST, null));
    }

    // Create token authorization and access_token for Meli
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.secret_token as string,
      { expiresIn: 60000 * 60 * 4 } // 4 hours
    );
    const accessToken = await this.refreshAccessToken();

    const userToReturn = await User.findOne({ email: req.body.email as string })
      .populate({
        path: 'roles',
        populate: [
          {
            path: 'permissions',
          },
        ],
      })
      .select('-password -favorites')
      .exec();

    return (
      res
        .status(StatusCodes.OK)
        //.cookie('access_token', accessToken, { maxAge: 10000 }); // 10 seconds
        .cookie('access_token', accessToken, {
          maxAge: 60000 * 60 * 4, // 4 hours
        })
        .json(
          new ApiResponse('Se ha iniciado sesión correctamente', StatusCodes.OK, {
            user: userToReturn,
            token,
          })
        )
    );
  }

  /**
   * @swagger
   * /api/auth/login:
   *  post:
   *    summary: Iniciar sesión en la app
   *    description: Se devuelve el usuario y un token de autenticación (duración 4 h)
   *    tags:
   *      - auth
   *    requestBody:
   *      description: Esquema de Login
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/Login'
   *    responses:
   *      200:
   *        description: Se ha iniciado sesión correctamente
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToLogin'
   *        headers:
   *          Set-Cookie:
   *            description: >
   *              Se devuelve cookie: *access_token* necesaria en los endpoints que necesitan autorización (duración 4 h)
   *            schema:
   *              type: string
   *              example: access_token=APP_USR-4948848510539929-042122-df1b7386b2947a765eea63331e473740-321855410
   *      400:
   *        description: Contraseña incorrecta
   *      404:
   *        description: El usuario no existe
   *      500:
   *        description: Error en el servidor
   */

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

  @Post('signup')
  @Middleware(userSignUpValidationMiddleware)
  private async add(req: Request, res: Response) {
    Logger.info(req.body, true);

    const salt = genSaltSync(10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashSync(req.body.password, salt),
    });

    const role = await Role.findOne({ name: 'comprador' });
    user.roles.push(role?._id);

    await user.save();

    return res
      .status(StatusCodes.CREATED)
      .json(new ApiResponse('Usuario registrado', StatusCodes.CREATED, user));
  }

  /**
   * @swagger
   * /api/auth/signup:
   *  post:
   *    summary: Registrar usuario
   *    tags:
   *      - auth
   *    requestBody:
   *      description: Esquema de Registro
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/SignUp'
   *    responses:
   *      201:
   *        description: Usuario registrado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToUser'
   *      500:
   *        description: Error en el servidor
   */
}

/**
 * @swagger
 * components:
 *  schemas:
 *    ApiResponseToLogin:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: object
 *              properties:
 *                token:
 *                  type: string
 *                user:
 *                  $ref: '#/components/schemas/UserToLogin'
 *    UserToLogin:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *        name:
 *          type: string
 *        surname:
 *          type: string
 *        username:
 *          type: string
 *        email:
 *          type: string
 *        roles:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Role'
 *        creationDate:
 *          type: string
 *    Login:
 *      type: object
 *      properties:
 *        email:
 *          type: string
 *        password:
 *          type: string
 *    SignUp:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        email:
 *          type: string
 *        password:
 *          type: string
 */
