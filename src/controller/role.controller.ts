import { StatusCodes } from 'http-status-codes';
import { Controller, Get, Post, Delete, ClassMiddleware, Middleware } from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import Role from '../model/roleSchema';
import Permission from '../model/permissionSchema';
import authenticationMiddleware from '../middleware/authentication.middleware';
import authorizationMiddleware from '../middleware/authorization.middleware';

@Controller('api/role')
@ClassMiddleware(authenticationMiddleware)
export default class RoleController {
  @Get(':id')
  private async get(req: Request, res: Response) {
    Logger.info(req.params.id);

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const role = await Role.findById(req.params.id).populate('permissions');
      if (!role) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(new ApiResponse('Rol no encontrado', StatusCodes.NOT_FOUND, null));
      }

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Rol encontrado', StatusCodes.OK, role));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  /**
   * @swagger
   * /api/role/{id}:
   *  get:
   *    summary: Obtener un rol de usuario mediante Id
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - role
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        description: Id del role de usuario que se desea obtener
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Rol encontrado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToRole'
   *      400:
   *        description: Formato de Id incorrecto o Error en la validación
   *      404:
   *        description: Rol no encontrado
   *      500:
   *        description: Error en el servidor
   */

  @Get('')
  private async getAll(req: Request, res: Response) {
    const roles = await Role.find({}).populate('permissions');
    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse('Perfiles encontrados', StatusCodes.OK, roles));
  }

  /**
   * @swagger
   * /api/role:
   *  get:
   *    summary: Obtener todos los roles de usuario
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - role
   *    responses:
   *      200:
   *        description: Roles de usuario encontrados
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToRoles'
   *      500:
   *        description: Error en el servidor
   */

  @Post('')
  @Middleware(authorizationMiddleware)
  private async add(req: Request, res: Response) {
    Logger.info(req.body, true);

    const role = new Role({
      name: req.body.name,
      description: req.body.description,
    });

    for (let permissionId of req.body.permissions) {
      const per = await Permission.findById(permissionId);
      role.permissions.push(per?._id);
    }

    await role.save();

    return res
      .status(StatusCodes.CREATED)
      .json(new ApiResponse('Perfil creado', StatusCodes.CREATED, role));
  }

  /**
   * @swagger
   * /api/role:
   *  post:
   *    summary: Crear un rol de usuario
   *    description: Es necesario tener permisos de Administrador
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - role
   *    requestBody:
   *      description: Esquema de Rol de usuario
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/RoleToCreate'
   *    responses:
   *      201:
   *        description: Rol de usuario creado
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/ApiResponseToRole'
   *      500:
   *        description: Error en el servidor
   */

  @Delete('delete/:id')
  @Middleware(authorizationMiddleware)
  private async delete(req: Request, res: Response) {
    Logger.info(req.params, true);
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Role.findByIdAndDelete(req.params.id);
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Perfil eliminado', StatusCodes.OK, null));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  /**
   * @swagger
   * /api/role/delete/{id}:
   *  delete:
   *    tags:
   *      - role
   *    summary: Eliminar un rol de usuario
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
   *        description: Rol de usuario eliminado
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
 *    ApiResponseToRole:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              $ref: '#/components/schemas/Role'
 *    ApiResponseToRoles:
 *      allOf:
 *        - $ref: '#/components/schemas/ApiResponse'
 *        - type: object
 *          properties:
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Role'
 *    Role:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *        name:
 *          type: string
 *        description:
 *          type: string
 *        permissions:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Permission'
 *        creationDate:
 *          type: string
 *    RoleToCreate:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        description:
 *          type: string
 */
