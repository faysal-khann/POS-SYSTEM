import axios from "axios";

// Android emulator → 10.0.2.2
// Physical device → your PC's local IP (ipconfig)
const API_URL = "http://192.168.0.101:8000";

export const supplierApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Supplier = {
  SupplierId: number;
  SupplierCode: string;
  SupplierName: string;
  Phone: string;
  Email: string;
  City: string;
  DueAmount: number;
  Status: "Active" | "Inactive";
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const res = await supplierApi.get("/suppliers/");
  return res.data;
};