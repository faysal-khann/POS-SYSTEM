import axios from "axios";
import { API_URL } from "../config/api";

export const roleApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type RoleListItem = {
  RoleID: number;
  RoleName: string;
  Description: string | null;
  UserCount: number;
  Status: "Active" | "Inactive" | string;
};

export const getRoles = async (search?: string): Promise<RoleListItem[]> => {
  const res = await roleApi.get("/roles/", { params: { search } });
  return res.data;
};

export const deleteRole = async (id: number) => {
  const res = await roleApi.delete(`/roles/${id}`);
  return res.data;
};

export type RoleCreateInput = {
  RoleName: string;
  Description?: string;
  Status: string;
  PermissionIDs: number[];
};

export type RoleOut = {
  RoleID: number;
  RoleName: string;
  Description: string | null;
  Status: string;
};

export const createRole = async (data: RoleCreateInput): Promise<RoleOut> => {
  const res = await roleApi.post("/roles/", data);
  return res.data;
};

export type RoleDetail = {
  RoleID: number;
  RoleName: string;
  Description: string | null;
  Status: string;
  PermissionIDs: number[];
};

export type RoleUpdateInput = {
  RoleName: string;
  Description?: string;
  Status: string;
  PermissionIDs: number[];
};

export const getRoleDetail = async (id: number): Promise<RoleDetail> => {
  const res = await roleApi.get(`/roles/${id}`);
  return res.data;
};

export const updateRole = async (id: number, data: RoleUpdateInput): Promise<RoleOut> => {
  const res = await roleApi.put(`/roles/${id}`, data);
  return res.data;
};