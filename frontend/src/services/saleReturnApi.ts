import axios from "axios";
import { API_URL } from "../config/api";

export const saleReturnApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type ReturnableItem = {
  ProductID: number;
  ProductName: string;
  QtyAvailable: number;
  UnitPrice: number;
  TaxPercent: number;
};

export type SaleLookupResult = {
  SaleID: number;
  InvoiceNo: string;
  CustomerID: number | null;
  CustomerName: string;
  BranchID: number;
  CompanyID: number;
  items: ReturnableItem[];
};

export const lookupSale = async (invoiceNo: string): Promise<SaleLookupResult> => {
  const res = await saleReturnApi.get(`/sale-returns/lookup/${invoiceNo}`);
  return res.data;
};

export type SaleReturnItemInput = {
  ProductID: number;
  ReturnQty: number;
  UnitPrice: number;
  LineTotal: number;
};

export type SaleReturnCreateInput = {
  OriginalSaleID: number;
  ReturnType: string;
  CompanyID: number;
  BranchID: number;
  CustomerID?: number;
  UserID: number;
  Reason?: string;
  Note?: string;
  SubTotal: number;
  TaxAmount: number;
  GrandTotal: number;
  RefundMethod: string;
  ReceivedAmount: number;
  items: SaleReturnItemInput[];
};

export const createSaleReturn = async (data: SaleReturnCreateInput) => {
  const res = await saleReturnApi.post("/sale-returns/", data);
  return res.data;
};