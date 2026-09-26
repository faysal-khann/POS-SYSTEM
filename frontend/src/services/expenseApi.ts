import axios from "axios";
import { API_URL } from "../config/api";

export const expenseApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Lookup = { id: number; name: string };

export type ExpenseListItem = {
  ExpenseID: number;
  ExpenseDate: string;
  CategoryName: string;
  Description: string | null;
  Amount: number;
  PaymentMethod: string;
  ReferenceNo: string | null;
  CreatedByName: string;
  ExpenseNo: string;
  Status: "Paid" | "Incomplete" | string;
};

export type ExpenseSummary = {
  TotalExpenses: number;
  TotalTransactions: number;
  AverageExpense: number;
  HighestExpenseAmount: number;
  HighestExpenseCategory: string | null;
};

export type ExpenseFilters = {
  date_from?: string;
  date_to?: string;
  category_id?: number;
  payment_method?: string;
};
 
export const getExpenseCategories = async (): Promise<Lookup[]> => {
  const res = await expenseApi.get("/expenses/categories");
  return res.data;
};

export const getExpenseSummary = async (
  filters: ExpenseFilters = {},
): Promise<ExpenseSummary> => {
  const res = await expenseApi.get("/expenses/summary", { params: filters });
  return res.data;
};

export const getExpenses = async (
  filters: ExpenseFilters = {},
): Promise<ExpenseListItem[]> => {
  const res = await expenseApi.get("/expenses/", { params: filters });
  return res.data;
};

export const deleteExpense = async (id: number) => {
  const res = await expenseApi.delete(`/expenses/${id}`);
  return res.data;
};

export const createExpenseCategory = async (name: string): Promise<Lookup> => {
  const res = await expenseApi.post("/expenses/categories", {
    CategoryName: name,
  });
  return res.data;
};

export type ExpenseCreateInput = {
  ExpenseDate: string;
  CategoryID: number;
  Amount: number;
  PaymentMethod: string;
  ReferenceNo?: string;
  SupplierID?: number;
  Description?: string;
  Note?: string;
  IsRecurring?: boolean;
  Status: string;
};

export const createExpense = async (
  data: ExpenseCreateInput,
  companyId: number,
  branchId: number,
  createdBy: number,
) => {
  const res = await expenseApi.post("/expenses/", data, {
    params: {
      company_id: companyId,
      branch_id: branchId,
      created_by: createdBy,
    },
  });
  return res.data;
};

export type ExpenseByCategory = {
  CategoryName: string;
  Amount: number;
  Percent: number;
};

export const getExpenseByCategory = async (): Promise<ExpenseByCategory[]> => {
  const res = await expenseApi.get("/expenses/by-category");
  return res.data;
};

export const getNextExpenseNo = async (dateStr: string): Promise<string> => {
  const res = await expenseApi.get("/expenses/next-number", { params: { expense_date: dateStr } });
  return res.data.expense_no;
};
