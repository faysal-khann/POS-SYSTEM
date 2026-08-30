import axios from "axios";
import { API_URL } from "../config/api";

export const permissionApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Lookup = { id: number; name: string };

export type PermissionListItem = {
  PermissionID: number;
  PermissionName: string;
  Module: string;
  Description: string | null;
  Status: "Active" | "Inactive" | string;
};

export const getModules = async (): Promise<Lookup[]> => {
  const res = await permissionApi.get("/permissions/modules");
  return res.data;
};

export const getPermissions = async (): Promise<PermissionListItem[]> => {
  const res = await permissionApi.get("/permissions/");
  return res.data;
};

export type PermissionCreateInput = {
  PermissionName: string;
  ParentPermissionID: number;
  Description?: string;
  Status: string;
};

export const createPermission = async (data: PermissionCreateInput) => {
  const res = await permissionApi.post("/permissions/", data);
  return res.data;
};

export const deletePermission = async (id: number) => {
  const res = await permissionApi.delete(`/permissions/${id}`);
  return res.data;
};

export const createModule = async (moduleName: string): Promise<Lookup> => {
  const res = await permissionApi.post("/permissions/modules", { ModuleName: moduleName });
  return res.data;
};



