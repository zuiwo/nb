// 客户类型定义
export type Customer = {
  id: number;
  code: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  company: string;
  status: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerDto = {
  name: string;
  code?: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  company?: string;
  status?: number;
  remark?: string;
};

export type UpdateCustomerDto = {
  name?: string;
  code?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  company?: string;
  status?: number;
  remark?: string;
};

// 发票类型定义
export type Invoice = {
  id: number;
  customerId: number;
  company: string;
  taxNumber: string;
  bank: string;
  bankAccount: string;
  branchAddress: string;
  status: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateInvoiceDto = {
  customerId: number;
  company: string;
  taxNumber: string;
  bank: string;
  bankAccount: string;
  branchAddress?: string;
  status?: number;
};

export type UpdateInvoiceDto = {
  company?: string;
  taxNumber?: string;
  bank?: string;
  bankAccount?: string;
  branchAddress?: string;
  status?: number;
};
