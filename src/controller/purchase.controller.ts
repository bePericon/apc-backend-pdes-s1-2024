import { StatusCodes } from 'http-status-codes';
import { Controller, Get, Post, Delete, ClassMiddleware } from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import Purchase, { IPurchase } from '../model/purchaseSchema';
import User from '../model/userSchema';
import authenticationMiddleware from '../middleware/authentication.middleware';
import { hydratePurchases, makePurchase } from '../utils/purchase.utils';
import { hydrateProduct } from '../utils/meli.utils';

@Controller('api/purchase')
@ClassMiddleware(authenticationMiddleware)
export default class PurchaseController {
  @Post('')
  private async add(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      Logger.info(req.body, true);

      const access_token = req.access_token!;
      const { itemId, price, quantity } = req.body;
      const purchase = await makePurchase(
        itemId,
        req.userId as string,
        price,
        quantity,
        access_token
      );

      return res
        .status(StatusCodes.CREATED)
        .json(new ApiResponse('Compra creada', StatusCodes.CREATED, purchase));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/purchase:
   *  post:
   *    summary: Crear una compra
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - purchase
   *    requestBody:
   *      description: Esquema de Compra
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/PurchaseToCreate'
   *    responses:
   *      201:
   *        description: Compra creada
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToPurchase'
   *      500:
   *        description: Error en el servidor
   */

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

        const purchase = await Purchase.findById(req.params.id).select('-user').lean();

        if (!purchase) {
          return res
            .status(StatusCodes.NOT_FOUND)
            .json(new ApiResponse('Compra no encontrada', StatusCodes.NOT_FOUND, null));
        }

        const userId = req.userId!;
        const hydratedPurchases = await hydratePurchases(
          [purchase as IPurchase],
          access_token,
          userId
        );

        return res
          .status(StatusCodes.OK)
          .json(
            new ApiResponse('Compra encontrada', StatusCodes.OK, hydratedPurchases[0])
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
   * /api/purchase/{id}:
   *  get:
   *    summary: Obtener una compra mediante Id
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - purchase
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        description: Id de la compra que se desea obtener
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Compra encontrada
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToPurchase'
   *      400:
   *        description: Formato de Id incorrecto o Error en la validación
   *      404:
   *        description: Compra no encontrada
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

      const access_token = req.access_token!;
      const userId = req.userId!;
      const purchases = await Purchase.find({}).sort({ createdDate: 'desc' }).lean();
      const hydratedPurchases = await hydratePurchases(purchases, access_token, userId);

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse('Favoritos encontrados', StatusCodes.OK, hydratedPurchases)
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
   * /api/purchase:
   *  get:
   *    summary: Obtener todos los favoritos
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - purchase
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

  @Get('user/:id')
  private async getAllByUserId(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      Logger.info(req.params.id);
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const access_token = req.access_token!;

        const purchases = await Purchase.find({ user: req.params.id })
          .select('-user')
          .sort({ createdDate: 'asc' })
          .lean();

        const userId = req.userId!;
        const hydratedPurchases = await hydratePurchases(purchases, access_token, userId);

        return res
          .status(StatusCodes.OK)
          .json(
            new ApiResponse('Compras encontradas', StatusCodes.OK, hydratedPurchases)
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
   * /api/purchase/user/{id}:
   *  get:
   *    summary: Obtener las compras mediante el Id de un usuario
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - purchase
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        description: Id del usuario del cual se desean obtener las compras
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Compras encontradas
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToPurchases'
   *      400:
   *        description: Formato de Id incorrecto o Error en la validación
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
              purchases: req.params.id,
            },
          }
        );

        await Purchase.findByIdAndDelete(req.params.id);

        return res
          .status(StatusCodes.OK)
          .json(new ApiResponse('Compra eliminada', StatusCodes.OK, null));
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
   * /api/purchase/delete/{id}:
   *  delete:
   *    tags:
   *      - purchase
   *    summary: Eliminar una compra
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
   *        description: Compra eliminada
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponse'
   *      400:
   *        description: Formato de Id incorrecto
   *      500:
   *        description: Error en el servidor
   */

  @Get('report/top-five-best-selling-purchases')
  private async getTopFiveBestSellingPurchases(req: Request, res: Response) {
    const start = Date.now();
    try {
      req.metrics.requestCounter.inc({
        method: req.method,
        status_code: res.statusCode,
      });

      const access_token = req.access_token!;

      const purchases = await Purchase.aggregate([
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
          $group: {
            _id: '$itemId',
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

      let hydratedPurchases: any[] = [];
      if (purchases.length > 0) {
        hydratedPurchases = await Promise.all(
          purchases.map(async (res: any) => {
            const hydrated = await hydrateProduct(res, access_token);
            return {
              itemId: res._id,
              count: res.count,
              hydrated,
            };
          })
        );
      }

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Compras encontradas', StatusCodes.OK, hydratedPurchases));
    } finally {
      const responseTimeInMs = Date.now() - start;
      req.metrics.httpRequestTimer
        .labels(req.method, req.route.path, res.statusCode.toString())
        .observe(responseTimeInMs);
    }
  }

  /**
   * @swagger
   * /api/purchase/top-five-best-selling-purchases:
   *  get:
   *    summary: Obtener top 5 productos mas vendidos
   *    description: Es necesario tener permisos de Administrador
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - purchase
   *    responses:
   *      200:
   *        description: Compras encontradas
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseTopFiveBestSellingPurchases'
   *      500:
   *        description: Error en el servidor
   */
}

/**
 * @swagger
 * components:
 *  schemas:
 *    ApiResponseToPurchase:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              $ref: '#/components/schemas/Purchase'
 *    ApiResponseToPurchases:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Purchase'
 *    ApiResponseTopFiveBestSellingPurchases:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/TopFiveBestSellingPurchases'
 *    Purchase:
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
 *    PurchaseToCreate:
 *      type: object
 *      properties:
 *        user:
 *          type: string
 *        itemId:
 *          type: string
 *        price:
 *          type: integer
 *        quantity:
 *          type: integer
 *    TopFiveBestSellingPurchases:
 *      type: object
 *      properties:
 *        itemId:
 *          type: string
 *        hydrated:
 *          $ref: '#/components/schemas/Hydrated'
 *        count:
 *          type: integer
 */
