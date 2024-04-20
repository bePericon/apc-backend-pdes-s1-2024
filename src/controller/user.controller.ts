import { StatusCodes } from 'http-status-codes';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Middleware,
  ClassMiddleware,
} from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import User from '../model/userSchema';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import userValidationMiddleware from '../middleware/userValidation.middleware';
import { genSaltSync, hashSync } from 'bcrypt';
import authMiddleware from '../middleware/auth.middleware';
import Role from '../model/roleSchema';

@Controller('api/user')
@ClassMiddleware(authMiddleware)
export default class UserController {
  @Get(':id')
  private async get(req: Request, res: Response) {
    Logger.info(req.params.id);

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const user = await User.findById(req.params.id)
        .populate({
          path: 'roles',
          populate: [
            {
              path: 'permissions',
            },
          ],
        })
        .populate('favorites')
        .select('-password');

      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(new ApiResponse('Usuario no encontrado', StatusCodes.NOT_FOUND, user));
      }

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Usuario encontrado', StatusCodes.OK, user));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  @Get('')
  private async getAll(req: Request, res: Response) {
    Logger.info(req.body, true);

    const users = await User.find({})
      .populate({
        path: 'roles',
        populate: [
          {
            path: 'permissions',
          },
        ],
      })
      .select('-password');
    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse('Usuarios encontrados', StatusCodes.OK, users));
  }

  @Post('')
  @Middleware(userValidationMiddleware)
  private async add(req: Request, res: Response) {
    Logger.info(req.body, true);

    const salt = genSaltSync(10);
    const user = new User({
      name: req.body.name,
      surname: req.body.surname,
      username: req.body.username,
      email: req.body.email,
      password: hashSync(req.body.password, salt),
    });

    for (let roleId of req.body.roles) {
      const role = await Role.findById(roleId);
      user.roles.push(role?._id);
    }

    await user.save();

    return res
      .status(StatusCodes.CREATED)
      .json(new ApiResponse('Usuario creado', StatusCodes.CREATED, user));
  }

  @Put('update/:id')
  @Middleware(userValidationMiddleware)
  private async update(req: Request, res: Response) {
    Logger.info(req.body);

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const user = {
        name: req.body.name,
        surname: req.body.surname,
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
      };
      await User.findByIdAndUpdate(req.params.id, { $set: user }, { new: true });
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Usuario actualizado', StatusCodes.OK, user));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  @Delete('delete/:id')
  private async delete(req: Request, res: Response) {
    Logger.info(req.params, true);
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await User.findByIdAndDelete(req.params.id);
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Usuario eliminado', StatusCodes.OK, null));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }
}
