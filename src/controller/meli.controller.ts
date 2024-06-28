import { ClassMiddleware, Controller, Get } from '@overnightjs/core';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware';
import meliService from '../service/meli.service';
import { hydrateProductsWithFavorites } from '../utils/meli.utils';

@Controller('api/meli')
@ClassMiddleware(authenticationMiddleware)
export default class MeliController {
  @Get('search')
  private async search(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });
      Logger.info(req.query, true);

      const access_token = req.access_token!;

      const { paging, results } = await meliService.searchQuery(req.query, access_token);
      const products = await Promise.all(
        results.map(async (res: any) => {
          const found = await meliService.searchItemById(res.id, access_token);
          return found;
        })
      );

      const hydratedProducts = await hydrateProductsWithFavorites(
        products,
        req.userId as string
      );

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse('Búsqueda finalizada', StatusCodes.OK, {
            paging,
            results: hydratedProducts,
          })
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
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });
      Logger.info(req.params.id);

      const access_token = req.access_token!;

      const product = await meliService.searchItemById(req.params.id, access_token);
      const hydratedProducts = await hydrateProductsWithFavorites(
        [product],
        req.userId as string
      );

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse('Búsqueda finalizada', StatusCodes.OK, hydratedProducts[0])
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
 *      required: [itemId, user, hydrated]
 *      properties:
 *        itemId:
 *          type: string
 *        user:
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
 *    Hydrated:
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
 *          type: integer
 *    Picture:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        url:
 *          type: string
 */
