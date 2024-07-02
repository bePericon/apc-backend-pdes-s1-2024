import { StatusCodes } from 'http-status-codes';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Middleware,
  ClassMiddleware,
} from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import User from '../model/userSchema';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import { userValidationMiddleware } from '../middleware/userValidation.middleware';
import { genSaltSync, hashSync } from 'bcrypt';
import authenticationMiddleware from '../middleware/authentication.middleware';
import Role from '../model/roleSchema';
import authorizationMiddleware from '../middleware/authorization.middleware';
import Purchase, { IPurchase } from '../model/purchaseSchema';
import { hydratePurchases } from '../utils/purchase.utils';

@Controller('api/user')
@ClassMiddleware([authenticationMiddleware, authorizationMiddleware])
export default class UserController {
  @Get(':id')
  private async get(req: Request, res: Response) {
    Logger.info(req.params.id);

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const user = await User.findById(req.params.id)
        .populate({
          path: 'roles',
          populate: [
            {
              path: 'permissions',
            },
          ],
        })
        .populate('favorites')
        .select('-password');

      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(new ApiResponse('Usuario no encontrado', StatusCodes.NOT_FOUND, user));
      }

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Usuario encontrado', StatusCodes.OK, user));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  /**
   * @swagger
   * /api/user/{id}:
   *  get:
   *    summary: Obtener un usuario mediante Id
   *    description: Es necesario tener permisos de Administrador
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - user
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        description: Id del usuario que se desea obtener
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Usuario encontrado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToUser'
   *      400:
   *        description: Formato de Id incorrecto o Error en la validación
   *      404:
   *        description: Usuario no encontrado
   *      500:
   *        description: Error en el servidor
   */

  @Get('')
  private async getAll(req: Request, res: Response) {
    Logger.info(req.body, true);

    const users = await User.find({})
      .populate({
        path: 'roles',
        populate: [
          {
            path: 'permissions',
          },
        ],
      })
      .select('-password');
    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse('Usuarios encontrados', StatusCodes.OK, users));
  }

  /**
   * @swagger
   * /api/user:
   *  get:
   *    summary: Obtener todos los usuarios
   *    description: Es necesario tener permisos de Administrador
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - user
   *    responses:
   *      200:
   *        description: Usuarios encontrados
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToUsers'
   *      500:
   *        description: Error en el servidor
   */

  @Post('')
  @Middleware(userValidationMiddleware)
  private async add(req: Request, res: Response) {
    Logger.info(req.body, true);

    const salt = genSaltSync(10);
    const user = new User({
      name: req.body.name,
      surname: req.body.surname,
      username: req.body.username,
      email: req.body.email,
      password: hashSync(req.body.password, salt),
    });

    for (let roleId of req.body.roles) {
      const role = await Role.findById(roleId);
      user.roles.push(role?._id);
    }

    await user.save();

    return res
      .status(StatusCodes.CREATED)
      .json(new ApiResponse('Usuario creado', StatusCodes.CREATED, user));
  }

  /**
   * @swagger
   * /api/user:
   *  post:
   *    summary: Crear un usuario
   *    description: Es necesario tener permisos de Administrador
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - user
   *    requestBody:
   *      description: Esquema de Usuario
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/UserToCreate'
   *    responses:
   *      201:
   *        description: Usuario creado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToUser'
   *      500:
   *        description: Error en el servidor
   */

  @Put('update/:id')
  // @Middleware(userValidationMiddleware)
  private async update(req: Request, res: Response) {
    Logger.info(req.body);

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const salt = genSaltSync(10);
      const user = {
        name: req.body.name,
        surname: req.body.surname,
        username: req.body.username,
        password: hashSync(req.body.password, salt),
        email: req.body.email,
      };
      await User.findByIdAndUpdate(req.params.id, { $set: user }, { new: true });
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Usuario actualizado', StatusCodes.OK, user));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  /**
   * @swagger
   * /api/user/update/{id}:
   *  put:
   *    tags:
   *      - user
   *    summary: Actualizar usuario
   *    description: Es necesario tener permisos de Administrador
   *    security:
   *      - bearerAuth: []
   *    parameters:
   *      - in: path
   *        name: id
   *        description: Id del usuario a editar
   *        required: true
   *        schema:
   *          type: string
   *    requestBody:
   *      description: Un usuario con datos actualizados
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/UserToCreate'
   *    responses:
   *      200:
   *        description: Usuario actualizado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToUser'
   *      400:
   *        description: Formato de Id incorrecto
   *      500:
   *        description: Error en el servidor
   */

  @Delete('delete/:id')
  private async delete(req: Request, res: Response) {
    Logger.info(req.params, true);
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await User.findByIdAndDelete(req.params.id);
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Usuario eliminado', StatusCodes.OK, null));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  /**
   * @swagger
   * /api/user/delete/{id}:
   *  delete:
   *    tags:
   *      - user
   *    summary: Eliminar un usuario
   *    description: Es necesario tener permisos de Administrador
   *    security:
   *      - bearerAuth: []
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Usuario eliminado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponse'
   *      400:
   *        description: Formato de Id incorrecto
   *      500:
   *        description: Error en el servidor
   */

  @Get('report/top-five-must-purchases')
  private async getTopFiveMustPurchases(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      const access_token = req.access_token!;

      const users = await Purchase.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $project: {
            _id: 1,
            itemId: 1,
            quantity: 1,
            price: 1,
            user: 1,
            createdDate: 1,
          },
        },
        {
          $project: {
            _id: 1,
            itemId: 1,
            quantity: 1,
            price: 1,
            createdDate: 1,
            user: { $arrayElemAt: ['$user._id', 0] },
          },
        },
        {
          $sort: {
            createdDate: -1,
          },
        },
        {
          $group: {
            _id: '$user',
            purchases: {
              $push: {
                purchaseId: '$$ROOT._id',
                itemId: '$$ROOT.itemId',
                quantity: '$$ROOT.quantity',
                price: '$$ROOT.price',
                createdDate: '$$ROOT.createdDate',
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
        { $limit: 5 },
      ]);

      let hydratedUsers: any[] = [];
      if (users.length > 0) {
        hydratedUsers = await Promise.all(
          users.map(
            async (user: { _id: string; purchases: IPurchase[]; count: number }) => {
              const foundUser = await User.findById(user._id)
                .select('-password -roles -favorites -purchases')
                .lean();
              const hydratedLastPurchase = (await hydratePurchases(
                [user.purchases[0]],
                access_token,
                user._id
              ))[0];

              return {
                user: foundUser,
                lastPurchase: hydratedLastPurchase,
                count: user.count,
              };
            }
          )
        );
      }

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Usuarios encontrados', StatusCodes.OK, hydratedUsers));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/user/report/top-five-must-purchases:
   *  get:
   *    summary: Obtener top 5 de usuarios con mas compras
   *    description: Es necesario tener permisos de Administrador
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - user
   *    responses:
   *      200:
   *        description: Usuarios encontrados
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToTopFiveMustPurchases'
   *      500:
   *        description: Error en el servidor
   */
}

/**
 * @swagger
 * components:
 *  schemas:
 *    ApiResponseToUser:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              $ref: '#/components/schemas/User'
 *    ApiResponseToUsers:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/User'
 *    ApiResponseToTopFiveMustPurchases:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/TopFiveMustPurchases'
 *    User:
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
 *        password:
 *          type: string
 *        roles:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Role'
 *        favorites:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Favorite'
 *        creationDate:
 *          type: string
 *    UserToCreate:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        surname:
 *          type: string
 *        username:
 *          type: string
 *        email:
 *          type: string
 *        password:
 *          type: string
 *    TopFiveMustPurchases:
 *      type: object
 *      properties:
 *        user:
 *          $ref: '#/components/schemas/User'
 *        lastPurchase:
 *          $ref: '#/components/schemas/TopFivePurchase'
 *        count:
 *          type: integer
 *    TopFivePurchase:
 *      type: object
 *      required: [itemId, user, purchaseId, price, quantity, createdDatePurchase, hydrated]
 *      properties:
 *        itemId:
 *          type: string
 *        user:
 *          type: string
 *        purchaseId:
 *          type: string
 *        price:
 *          type: integer
 *        quantity:
 *          type: integer
 *        createdDatePurchase:
 *          type: string
 *        hydrated:
 *          $ref: '#/components/schemas/Hydrated'
 *        favoriteId:
 *          type: string
 *        comment:
 *          type: string
 *        rating:
 *          type: integer
 *          minimum: 0
 *          maximum: 10
 *        createdDateFavorite:
 *          type: string
 */
