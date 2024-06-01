import { ClassMiddleware, Controller, Get } from '@overnightjs/core';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import Favorite, { IFavorite } from '../model/favoriteSchema';
import meliService from '../service/meli.service';

@Controller('api/meli')
@ClassMiddleware(authMiddleware)
export default class MeliController {
  @Get('search')
  private async search(req: Request, res: Response) {
    Logger.info(req.query, true);

    const access_token = req.access_token!;

    const response = await meliService.searchQuery(req.query, access_token);

    const results = await Promise.all(
      response.results.map(async (res: any) => {
        const { thumbnail, thumbnail_id } = res;
        const found = await meliService.searchItemById(res.id, access_token);
        const { id, title, pictures, price } = found;
        let result;
        const favorite = await Favorite.findOne({
          user: req.userId,
          itemId: id,
        })
          .select('-user')
          .lean();

        result = { itemId: id, title, thumbnail, thumbnail_id, pictures, price };

        if (favorite) {
          const { _id, ...restFavorite } = favorite as IFavorite;
          result = {
            ...result,
            ...restFavorite,
            favoriteId: _id,
            isFavorite: true,
          };
        }

        return result;
      })
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse('Búsqueda finalizada', StatusCodes.OK, { ...response, results })
      );
  }

  /**
   * @swagger
   * /api/meli/search:
   *   get:
   *     summary: Buscar items en Meli
   *     security:
   *       - bearerAuth: []
   *     tags:
   *       - meli
   *     parameters:
   *       - name: q
   *         in: query
   *         description: Palabra clave a buscar en el titulo de los items
   *         required: true
   *         schema:
   *           type: string
   *       - name: offset
   *         in: query
   *         description: Número que identifica la pagina actual, empezando desde 0 (cero)
   *         required: true
   *         schema:
   *           type: integer
   *       - name: limit
   *         in: query
   *         description: Cantidad de items por página
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Búsqueda finalizada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponseToItems'
   *       500:
   *         description: Error en el servidor
   */

  @Get('item/:id')
  private async itemById(req: Request, res: Response) {
    Logger.info(req.params.id);

    const access_token = req.access_token!;

    const response = await meliService.searchItemById(req.params.id, access_token);
    const { id, title, pictures, price, ..._ } = response;

    let result;
    const favorite = await Favorite.findOne({
      user: req.userId,
      itemId: req.params.id,
    })
      .select('-user')
      .lean();

    result = {
      itemId: id,
      title,
      thumbnail: pictures[0].url,
      thumbnail_id: pictures[0].id,
      pictures,
      price,
    };

    if (favorite) {
      const { _id, ...restFavorite } = favorite as IFavorite;
      result = {
        ...result,
        ...restFavorite,
        itemId: id,
        favoriteId: _id,
        isFavorite: true,
      };
    }

    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse('Búsqueda finalizada', StatusCodes.OK, result));
  }

  /**
   * @swagger
   * /api/meli/item/{id}:
   *   get:
   *     summary: Buscar item por Id en Meli
   *     security:
   *      - bearerAuth: []
   *     tags:
   *       - meli
   *     parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *     responses:
   *       200:
   *         description: Búsqueda finalizada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponseToItem'
   *       500:
   *         description: Error en el servidor
   */
}

/**
 * @swagger
 * components:
 *  schemas:
 *    ApiResponseToItem:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              $ref: '#/components/schemas/Item'
 *    ApiResponseToItems:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Item'
 *    Item:
 *      type: object
 *      required: [itemId, pictures, price, title, thumbnail, thumbnail_id]
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
 *    Picture:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        url:
 *          type: string
 */
