import axios from "axios";

import { API_URL } from "../config/api";

export const purchaseApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type PurchaseListItem = {
  PurchaseID: number;
  PurchaseNo: string;
  PurchaseDate: string;
  SupplierName: string;
  TotalItems: number;
  TotalAmount: number;
  Status: "Completed" | "Cancelled" | "Pending" | string;
  PaymentStatus: "Paid" | "Partial" | "Refunded" | string;
};

export type PurchaseFilters = {
  date_from?: string;
  date_to?: string;
  supplier_id?: number;
  status?: string;
};

export const getPurchases = async (filters: PurchaseFilters = {}): Promise<PurchaseListItem[]> => {
  const res = await purchaseApi.get("/purchases/", { params: filters });
  return res.data;
};

export const deletePurchase = async (id: number) => {
  const res = await purchaseApi.delete(`/purchases/${id}`);
  return res.data;
};