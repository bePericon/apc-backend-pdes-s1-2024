import Favorite, { IFavorite } from '../model/favoriteSchema';
import meliService from '../service/meli.service';

export const hydrateFavorite = async (userId: string, itemId: string, product: any) => {
  const favorite = await Favorite.findOne({
    user: userId,
    itemId: itemId,
  }).lean();

  let result: any;
  if (favorite) {
    const { _id, createdDate, ...restFavorite } = favorite as IFavorite;
    result = {
      favoriteId: _id,
      createdDateFavorite: createdDate,
      ...restFavorite,
      ...product,
    };
  } else result = product;

  return result;
};

export const hydrateFavorites = async (
  favorites: IFavorite[],
  access_token: string
) => {
  let hydratedFavorites: any[] = [];
  if (favorites.length > 0) {
    const response = await meliService.searchItemsByIds(
      favorites.map((p) => p.itemId),
      access_token
    );

    hydratedFavorites = favorites.map((favorite: IFavorite) => {
      const { _id, createdDate, ...restFavorite } = favorite;

      const { body } = response.find(({ body }: any) => {
        return favorite.itemId === body.id;
      });
      const { id, title, pictures, price, ..._ } = body;

      const result = {
        favoriteId: _id,
        createdDateFavorite: createdDate,
        ...restFavorite,
        hydrated: {
          itemId: id,
          title,
          thumbnail: pictures[0].url,
          thumbnail_id: pictures[0].id,
          pictures,
          price,
        },
      };

      return result;
    });
  }
  return hydratedFavorites;
};
