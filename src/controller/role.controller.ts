import { StatusCodes } from 'http-status-codes';
import { Controller, Get, Post, Delete } from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import Role from '../model/roleSchema';
import Permission from '../model/permissionSchema';

@Controller('api/role')
export default class RoleController {
  @Get(':id')
  private async get(req: Request, res: Response) {
    Logger.info(req.params.id);

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const role = await Role.findById(req.params.id).populate('permissions');
      if (!role) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(new ApiResponse('Perfil no encontrado', StatusCodes.NOT_FOUND, null));
      }

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Perfil encontrado', StatusCodes.OK, role));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  @Get('')
  private async getAll(req: Request, res: Response) {
    const roles = await Role.find({}).populate('permissions');
    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse('Perfiles encontrados', StatusCodes.OK, roles));
  }

  @Post('')
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

  @Delete('delete/:id')
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
}
