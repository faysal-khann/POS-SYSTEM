import axios from "axios";
import { API_URL } from "../config/api";

export const branchApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type BranchListItem = {
  BranchID: number;
  BranchCode: string;
  BranchName: string;
  ManagerName: string | null;
  Phone: string | null;
  Address: string | null;
  Status: "Active" | "Inactive" | string;
};

export type BranchDetail = BranchListItem & {
  Email: string | null;
};

export type BranchCreateInput = {
  CompanyID: number;
  BranchName: string;
  ManagerName?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  Status?: string;
};

export type BranchUpdateInput = {
  BranchName: string;
  ManagerName?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  Status?: string;
};

export const getBranches = async (search?: string): Promise<BranchListItem[]> => {
  const res = await branchApi.get("/branches/", { params: { search } });
  return res.data;
};

export const getBranchDetail = async (id: number): Promise<BranchDetail> => {
  const res = await branchApi.get(`/branches/${id}`);
  return res.data;
};

export const createBranchFull = async (data: BranchCreateInput): Promise<BranchDetail> => {
  const res = await branchApi.post("/branches/", data);
  return res.data;
};

export const updateBranch = async (id: number, data: BranchUpdateInput): Promise<BranchDetail> => {
  const res = await branchApi.put(`/branches/${id}`, data);
  return res.data;
};

export const deleteBranch = async (id: number) => {
  const res = await branchApi.delete(`/branches/${id}`);
  return res.data;
};