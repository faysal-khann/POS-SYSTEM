import axios from "axios";
import { API_URL } from "../config/api";

export const loyaltyApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type LoyaltySummaryItem = {
  CustomerId: number;
  CustomerCode: string;
  CustomerName: string;
  TotalPoints: number;
  UsedPoints: number;
  AvailablePoints: number;
  Status: string;
};

export const getLoyaltySummary = async (): Promise<LoyaltySummaryItem[]> => {
  const res = await loyaltyApi.get("/loyalty/summary");
  return res.data;
};

export type LoyaltyHistoryItem = {
  LoyaltyTransactionID: number;
  Date: string;
  RefNo: string;
  TransactionType: "Earn" | "Redeem" | "Adjust" | string;
  Points: number;
  Description?: string | null;
  By?: string | null;
};

export const getLoyaltyHistory = async (
  customerId: number,
): Promise<LoyaltyHistoryItem[]> => {
  const res = await loyaltyApi.get(`/loyalty/history/${customerId}`);
  return res.data;
};

export type LoyaltyAdjustInput = {
  CustomerID: number;
  ActionType: "Earn" | "Redeem" | "Adjust";
  Points: number;
  Description?: string;
  CreatedByUserID?: number;
};

export const adjustLoyaltyPoints = async (
  payload: LoyaltyAdjustInput,
): Promise<LoyaltyHistoryItem> => {
  const res = await loyaltyApi.post("/loyalty/adjust", payload);
  return res.data;
};