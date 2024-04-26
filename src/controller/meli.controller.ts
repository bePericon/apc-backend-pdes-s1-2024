import { ClassMiddleware, Controller, Get } from '@overnightjs/core';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import axios from 'axios';
import { objectToUrlParams } from '../utils/misc';
import authMiddleware from '../middleware/auth.middleware';
import Favorite from '../model/favoriteSchema';

@Controller('api/meli')
@ClassMiddleware(authMiddleware)
export default class MeliController {
  @Get('search')
  private async search(req: Request, res: Response) {
    Logger.info(req.query, true);

    const access_token = req.cookies['access_token'];

    const response = await this.searchQuery(req.query, access_token);

    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse('Búsqueda finalizada', StatusCodes.OK, response));
  }

  /**
   * @swagger
   * /api/meli/search:
   *   get:
   *     summary: Buscar items en Meli
   *     security:
   *       - cookieAuth: []
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

  private async searchQuery(query: any, access_token: string) {
    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };

    const { data } = await axios.get(
      `https://api.mercadolibre.com/sites/MLA/search?${objectToUrlParams(
        query
      )}&status=active`,
      config
    );

    return data;
  }

  @Get('item/:id')
  private async itemById(req: Request, res: Response) {
    Logger.info(req.params.id);

    const access_token = req.cookies['access_token'];

    const response = await this.searchItemById(req.params.id, access_token);
    const { id, title, pictures, price, ..._ } = response;

    let result;
    const favorite = await Favorite.findOne({
      user: req.userId,
      itemId: req.params.id,
    }).exec();

    if (favorite) {
      result = { id, title, pictures, price, isFavorite: favorite };
    } else {
      result = { id, title, pictures, price };
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
   *       - cookieAuth: []
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

  private async searchItemById(id: string, access_token: string) {
    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };

    const { data } = await axios.get(`https://api.mercadolibre.com/items/${id}`, config);

    return data;
  }
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
 *              $ref: '#/components/schemas/ItemById'
 *    ApiResponseToItems:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/ItemsSearch'
 *    ItemsSearch:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        title:
 *          type: string
 *        thumbnail:
 *          type: string
 *    ItemById:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        title:
 *          type: string
 *        pictures:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Picture'
 *        price:
 *          type: string
 *    Picture:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        url:
 *          type: string
 */
