// 收款记录类型定义
export type Payment = {
  id: number;
  code: string;
  paymentDate: string;
  customerId: number;
  customerName: string;
  saleOrderIds: number[];
  amount: number;
  paymentMethod: string;
  account: string;
  payerCompany: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentDto = {
  paymentDate: string;
  customerId: number;
  saleOrderIds: number[];
  amount: number;
  paymentMethod: string;
  account: string;
  payerCompany?: string;
  remark?: string;
};

export type UpdatePaymentDto = {
  paymentDate?: string;
  customerId?: number;
  saleOrderIds?: number[];
  amount?: number;
  paymentMethod?: string;
  account?: string;
  payerCompany?: string;
  remark?: string;
};

export type BatchCreatePaymentDto = {
  payments: CreatePaymentDto[];
};
