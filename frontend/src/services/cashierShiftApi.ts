import axios from "axios";
import { API_URL } from "../config/api";

export const cashierShiftApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type ShiftSummary = {
  TotalSales: number;
  TotalReturns: number;
  NetSales: number;
  TotalReceived: number;
  CashSales: number;
  CashRefunds: number;
};

export const getShiftSummary = async (params: {
  user_id: number;
  branch_id: number;
  start: string; // ISO (UTC)
  end: string; // ISO (UTC)
}): Promise<ShiftSummary> => {
  const res = await cashierShiftApi.get("/cashier-shifts/summary", { params });
  return res.data;
};

export type CloseShiftInput = {
  CompanyID: number;
  BranchID: number;
  UserID: number;
  ClosedByUserID: number;
  ShiftName: string;
  ShiftDate: string; // YYYY-MM-DD
  WindowStart: string;
  WindowEnd: string;
  OpeningBalance: number;
  ActualClosing: number;
  Note?: string;
};

export type CloseShiftResult = {
  ShiftID: number;
  CalculatedClosing: number;
  ActualClosing: number;
  Difference: number;
};

export const closeShift = async (
  data: CloseShiftInput,
): Promise<CloseShiftResult> => {
  const res = await cashierShiftApi.post("/cashier-shifts/", data);
  return res.data;
};