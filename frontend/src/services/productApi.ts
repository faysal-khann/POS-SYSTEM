import axios from "axios";

import { API_URL } from "../config/api";

export const productApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Lookup = { id: number; name: string };

export type ProductInput = {
  ProductName: string;
  Barcode?: string;
  CategoryID: number;
  BrandID?: number;
  UnitID: number;
  PurchasePrice?: number;
  SalePrice?: number;
  TaxPercent?: number;
  OpeningStock?: number;
  ReorderLevel?: number;
  ImageUrl?: string;
  Status?: "Active" | "Inactive";
  Description?: string;
};

export type Product = ProductInput & {
  ProductID: number;
  ProductCode: string;
  CurrentStock: number;
  categoryName?: string | null;
  brandName?: string | null;
};

export const getProducts = async (): Promise<Product[]> => {
  const res = await productApi.get("/products/");
  return res.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const res = await productApi.get(`/products/${id}`);
  return res.data;
};

export const createProduct = async (data: ProductInput) => {
  const res = await productApi.post("/products/", data);
  return res.data;
};

export const updateProduct = async (id: number, data: ProductInput) => {
  const res = await productApi.put(`/products/${id}`, data);
  return res.data;
};
export const deleteProduct = async (productId: number) => {
  const response = await productApi.delete(`/products/${productId}`);
  return response.data;
};
export const getCategories = async (): Promise<Lookup[]> =>
  (await productApi.get("/products/categories")).data;

export const getBrands = async (): Promise<Lookup[]> =>
  (await productApi.get("/products/brands")).data;

export const getUnits = async (): Promise<Lookup[]> =>
  (await productApi.get("/products/units")).data;

export const getNextProductCode = async (): Promise<string> =>
  (await productApi.get("/products/next-code")).data.ProductCode;


export type BulkPriceUpdateResult = {
  ProductID: number;
  ProductCode: string;
  ProductName: string;
  OldPrice: number;
  NewPrice: number;
};

export const bulkPriceUpdate = async (
  productIds: number[],
  updateType: "percentage" | "fixed",
  value: number,
  priceField: "SalePrice" | "PurchasePrice" = "SalePrice"
): Promise<BulkPriceUpdateResult[]> => {
  const res = await productApi.post("/products/bulk-price-update", {
    ProductIDs: productIds,
    UpdateType: updateType,
    Value: value,
    PriceField: priceField,
  });
  return res.data;
};

export const getProductByBarcode = async (barcode: string): Promise<Product> => {
  const res = await productApi.get(`/products/by-barcode/${barcode}`);
  return res.data;
};

export const uploadProductImage = async (uri: string): Promise<string> => {
  const filename = uri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: filename,
    type,
  } as any);

  const res = await productApi.post("/products/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Prepend the base API URL so the stored value is a full, usable URL
  return `${API_URL}${res.data.url}`;
};

