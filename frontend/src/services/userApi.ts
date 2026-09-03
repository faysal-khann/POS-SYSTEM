import axios from "axios";
import { API_URL } from "../config/api";

export const userApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Lookup = { id: number; name: string };

export type UserListItem = {
  UserID: number;
  FullName: string;
  Username: string;
  Email: string;
  RoleName: string;
  Status: "Active" | "Inactive" | string;
  LastLoginAt: string | null;
};

export const getRoles = async (): Promise<Lookup[]> => {
  const res = await userApi.get("/users/roles");
  return res.data;
};

export const getUsers = async (): Promise<UserListItem[]> => {
  const res = await userApi.get("/users/");
  return res.data;
};

export const deleteUser = async (id: number) => {
  const res = await userApi.delete(`/users/${id}`);
  return res.data;
};

export type PermissionNode = {
  id: number;
  name: string;
  children: PermissionNode[];
};

export const getPermissionTree = async (): Promise<PermissionNode[]> => {
  const res = await userApi.get("/users/permissions/tree");
  return res.data;
};

export const getRolePermissionIds = async (roleId: number): Promise<number[]> => {
  const res = await userApi.get(`/users/roles/${roleId}/permissions`);
  return res.data;
};

export type UserCreateInput = {
  FullName: string;
  Username: string;
  Email: string;
  Phone?: string;
  Password: string;
  ConfirmPassword: string;
  RoleID: number;
  PrimaryBranchID: number;
  EmployeeID?: string;
  Designation?: string;
  Address?: string;
  Notes?: string;
  Status: string;
  PermissionIDs: number[];
};

export const createUser = async (data: UserCreateInput) => {
  const res = await userApi.post("/users/", data);
  return res.data;
};

export type UserDetail = {
  UserID: number;
  FullName: string;
  Username: string;
  Email: string;
  Phone: string | null;
  RoleID: number;
  RoleName: string;
  PrimaryBranchID: number;
  BranchName: string;
  EmployeeID: string | null;
  Designation: string | null;
  Address: string | null;
  Notes: string | null;
  Status: string;
  LastLoginAt: string | null;
  PermissionIDs: number[];
};

export type UserUpdateInput = {
  FullName: string;
  Username: string;
  Email: string;
  Phone?: string;
  Password?: string;
  ConfirmPassword?: string;
  RoleID: number;
  PrimaryBranchID: number;
  EmployeeID?: string;
  Designation?: string;
  Address?: string;
  Notes?: string;
  Status: string;
  PermissionIDs: number[];
};

export const getUserDetail = async (id: number): Promise<UserDetail> => {
  const res = await userApi.get(`/users/${id}`);
  return res.data;
};

export const updateUser = async (id: number, data: UserUpdateInput) => {
  const res = await userApi.put(`/users/${id}`, data);
  return res.data;
};