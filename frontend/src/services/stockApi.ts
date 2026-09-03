import axios from "axios";
import { API_URL } from "../config/api";

export const stockApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type StockListItem = {
  ProductStockID: number;
  ProductCode: string;
  ProductName: string;
  CategoryID: number | null;
  CategoryName: string | null;
  BrandID: number | null;
  BrandName: string | null;
  UnitShortName: string | null;
  BranchID: number;
  BranchName: string;
  CurrentStock: number;
  StockValue: number;
  Status: "In Stock" | "Low Stock";
};
export type StockFilters = {
  search?: string;
  category_id?: number;
  brand_id?: number;
  branch_id?: number;
};

export const getStock = async (filters: StockFilters = {}): Promise<StockListItem[]> => {
  const res = await stockApi.get("/stock/", { params: filters });
  return res.data;
};

export type StockDetail = {
  ProductStockID: number;
  ProductID: number;
  ProductCode: string;
  ProductName: string;
  CategoryName: string | null;
  BrandName: string | null;
  UnitShortName: string | null;
  Barcode: string | null;
  BranchID: number;
  BranchName: string;
  CurrentStock: number;
  ReservedStock: number;
  ReorderLevel: number;
  MaximumLevel: number;
  PurchasePrice: number;
  StockValue: number;
  Status: "In Stock" | "Low Stock";
  LastUpdatedAt: string;
  ImageUrl: string | null;
};

export type StockUpdateInput = {
  BranchID: number;
  CurrentStock: number;
  ReservedStock?: number;
  ReorderLevel?: number;
  MaximumLevel?: number;
};

export const getStockDetail = async (id: number): Promise<StockDetail> => {
  const res = await stockApi.get(`/stock/${id}`);
  return res.data;
};

export const updateStock = async (id: number, data: StockUpdateInput): Promise<StockDetail> => {
  const res = await stockApi.put(`/stock/${id}`, data);
  return res.data;
};