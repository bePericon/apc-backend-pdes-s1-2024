import Purchase, { IPurchase } from '../model/purchaseSchema';
import User from '../model/userSchema';
import meliService from '../service/meli.service';
import { hydrateFavorite } from './favorite.utils';

export const hydratePurchases = async (
  purchases: IPurchase[],
  access_token: string,
  userId: string
) => {
  let hydratedPurchases: any[] = [];
  if (purchases.length > 0) {
    const response = await meliService.searchItemsByIds(
      purchases.map((p) => p.itemId),
      access_token
    );

    hydratedPurchases = await Promise.all(
      purchases.map(async (purchase: IPurchase) => {
        const { _id, createdDate, ...restPurchase } = purchase;

        const { body } = response.find(({ body }: any) => {
          return purchase.itemId === body.id;
        });
        const { id, title, pictures, price, ..._ } = body;

        const result = {
          purchaseId: _id,
          createdDatePurchase: createdDate,
          ...restPurchase,
          hydrated: {
            itemId: id,
            title,
            thumbnail: pictures[0].url,
            thumbnail_id: pictures[0].id,
            pictures,
            price,
          },
        };

        return await hydrateFavorite(userId, id, result);
      })
    );
  }
  return hydratedPurchases;
};

export const makePurchase = async (
  itemId: string,
  userId: string,
  newPrice: number,
  newQuantity: number,
  access_token: string
) => {
  const user = await User.findById(userId);

  const newPurchase = new Purchase({
    user: userId,
    itemId: itemId,
    price: newPrice,
    quantity: newQuantity,
  });

  const savedPurchase = await newPurchase.save();

  user?.purchases.push(savedPurchase?._id);
  await user?.save();

  const finalPurchase = await Purchase.findById(savedPurchase?._id).lean();
  const hydratedPurchases = await hydratePurchases(
    [finalPurchase as IPurchase],
    access_token,
    userId
  );

  return hydratedPurchases[0];
};
