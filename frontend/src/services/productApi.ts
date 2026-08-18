import axios from "axios";

const API_URL = "http://192.168.15.243:8000";

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
