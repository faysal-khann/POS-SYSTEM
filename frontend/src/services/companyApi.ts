import axios from "axios";
import { API_URL } from "../config/api";

export const companyApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type CompanyListItem = {
  CompanyID: number;
  CompanyName: string;
  Phone: string | null;
  Email: string | null;
  Address: string | null;
  Currency: string | null;
  Status: "Active" | "Inactive" | string;
};

export type CompanyDetail = {
  CompanyName: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  Country?: string;
  Currency?: string;
  Website?: string;
  TaxNo?: string;
  LogoPath?: string;
  IsActive?: boolean;
};

export const getCompanies = async (search?: string): Promise<CompanyListItem[]> => {
  const res = await companyApi.get("/companies/", { params: { search } });
  return res.data;
};

export const getCompanyDetail = async (id: number): Promise<CompanyDetail> => {
  const res = await companyApi.get(`/companies/${id}`);
  return res.data;
};

export const createCompany = async (data: CompanyDetail) => {
  const res = await companyApi.post("/companies/", data);
  return res.data;
};

export const updateCompany = async (id: number, data: CompanyDetail) => {
  const res = await companyApi.put(`/companies/${id}`, data);
  return res.data;
};

export const deleteCompany = async (id: number) => {
  const res = await companyApi.delete(`/companies/${id}`);
  return res.data;
};

export const uploadCompanyLogo = async (uri: string, filename: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", {
    uri,
    name: filename,
    type: "image/jpeg",
  } as any);

  const res = await companyApi.post("/companies/upload-logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.LogoPath;
};