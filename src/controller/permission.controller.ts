import { StatusCodes } from 'http-status-codes';
import { Controller, Get, Post, Delete, ClassMiddleware } from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import Permission from '../model/permissionSchema';
import authMiddleware from '../middleware/auth.middleware';

@Controller('api/permission')
@ClassMiddleware(authMiddleware)
export default class PermissionController {
  @Get('')
  private async getAll(req: Request, res: Response) {
    const permissions = await Permission.find({});
    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse('Permisos encontrados', StatusCodes.OK, permissions));
  }

  /**
   * @swagger
   * /api/permission:
   *  get:
   *    summary: Obtener todos los permisos
   *    security:
   *      - cookieAuth: []
   *      - bearerAuth: []
   *    tags:
   *      - permission
   *    responses:
   *      200:
   *        description: Permisos encontrados
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToPermissions'
   *      500:
   *        description: Error en el servidor
   */

  @Post('')
  private async add(req: Request, res: Response) {
    Logger.info(req.body, true);

    const permission = new Permission({
      name: req.body.name,
      description: req.body.description,
    });

    await permission.save();

    return res
      .status(StatusCodes.CREATED)
      .json(new ApiResponse('Permiso creado', StatusCodes.CREATED, permission));
  }

  /**
   * @swagger
   * /api/permission:
   *  post:
   *    summary: Crear un permiso
   *    security:
   *      - cookieAuth: []
   *      - bearerAuth: []
   *    tags:
   *      - permission
   *    requestBody:
   *      description: Esquema de Permiso
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/PermissionToCreate'
   *    responses:
   *      201:
   *        description: Permiso creado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToPermission'
   *      500:
   *        description: Error en el servidor
   */

  @Delete('delete/:id')
  private async delete(req: Request, res: Response) {
    Logger.info(req.params, true);
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Permission.findByIdAndDelete(req.params.id);
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Permiso eliminado', StatusCodes.OK, null));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  /**
   * @swagger
   * /api/permission/delete/{id}:
   *  delete:
   *    tags:
   *      - permission
   *    summary: Eliminar un permiso
   *    security:
   *      - cookieAuth: []
   *      - bearerAuth: []
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Permiso eliminado
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
 *    ApiResponseToPermission:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              $ref: '#/components/schemas/Permission'
 *    ApiResponseToPermissions:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Permission'
 *    Permission:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *        name:
 *          type: string
 *        description:
 *          type: string
 *        creationDate:
 *          type: string
 *    PermissionToCreate:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        description:
 *          type: string
 */
