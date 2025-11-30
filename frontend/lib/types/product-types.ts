// 简化的产品类型定义
export type Product = {
  id: number;
  name: string;
  code: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  status: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductDto = {
  name: string;
  code?: string;
  category?: string;
  brand?: string;
  unit?: string;
  price: number;
  status?: number;
  remark?: string;
};

export type UpdateProductDto = {
  name?: string;
  code?: string;
  category?: string;
  brand?: string;
  unit?: string;
  price?: number;
  status?: number;
  remark?: string;
};
