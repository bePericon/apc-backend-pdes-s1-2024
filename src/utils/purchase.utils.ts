import { IPurchase } from "../model/purchaseSchema";
import meliService from "../service/meli.service";


export const hydratePurchases = async (purchases: IPurchase[], access_token: string) => {
    let hydratedPurchases: any[] = [];
    if (purchases.length > 0) {
      const response = await meliService.searchItemsByIds(
        purchases.map((fav) => fav.itemId),
        access_token
      );

      hydratedPurchases = purchases.map((purchase: IPurchase) => {
        const { _id, ...restPurchase } = purchase;

        const { body } = response.find(({ body }: any) => {
          return purchase.itemId === body.id;
        });
        const { title, pictures, price, ..._ } = body;

        const result = {
          purchaseId: _id,
          ...restPurchase,
          hydrated: {
            title,
            thumbnail: pictures[0].url,
            thumbnail_id: pictures[0].id,
            pictures,
            price,
          }
        };

        return result;
      });
    }
    return hydratedPurchases
}