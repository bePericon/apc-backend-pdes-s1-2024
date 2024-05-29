import { StatusCodes } from 'http-status-codes';
import { Controller, Get, Post, Delete, Put, ClassMiddleware } from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import Favorite from '../model/favoriteSchema';
import User from '../model/userSchema';
import authMiddleware from '../middleware/auth.middleware';
import meliService from '../service/meli.service';

@Controller('api/favorite')
@ClassMiddleware(authMiddleware)
export default class FavoriteController {
  @Get(':id')
  private async get(req: Request, res: Response) {
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
      const result = {
        ...favorite,
        title,
        thumbnail: pictures[0].url,
        thumbnail_id: pictures[0].id,
        pictures,
        price,
      };

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Favorito encontrado', StatusCodes.OK, result));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
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
    Logger.info(req.params.id);
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const access_token = req.access_token!;

      const favorites = await Favorite.find({ user: req.params.id })
        .select('-user')
        .lean();

      const response = await meliService.searchItemsByIds(
        favorites.map((fav) => fav.itemId),
        access_token
      );

      const hydratedFavorites = response.map(({ body }: any) => {
        const { title, pictures, price, ..._ } = body;

        const fav = favorites.find((f) => f.itemId === body.id);

        const result = {
          ...fav,
          title,
          thumbnail: pictures[0].url,
          thumbnail_id: pictures[0].id,
          pictures,
          price,
        };

        return result;
      });

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse('Favoritos encontrados', StatusCodes.OK, hydratedFavorites)
        );
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
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
    Logger.info(req.params, true);

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const favorite = {
        rating: req.body.rating,
        comment: req.body.comment,
      };
      await Favorite.findByIdAndUpdate(req.params.id, { $set: favorite }, { new: true });
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Favorito actualizado', StatusCodes.OK, favorite));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
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
 *    Favorite:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *        user:
 *          type: string
 *        itemId:
 *          type: string
 *        comment:
 *          type: string
 *        rating:
 *          type: integer
 *          minimum: 0
 *          maximum: 5
 *        creationDate:
 *          type: string
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
 *          maximum: 5
 */
