// 销售订单类型定义

export interface SaleOrder {
  id: number;
  code: string; // 订单号：S+YYMMDD+3位递增数字
  createTime: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  items: SaleOrderItem[];
  orderAmount: number;
  paymentAmount: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleOrderItem {
  id: number;
  saleOrderId: number;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  discountAmount: number;
  totalAmount: number;
  remark: string;
}

export interface CreateSaleOrderDto {
  code: string;
  createTime: string;
  customerId: number;
  items: CreateSaleOrderItemDto[];
  remark: string;
}

export interface CreateSaleOrderItemDto {
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  discountAmount: number;
  totalAmount: number;
  remark: string;
}

export interface UpdateSaleOrderDto {
  code: string;
  createTime: string;
  customerId: number;
  items: UpdateSaleOrderItemDto[];
  remark: string;
}

export interface UpdateSaleOrderItemDto {
  id?: number;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  discountAmount: number;
  totalAmount: number;
  remark: string;
}

export interface SaleOrderListQuery {
  code?: string;
  customerName?: string;
  createTimeRange?: [Date, Date];
}
