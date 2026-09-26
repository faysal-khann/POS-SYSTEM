import axios from "axios";
import { API_URL } from "../config/api";

export const saleApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type SaleItemInput = {
  ProductID: number;
  Qty: number;
  UnitPrice: number;
  DiscountPercent: number;
  TaxPercent: number;
  LineTotal: number;
};

export type SaleCreateInput = {
  CompanyID: number;
  BranchID: number;
  CustomerID?: number;
  UserID: number;
  PriceType?: string;
  SubTotal: number;
  DiscountAmount: number;
  TaxAmount: number;
  GrandTotal: number;
  PaymentMethod: string;
  ReceivedAmount: number;
  ChangeAmount: number;
  Status: string;
  SaleDate?: string;
  LoyaltyPointsToRedeem?: number;
  items: SaleItemInput[];
};

export const getNextInvoiceNo = async (): Promise<string> => {
  const res = await saleApi.get("/sales/next-invoice-no");
  return res.data.invoice_no;
};

export const createSale = async (data: SaleCreateInput) => {
  const res = await saleApi.post("/sales/", data);
  return res.data;
};

export type SaleListItem = {
  SaleID: number;
  InvoiceNo: string;
  SaleDate: string;
  CustomerName: string;
  TotalItems: number;
  GrandTotal: number;
  PaymentMethod: string | null;
  PaymentStatus: "Paid" | "Due" | "Partial" | string;
  CashierName: string;
  Status: string;
};

export type SaleFilters = {
  date_from?: string;
  date_to?: string;
  customer_id?: number;
  cashier_id?: number;
  payment_status?: string;
};

export const getSales = async (filters: SaleFilters = {}): Promise<SaleListItem[]> => {
  const res = await saleApi.get("/sales/", { params: filters });
  return res.data;
};

export const getCashiers = async (): Promise<{ id: number; name: string }[]> => {
  const res = await saleApi.get("/sales/cashiers");
  return res.data;
};

export const deleteSale = async (id: number) => {
  const res = await saleApi.delete(`/sales/${id}`);
  return res.data;
};

export type HeldSaleListItem = {
  SaleID: number;
  ParkName: string | null;
  SaleDate: string;
  CustomerName: string;
  TotalItems: number;
  GrandTotal: number;
  CashierName: string;
};

export type HeldSaleDetail = {
  SaleID: number;
  ParkName: string | null;
  CustomerID: number | null;
  BranchID: number;
  CompanyID: number;
  items: {
    ProductID: number;
    ProductName: string;
    Qty: number;
    UnitPrice: number;
    DiscountPercent: number;
    TaxPercent: number;
  }[];
};

export const getHeldSales = async (): Promise<HeldSaleListItem[]> => {
  const res = await saleApi.get("/sales/held");
  return res.data;
};

export const getHeldSaleDetail = async (id: number): Promise<HeldSaleDetail> => {
  const res = await saleApi.get(`/sales/held/${id}`);
  return res.data;
};

export const getAllCashiers = async (): Promise<{ id: number; name: string }[]> => {
  const res = await saleApi.get("/sales/cashiers-list");
  return res.data;
};

export type DraftListItem = {
  SaleID: number;
  DraftNo: string;
  SaleDate: string;
  CustomerName: string;
  TotalItems: number;
  GrandTotal: number;
  CashierName: string;
};

export type DraftDetail = {
  SaleID: number;
  DraftNo: string;
  SaleDate: string;
  CustomerID: number | null;
  CustomerName: string;
  CashierName: string;
  BranchID: number;
  CompanyID: number;
  SubTotal: number;
  DiscountAmount: number;
  TaxAmount: number;
  GrandTotal: number;
  items: {
    ProductID: number;
    ProductName: string;
    Qty: number;
    UnitPrice: number;
    DiscountPercent: number;
    TaxPercent: number;
    LineTotal: number;
  }[];
};

export const getDrafts = async (): Promise<DraftListItem[]> => {
  const res = await saleApi.get("/sales/drafts");
  return res.data;
};

export const getDraftDetail = async (id: number): Promise<DraftDetail> => {
  const res = await saleApi.get(`/sales/drafts/${id}`);
  return res.data;
};