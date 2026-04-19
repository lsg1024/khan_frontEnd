import { apiRequest } from "./config";
import type { ApiResponse } from "./config";

// Master data types
export interface ExpenseBankType {
  id: number;
  name: string;
  note: string;
}

export interface ExpenseIncomeAccount {
  id: number;
  name: string;
  note: string;
}

export interface ExpenseExpenseAccount {
  id: number;
  name: string;
  note: string;
}

// Record types
export interface ExpenseRecordListItem {
  id: number;
  recordDate: string;
  expenseType: string; // "INCOME" | "EXPENSE"
  bankTypeName: string;
  accountName: string;
  counterparty: string;
  description: string;
  material: string;
  weight: number;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  taxAmount: number;
}

export interface ExpenseRecordDetail {
  id: number;
  recordDate: string;
  expenseType: string;
  bankTypeId: number;
  bankTypeName: string;
  incomeAccountId: number | null;
  incomeAccountName: string;
  expenseAccountId: number | null;
  expenseAccountName: string;
  counterparty: string;
  description: string;
  material: string;
  weight: number;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  taxAmount: number;
}

export interface ExpenseSummary {
  totalIncomeWeight: number;
  totalIncomeAmount: number;
  totalExpenseWeight: number;
  totalExpenseAmount: number;
  netWeight: number;
  netAmount: number;
}

export interface CreateExpenseRecordRequest {
  recordDate: string;
  expenseType: string;
  bankTypeId: number;
  incomeAccountId?: number | null;
  expenseAccountId?: number | null;
  counterparty?: string;
  description?: string;
  material?: string;
  weight?: number;
  quantity?: number;
  unitPrice?: number;
  supplyAmount?: number;
  taxAmount?: number;
}

export interface ExpenseRecordsResponse {
  content: ExpenseRecordListItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export const expenseMasterApi = {
  // Bank Types
  getBankTypes: (): Promise<ApiResponse<ExpenseBankType[]>> =>
    apiRequest.get<ExpenseBankType[]>("account/expense/master/bank-types"),

  createBankType: (data: { name: string; note?: string }): Promise<ApiResponse<ExpenseBankType>> =>
    apiRequest.post<ExpenseBankType>("account/expense/master/bank-types", data),

  updateBankType: (id: number, data: { name: string; note?: string }): Promise<ApiResponse<ExpenseBankType>> =>
    apiRequest.patch<ExpenseBankType>(`account/expense/master/bank-types/${id}`, data),

  deleteBankType: (id: number): Promise<ApiResponse<void>> =>
    apiRequest.delete<void>(`account/expense/master/bank-types/${id}`),

  // Income Accounts
  getIncomeAccounts: (): Promise<ApiResponse<ExpenseIncomeAccount[]>> =>
    apiRequest.get<ExpenseIncomeAccount[]>("account/expense/master/income-accounts"),

  createIncomeAccount: (data: { name: string; note?: string }): Promise<ApiResponse<ExpenseIncomeAccount>> =>
    apiRequest.post<ExpenseIncomeAccount>("account/expense/master/income-accounts", data),

  updateIncomeAccount: (id: number, data: { name: string; note?: string }): Promise<ApiResponse<ExpenseIncomeAccount>> =>
    apiRequest.patch<ExpenseIncomeAccount>(`account/expense/master/income-accounts/${id}`, data),

  deleteIncomeAccount: (id: number): Promise<ApiResponse<void>> =>
    apiRequest.delete<void>(`account/expense/master/income-accounts/${id}`),

  // Expense Accounts
  getExpenseAccounts: (): Promise<ApiResponse<ExpenseExpenseAccount[]>> =>
    apiRequest.get<ExpenseExpenseAccount[]>("account/expense/master/expense-accounts"),

  createExpenseAccount: (data: { name: string; note?: string }): Promise<ApiResponse<ExpenseExpenseAccount>> =>
    apiRequest.post<ExpenseExpenseAccount>("account/expense/master/expense-accounts", data),

  updateExpenseAccount: (id: number, data: { name: string; note?: string }): Promise<ApiResponse<ExpenseExpenseAccount>> =>
    apiRequest.patch<ExpenseExpenseAccount>(`account/expense/master/expense-accounts/${id}`, data),

  deleteExpenseAccount: (id: number): Promise<ApiResponse<void>> =>
    apiRequest.delete<void>(`account/expense/master/expense-accounts/${id}`),
};

export const expenseRecordApi = {
  getRecords: (startDate: string, endDate: string, expenseType?: string, bankTypeId?: number, page: number = 1): Promise<ApiResponse<ExpenseRecordsResponse>> => {
    const params: Record<string, string | number> = { startDate, endDate, page };
    if (expenseType) params.expenseType = expenseType;
    if (bankTypeId) params.bankTypeId = bankTypeId;
    return apiRequest.get<ExpenseRecordsResponse>("account/expense/records", { params });
  },

  getRecordById: (id: number): Promise<ApiResponse<ExpenseRecordDetail>> =>
    apiRequest.get<ExpenseRecordDetail>(`account/expense/records/${id}`),

  createRecord: (data: CreateExpenseRecordRequest): Promise<ApiResponse<ExpenseRecordDetail>> =>
    apiRequest.post<ExpenseRecordDetail>("account/expense/records", data),

  createRecordsBatch: (data: CreateExpenseRecordRequest[]): Promise<ApiResponse<string>> =>
    apiRequest.post<string>("account/expense/records/batch", data),

  updateRecord: (id: number, data: CreateExpenseRecordRequest): Promise<ApiResponse<ExpenseRecordDetail>> =>
    apiRequest.patch<ExpenseRecordDetail>(`account/expense/records/${id}`, data),

  deleteRecord: (id: number): Promise<ApiResponse<void>> =>
    apiRequest.delete<void>(`account/expense/records/${id}`),

  getSummary: (startDate: string, endDate: string): Promise<ApiResponse<ExpenseSummary>> =>
    apiRequest.get<ExpenseSummary>("account/expense/records/summary", { params: { startDate, endDate } }),
};
