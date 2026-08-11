import axios from "axios";

// Android emulator → 10.0.2.2
// Physical device → your PC's local IP (ipconfig)
const API_URL = "http://192.168.15.54:8000";

export const supplierApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type SupplierInput = {
  SupplierName: string;
  Phone?: string;
  Email?: string;
  Website?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  City?: string;
  StateDivision?: string;
  PostalCode?: string;
  Country?: string;
  ContactPerson?: string;
  ContactPersonPhone?: string;
  TaxVatNo?: string;
  OpeningBalance?: number;
  CreditLimit?: number;
  Notes?: string;
  Status?: "Active" | "Inactive";
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const res = await supplierApi.get("/suppliers/");
  return res.data;
};

export const createSupplier = async (data: SupplierInput) => {
  const res = await supplierApi.post("/suppliers/", data);
  return res.data;
};

export const deleteSupplier = async (supplierId: number) => {
  const res = await supplierApi.delete(`/suppliers/${supplierId}`);
  return res.data;
};

export const getNextSupplierCode = async (): Promise<string> => {
  const response = await supplierApi.get("/suppliers/next-code");

  return response.data.SupplierCode;
};