import axios from "axios";

const API_URL = "http://192.168.15.243:8000";

export const brandApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Brand = {
  BrandID: number;
  BrandName: string;
  Description?: string;
  Status: "Active" | "Inactive";
  CreatedAt: string;
};

export type BrandInput = {
  BrandName: string;
  Description?: string;
  Status?: "Active" | "Inactive";
};

export const getBrandList = async (): Promise<Brand[]> => {
  const res = await brandApi.get("/brands/");
  return res.data;
};

export const createBrand = async (data: BrandInput) => {
  const res = await brandApi.post("/brands/", data);
  return res.data;
};

export const updateBrand = async (id: number, data: BrandInput) => {
  const res = await brandApi.put(`/brands/${id}`, data);
  return res.data;
};

export const deleteBrand = async (id: number) => {
  const res = await brandApi.delete(`/brands/${id}`);
  return res.data;
};