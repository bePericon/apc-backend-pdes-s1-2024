export const objectToUrlParams = (obj: any) => {
  const params = [];

  for (const key in obj) {
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
  }

  return params.join('&');
};

export interface PList {
  id: string;
  title: string;
  pictures: any;
  price: number;
}

export function orderList(principalList: PList[], secondaryList: string[]) {
  let returnList: PList[] = [];

  secondaryList.forEach((id) => {
    const found = principalList.find((value) => value.id === id) as PList;
    returnList.push(found);
  });

  return returnList;
}
