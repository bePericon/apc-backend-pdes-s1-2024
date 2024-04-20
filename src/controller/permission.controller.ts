import { StatusCodes } from 'http-status-codes';
import { Controller, Get, Post, Delete } from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import Permission from '../model/permissionSchema';

@Controller('api/permission')
export default class PermissionController {
  @Get('')
  private async getAll(req: Request, res: Response) {
    const permissions = await Permission.find({});
    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse('Permisos encontrados', StatusCodes.OK, permissions));
  }

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
}
