import {OrderInstance} from "../models/order.model.js";

export type AdminOrdersServiceResult = {
  orders: OrderInstance[];
  total: number;
  latestMap: Map<number, string>;
  countMap: Map<number, number>;
};
