import axios from "axios";

// Physical device → your PC's local IP
const API_URL = "http://192.168.0.102:8000";

export const customerApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// ============================================
// TYPES
// ============================================

export type CustomerInput = {
  CustomerName: string;
  Phone?: string;
  Email?: string;
  CustomerGroup?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  City?: string;
  StateDivision?: string;
  PostalCode?: string;
  Country?: string;
  DateOfBirth?: string;
  NationalId?: string;
  OpeningBalance?: number;
  CreditLimit?: number;
  Notes?: string;
  Status?: "Active" | "Inactive";
};


export type Customer = CustomerInput & {
  CustomerId: number;
  CustomerCode: string;
  DueAmount?: number;
};


// ============================================
// GET ALL CUSTOMERS
// ============================================

export const getCustomers = async (): Promise<Customer[]> => {
  const res = await customerApi.get("/customers/");
  return res.data;
};


// ============================================
// GET CUSTOMER BY ID
// ============================================

export const getCustomerById = async (
  id: number
): Promise<Customer> => {
  const res = await customerApi.get(`/customers/${id}`);

  return res.data;
};


// ============================================
// CREATE CUSTOMER
// ============================================

export const createCustomer = async (
  data: CustomerInput
) => {
  const res = await customerApi.post(
    "/customers/",
    data
  );

  return res.data;
};


// ============================================
// UPDATE CUSTOMER
// ============================================

export const updateCustomer = async (
  id: number,
  data: CustomerInput
) => {
  const res = await customerApi.put(
    `/customers/${id}`,
    data
  );

  return res.data;
};


// ============================================
// DELETE CUSTOMER
// ============================================

export const deleteCustomer = async (
  customerId: number
) => {
  const res = await customerApi.delete(
    `/customers/${customerId}`
  );

  return res.data;
};


// ============================================
// GET NEXT CUSTOMER CODE
// ============================================

export const getNextCustomerCode =
  async (): Promise<string> => {
    const response = await customerApi.get(
      "/customers/next-code"
    );

    return response.data.CustomerCode;
  };