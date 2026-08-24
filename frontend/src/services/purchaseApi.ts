import axios from "axios";

import { API_URL } from "../config/api";

export const purchaseApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});
export type Lookup = { id: number; name: string };
export type PurchaseListItem = {
  PurchaseID: number;
  PurchaseNo: string;
  PurchaseDate: string;
  SupplierName: string;
  TotalItems: number;
  TotalAmount: number;
  Status: "Completed" | "Cancelled" | "Pending" | string;
  PaymentStatus: "Paid" | "Partial" | "Refunded" | string;
};

export type PurchaseFilters = {
  date_from?: string;
  date_to?: string;
  supplier_id?: number;
  status?: string;
};

export const getPurchases = async (
  filters: PurchaseFilters = {},
): Promise<PurchaseListItem[]> => {
  const res = await purchaseApi.get("/purchases/", { params: filters });
  return res.data;
};

export const deletePurchase = async (id: number) => {
  const res = await purchaseApi.delete(`/purchases/${id}`);
  return res.data;
};

export const getBranches = async (): Promise<Lookup[]> => {
  const res = await purchaseApi.get("/purchases/branches");
  return res.data;
};

export type PurchaseItemInput = {
  ProductID: number;
  ProductName: string; // for display only, not sent to backend as-is
  SizeID?: number;
  BatchNo?: string;
  Qty: number;
  UnitPrice: number;
  DiscountPercent: number;
  LineTotal: number;
};
export type PurchaseCreateInput = {
  CompanyID: number;
  BranchID: number;
  SupplierID: number;
  PurchaseDate: string;
  PaymentTerm?: string;
  ReferenceNo?: string;
  Remarks?: string;
  SubTotal: number;
  DiscountAmount: number;
  TaxPercent: number;
  TaxAmount: number;
  ShippingCharge: number;
  GrandTotal: number;
  Status: string;
  PaymentStatus: string;
  items: {
    ProductID: number;
    SizeID?: number;
    BatchNo?: string;
    Qty: number;
    UnitPrice: number;
    DiscountPercent: number;
    LineTotal: number;
  }[];
};

export const createPurchase = async (data: PurchaseCreateInput) => {
  const res = await purchaseApi.post("/purchases/", data);
  return res.data;
};

export type BranchCreateInput = {
  CompanyID: number;
  BranchName: string;
  ManagerName?: string;
  Phone?: string;
  Address?: string;
};

export const createBranch = async (
  data: BranchCreateInput,
): Promise<Lookup & { code: string }> => {
  const res = await purchaseApi.post("/purchases/branches", data);
  return res.data;
};

export const getSizes = async (): Promise<Lookup[]> => {
  const res = await purchaseApi.get("/purchases/sizes");
  return res.data;
};

export const getNextPurchaseNo = async (dateStr: string): Promise<string> => {
  const res = await purchaseApi.get("/purchases/next-number", {
    params: { purchase_date: dateStr },
  });
  return res.data.purchase_no;
};
