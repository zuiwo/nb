// 对帐单记录类型
export interface StatementRecord {
  id: number;
  customerId: number;
  customerCode: string;
  customerName: string;
  date: string;
  saleAmount: number;
  paymentAmount: number;
  balance: number;
  remark: string;
  sourceType: string;
  sourceId: number;
  createdAt: string;
  updatedAt: string;
}

// 对帐单查询参数类型
export interface StatementQueryParams {
  customerId?: number;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

// 对帐单响应类型
export interface StatementResponse {
  total: number;
  records: StatementRecord[];
}
