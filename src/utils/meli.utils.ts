import meliService from '../service/meli.service';
import { hydrateFavorite } from './favorite.utils';

export const hydrateProductsWithFavorites = async (products: any[], userId: string) => {
  let hydratedProducts: any[] = [];
  if (products.length > 0) {
    hydratedProducts = await Promise.all(
      products.map(async (product: any) => {
        const { id, title, pictures, price, ..._ } = product;

        let result;

        result = {
          itemId: id,
          hydrated: {
            itemId: id,
            title,
            thumbnail: pictures[0].url,
            thumbnail_id: pictures[0].id,
            pictures,
            price,
          },
        };

        return hydrateFavorite(userId, id, result);
      })
    );
  }
  return hydratedProducts;
};

export const hydrateProduct = async (product: any, access_token: string) => {
  const response = await meliService.searchItemById(product._id, access_token);

  const { title, pictures, price, ..._ } = response;

  const result = {
    itemId: product._id,
    title,
    thumbnail: pictures[0].url,
    thumbnail_id: pictures[0].id,
    pictures,
    price,
  };

  return result;
};
