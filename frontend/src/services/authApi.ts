import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";

export const authApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type LoginInput = {
  CompanyID: number;
  UsernameOrEmail: string;
  Password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  UserID: number;
  FullName: string;
  Username: string;
  Email: string;
  RoleID: number;
  RoleName: string;
  CompanyID: number;
  CompanyName: string;
  PrimaryBranchID: number;
  BranchName: string;
  PermissionKeys: string[];
};

export const login = async (data: LoginInput): Promise<LoginResponse> => {
  const res = await authApi.post("/auth/login", data);
  return res.data;
};

export const saveSession = async (session: LoginResponse) => {
  await SecureStore.setItemAsync("auth_token", session.access_token);
  await SecureStore.setItemAsync("auth_user", JSON.stringify(session));
};

export const getStoredToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync("auth_token");
};

export const getStoredUser = async (): Promise<LoginResponse | null> => {
  const raw = await SecureStore.getItemAsync("auth_user");
  return raw ? JSON.parse(raw) : null;
};

export const logout = async () => {
  await SecureStore.deleteItemAsync("auth_token");
  await SecureStore.deleteItemAsync("auth_user");
};

export const verifyCredentials = async (
  usernameOrEmail: string,
  password: string,
): Promise<{ CompanyID: number; CompanyName: string } | null> => {
  try {
    const res = await authApi.post("/auth/verify-credentials", {
      UsernameOrEmail: usernameOrEmail,
      Password: password,
    });
    return res.data;
  } catch {
    return null;
  }
};

export const getStoredPermissions = async (): Promise<string[]> => {
  const user = await getStoredUser();
  return user?.PermissionKeys ?? [];
};