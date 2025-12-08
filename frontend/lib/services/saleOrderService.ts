import { SaleOrder, CreateSaleOrderDto, UpdateSaleOrderDto, SaleOrderListQuery } from '../types/sale-order-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const saleOrderService = {
  async getSaleOrders(query?: SaleOrderListQuery): Promise<SaleOrder[]> {
    const url = new URL(`${API_BASE_URL}/sale-orders`);
    if (query) {
      if (query.code) url.searchParams.append('code', query.code);
      if (query.customerName) url.searchParams.append('customerName', query.customerName);
      // 日期范围参数暂时不传递，后端可能尚未实现
      // if (query.createTimeRange) {
      //   url.searchParams.append('startDate', query.createTimeRange[0].toISOString());
      //   url.searchParams.append('endDate', query.createTimeRange[1].toISOString());
      // }
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch sale orders');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async getSaleOrderById(id: number): Promise<SaleOrder> {
    const response = await fetch(`${API_BASE_URL}/sale-orders/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sale order with id ${id}`);
    }
    return response.json();
  },

  async createSaleOrder(data: CreateSaleOrderDto): Promise<SaleOrder> {
    const response = await fetch(`${API_BASE_URL}/sale-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create sale order');
    }
    return response.json();
  },

  async updateSaleOrder(id: number, data: UpdateSaleOrderDto): Promise<SaleOrder> {
    const response = await fetch(`${API_BASE_URL}/sale-orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update sale order with id ${id}`);
    }
    return response.json();
  },

  async deleteSaleOrder(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sale-orders/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete sale order with id ${id}`);
    }
  },

  async generateSaleOrderCode(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/sale-orders/generate-code`);
    if (!response.ok) {
      throw new Error('Failed to generate sale order code');
    }
    const data = await response.json();
    return data.code || '';
  },

  // 计算销售订单金额
  calculateSaleOrderAmount(items: any[]): {
    totalOriginalAmount: number;
    totalDiscountAmount: number;
    totalAmount: number;
  } {
    return items.reduce(
      (acc, item) => {
        const originalAmount = item.price * item.quantity;
        const discountAmount = item.discountAmount || 0;
        const totalAmount = originalAmount - discountAmount;

        return {
          totalOriginalAmount: acc.totalOriginalAmount + originalAmount,
          totalDiscountAmount: acc.totalDiscountAmount + discountAmount,
          totalAmount: acc.totalAmount + totalAmount,
        };
      },
      {
        totalOriginalAmount: 0,
        totalDiscountAmount: 0,
        totalAmount: 0,
      }
    );
  },
};
