import axios from "axios";
import { API_URL } from "../config/api";

export const categoryApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Category = {
  CategoryID: number;
  CategoryName: string;
  Description?: string;
  Status: "Active" | "Inactive";
  CreatedAt: string;
};

export type CategoryInput = {
  CategoryName: string;
  Description?: string;
  Status?: "Active" | "Inactive";
};

export const getCategoryList = async (): Promise<Category[]> => {
  const res = await categoryApi.get("/categories/");
  return res.data;
};

export const createCategory = async (data: CategoryInput) => {
  const res = await categoryApi.post("/categories/", data);
  return res.data;
};

export const updateCategory = async (id: number, data: CategoryInput) => {
  const res = await categoryApi.put(`/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id: number) => {
  const res = await categoryApi.delete(`/categories/${id}`);
  return res.data;
};