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
    const user_id = req.cookies['user_id'];

    const response = await this.searchItemById(req.params.id, access_token);
    const { id, title, pictures, price, ..._ } = response;

    let result;
    const favorite = await Favorite.findOne({
      user: user_id,
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
