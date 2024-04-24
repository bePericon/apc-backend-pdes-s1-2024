import { StatusCodes } from 'http-status-codes';
import { Controller, Get, Post, Delete, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import Logger from 'jet-logger';
import ApiResponse from '../class/ApiResponse';
import mongoose from 'mongoose';
import Favorite from '../model/favoriteSchema';
import User from '../model/userSchema';

@Controller('api/favorite')
export default class FavoriteController {
  @Get(':id')
  private async get(req: Request, res: Response) {
    Logger.info(req.params.id);

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const favorite = await Favorite.findById(req.params.id);
      if (!favorite) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(new ApiResponse('Favorito no encontrado', StatusCodes.NOT_FOUND, null));
      }

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Favorito encontrado', StatusCodes.OK, favorite));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

  @Get('user/:id')
  private async getAllFavoritesByUserId(req: Request, res: Response) {
    Logger.info(req.params.id);
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const favorites = await Favorite.find({ user: req.params.id }).select('-user');
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Favoritos encontrados', StatusCodes.OK, favorites));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }

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

  @Delete('delete/:id')
  private async delete(req: Request, res: Response) {
    Logger.info(req.params, true);
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Favorite.findByIdAndDelete(req.params.id);
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse('Favorito eliminado', StatusCodes.OK, null));
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(new ApiResponse('Formato de Id incorrecto', StatusCodes.BAD_REQUEST, null));
  }
}
