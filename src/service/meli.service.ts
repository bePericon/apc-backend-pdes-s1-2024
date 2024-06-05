import axios, { AxiosInstance } from 'axios';
import { objectToUrlParams } from '../utils/misc';

class MeliService {
  protected instance: AxiosInstance;
  protected readonly baseURL: string;

  constructor() {
    this.baseURL = 'https://api.mercadolibre.com';
    this.instance = axios.create({ baseURL: 'https://api.mercadolibre.com' });
  }

  public async searchItemById(id: string, access_token: string) {
    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };

    const { data } = await axios.get(`${this.baseURL}/items/${id}`, config);

    return data;
  }

  public async searchItemsByIds(ids: string[], access_token: string) {
    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };

    const { data } = await axios.get(
      `${this.baseURL}/items?ids=${ids.toString()}&attributes=id,title,pictures,price`,
      config
    );

    return data;
  }

  public async searchQuery(query: any, access_token: string) {
    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };

    const { data } = await axios.get(
      `${this.baseURL}/sites/MLA/search?${objectToUrlParams(query)}&status=active`,
      config
    );

    return data;
  }
}

export default new MeliService();
