import axios from "axios";

const API_URL = "http://192.168.15.243:8000";

export const unitApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Unit = {
  UnitID: number;
  UnitName: string;
  ShortName?: string;
  Description?: string;
  Status: "Active" | "Inactive";
  CreatedAt: string;
};

export type UnitInput = {
  UnitName: string;
  ShortName?: string;
  Description?: string;
  Status?: "Active" | "Inactive";
};

export const getUnitList = async (): Promise<Unit[]> => {
  const res = await unitApi.get("/units/");
  return res.data;
};

export const createUnit = async (data: UnitInput) => {
  const res = await unitApi.post("/units/", data);
  return res.data;
};

export const updateUnit = async (id: number, data: UnitInput) => {
  const res = await unitApi.put(`/units/${id}`, data);
  return res.data;
};

export const deleteUnit = async (id: number) => {
  const res = await unitApi.delete(`/units/${id}`);
  return res.data;
};