import { StatusCodes } from 'http-status-codes';
import { Controller, Get, Post, Delete, Put, ClassMiddleware } from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import Favorite, { IFavorite } from '../model/favoriteSchema';
import User from '../model/userSchema';
import authMiddleware from '../middleware/auth.middleware';
import meliService from '../service/meli.service';
import { PList, orderList } from '../utils/misc';

@Controller('api/favorite')
@ClassMiddleware(authMiddleware)
export default class FavoriteController {
  @Get(':id')
  private async get(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      Logger.info(req.params.id);

      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const access_token = req.access_token!;

        const favorite = await Favorite.findById(req.params.id).select('-user').lean();

        if (!favorite) {
          return res
            .status(StatusCodes.NOT_FOUND)
            .json(new ApiResponse('Favorito no encontrado', StatusCodes.NOT_FOUND, null));
        }

        const response = await meliService.searchItemById(req.params.id, access_token);
        const { title, pictures, price, ..._ } = response;
        const { _id, ...restFavorite } = favorite;

        const result = {
          favoriteId: _id,
          ...restFavorite,
          title,
          thumbnail: pictures[0].url,
          thumbnail_id: pictures[0].id,
          pictures,
          price,
          isFavorite: true,
        };

        return res
          .status(StatusCodes.OK)
          .json(new ApiResponse('Favorito encontrado', StatusCodes.OK, result));
      }

      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/favorite/{id}:
   *  get:
   *    summary: Obtener un item favorito mediante Id
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - favorite
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        description: Id del item favorito que se desea obtener
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Favorito encontrado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToFavorite'
   *      400:
   *        description: Formato de Id incorrecto o Error en la validación
   *      404:
   *        description: Favorito no encontrado
   *      500:
   *        description: Error en el servidor
   */

  @Get('user/:id')
  private async getAllFavoritesByUserId(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      Logger.info(req.params.id);
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const access_token = req.access_token!;

        const favorites = await Favorite.find({ user: req.params.id })
          .select('-user')
          .sort({ createdDate: 'asc' })
          .lean();

        let hydratedFavorites: any[] = [];
        if (favorites.length > 0) {
          const response = await meliService.searchItemsByIds(
            favorites.map((fav) => fav.itemId),
            access_token
          );

          hydratedFavorites = favorites.map((fav: IFavorite) => {
            const { _id, ...restFavorite } = fav;

            const { body } = response.find(({ body }: any) => {
              return fav.itemId === body.id;
            });
            const { id, title, pictures, price, ..._ } = body;

            const result = {
              favoriteId: _id,
              ...restFavorite,
              title,
              thumbnail: pictures[0].url,
              thumbnail_id: pictures[0].id,
              pictures,
              price,
              isFavorite: true,
            };

            return result;
          });
        }
        return res
          .status(StatusCodes.OK)
          .json(
            new ApiResponse('Favoritos encontrados', StatusCodes.OK, hydratedFavorites)
          );
      }

      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/favorite/user/{id}:
   *  get:
   *    summary: Obtener los items favoritos de un usuario mediante Id del usuario
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - favorite
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        description: Id del usuario del cual se desean obtener los favoritos
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Favoritos encontrados
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToFavorites'
   *      400:
   *        description: Formato de Id incorrecto o Error en la validación
   *      500:
   *        description: Error en el servidor
   */

  @Post('')
  private async add(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      Logger.info(req.body, true);

      const user = await User.findById(req.body.userId);

      const favorite = new Favorite({
        user: user?._id,
        itemId: req.body.itemId,
        rating: req.body.rating,
        comment: req.body.comment,
      });

      const fav = await favorite.save();

      user?.favorites.push(fav?._id);
      await user?.save();

      return res
        .status(StatusCodes.CREATED)
        .json(new ApiResponse('Favorito creado', StatusCodes.CREATED, favorite));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/favorite:
   *  post:
   *    summary: Crear un favorito
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - favorite
   *    requestBody:
   *      description: Esquema de Favorito
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/FavoriteToCreate'
   *    responses:
   *      201:
   *        description: Favorito creado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToFavorite'
   *      500:
   *        description: Error en el servidor
   */

  @Put('update/:id')
  private async update(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      Logger.info(req.params, true);

      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const favorite = {
          rating: req.body.rating,
          comment: req.body.comment,
        };
        await Favorite.findByIdAndUpdate(
          req.params.id,
          { $set: favorite },
          { new: true }
        );
        return res
          .status(StatusCodes.OK)
          .json(new ApiResponse('Favorito actualizado', StatusCodes.OK, favorite));
      }

      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/favorite/update/{id}:
   *  put:
   *    tags:
   *      - favorite
   *    summary: Actualizar favorito
   *    security:
   *      - bearerAuth: []
   *    parameters:
   *      - in: path
   *        name: id
   *        description: Id del favorito a editar
   *        required: true
   *        schema:
   *          type: string
   *    requestBody:
   *      description: Un favorito con datos actualizados
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/FavoriteToCreate'
   *    responses:
   *      200:
   *        description: Favorito actualizado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToFavorite'
   *      400:
   *        description: Formato de Id incorrecto
   *      500:
   *        description: Error en el servidor
   */

  @Delete('delete/:id')
  private async delete(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      Logger.info(req.params, true);
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        await User.updateOne(
          { _id: req.userId },
          {
            $pull: {
              favorites: req.params.id,
            },
          }
        );

        await Favorite.findByIdAndDelete(req.params.id);
        return res
          .status(StatusCodes.OK)
          .json(new ApiResponse('Favorito eliminado', StatusCodes.OK, null));
      }

      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/favorite/delete/{id}:
   *  delete:
   *    tags:
   *      - favorite
   *    summary: Eliminar un favorito
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
   *        description: Favorito eliminado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponse'
   *      400:
   *        description: Formato de Id incorrecto
   *      500:
   *        description: Error en el servidor
   */

  @Get('')
  private async getAll(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      const favorites = await Favorite.find({});
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Favoritos encontrados', StatusCodes.OK, favorites));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/favorite:
   *  get:
   *    summary: Obtener todos los favoritos
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - favorite
   *    responses:
   *      200:
   *        description: Favoritos encontrados
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToFavorites'
   *      500:
   *        description: Error en el servidor
   */

  @Get('report/topfive')
  private async getTopFive(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      const access_token = req.access_token!;

      const favorites = await Favorite.aggregate([
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
            itemId: 1,
            comment: 1,
            rating: 1,
            user: {
              $map: {
                input: '$user',
                in: {
                  _id: '$$this._id',
                  name: '$$this.name',
                  surname: '$$this.surname',
                  username: '$$this.username',
                  email: '$$this.email',
                },
              },
            },
          },
        },
        {
          $project: {
            itemId: 1,
            comment: 1,
            rating: 1,
            user: { $arrayElemAt: ['$user', 0] },
          },
        },
        {
          $group: {
            _id: '$itemId',
            items: { $push: '$$ROOT' },
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

      let hydratedFavorites: any[] = [];
      if (favorites.length > 0) {
        const response = await meliService.searchItemsByIds(
          favorites.map((fav) => fav._id),
          access_token
        );

        const orderedList = orderList(
          response.map((r: any) => r.body),
          favorites.map((fav) => fav._id)
        );

        hydratedFavorites = favorites.map(
          (fav: { _id: string; items: IFavorite[]; count: number }) => {
            const { title, pictures, price } = orderedList.find(
              (ol) => ol.id === fav._id
            ) as PList;

            const filteredItems = fav.items.filter((item: any) => item.rating);
            const allHaveRating = filteredItems.length === fav.count;

            let averageRating = 0;
            if (!allHaveRating) {
              filteredItems.forEach((item: any) => {
                if (item.rating > averageRating) averageRating = item.rating;
              });
            } else {
              const initialRating = 0;
              const sumRating = filteredItems.reduce(
                (acc, current) => acc + current.rating,
                initialRating
              );
              averageRating = sumRating / fav.count;
            }

            const result = {
              ...fav,
              averageRating,
              hydrated: {
                title,
                thumbnail: pictures[0].url,
                thumbnail_id: pictures[0].id,
                pictures,
                price,
              },
            };

            return result;
          }
        );
      }

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse('Favoritos encontrados', StatusCodes.OK, hydratedFavorites)
        );
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/favorite/report/topfive:
   *  get:
   *    summary: Obtener top 5 de favoritos
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - favorite
   *    responses:
   *      200:
   *        description: Favoritos encontrados
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToTopFiveFavorites'
   *      500:
   *        description: Error en el servidor
   */
}

/**
 * @swagger
 * components:
 *  schemas:
 *    ApiResponseToFavorite:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              $ref: '#/components/schemas/Favorite'
 *    ApiResponseToFavorites:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Favorite'
 *    ApiResponseToTopFiveFavorites:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/TopFiveFavorites'
 *    Favorite:
 *      type: object
 *      properties:
 *        itemId:
 *          type: string
 *        pictures:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Picture'
 *        price:
 *          type: string
 *        title:
 *          type: string
 *        thumbnail:
 *          type: string
 *        thumbnail_id:
 *          type: string
 *        favoriteId:
 *          type: string
 *        user:
 *          type: string
 *        comment:
 *          type: string
 *        rating:
 *          type: integer
 *          minimum: 0
 *          maximum: 10
 *        creationDate:
 *          type: string
 *        isFavorite:
 *          type: boolean
 *    FavoriteToCreate:
 *      type: object
 *      properties:
 *        user:
 *          type: string
 *        itemId:
 *          type: string
 *        comment:
 *          type: string
 *        rating:
 *          type: integer
 *          minimum: 0
 *          maximum: 10
 *    TopFiveFavorites:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *        items:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/ItemTopFive'
 *        count:
 *          type: integer
 *        averageRating:
 *          type: integer
 *          minimum: 0
 *          maximum: 10
 *        hydrated:
 *          $ref: '#/components/schemas/HydratedFavorite'
 *    HydratedFavorite:
 *      type: object
 *      properties:
 *        title:
 *          type: string
 *        thumbnail:
 *          type: string
 *        thumbnail_id:
 *          type: string
 *        pictures:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Picture'
 *        price:
 *          type: string
 *    ItemTopFive:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *        itemId:
 *          type: string
 *        user:
 *          $ref: '#/components/schemas/UserItemTopFive'
 *    UserItemTopFive:
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
 */
