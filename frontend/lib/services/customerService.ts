import { Customer, CreateCustomerDto, UpdateCustomerDto, Invoice, CreateInvoiceDto, UpdateInvoiceDto } from '../types/customer-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const customerService = {
  // 客户管理
  async getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${API_BASE_URL}/customers`);
    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async getCustomerById(id: number): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch customer with id ${id}`);
    }
    return response.json();
  },

  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create customer');
    }
    return response.json();
  },

  async updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update customer with id ${id}`);
    }
    return response.json();
  },

  async deleteCustomer(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete customer with id ${id}`);
    }
  },

  async batchDeleteCustomers(ids: number[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/batch`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Failed to batch delete customers');
    }
  },

  // 发票管理
  async getCustomerInvoices(customerId: number): Promise<Invoice[]> {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/invoices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch invoices for customer ${customerId}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create invoice');
    }
    return response.json();
  },

  async updateInvoice(id: number, data: UpdateInvoiceDto): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update invoice with id ${id}`);
    }
    return response.json();
  },

  async deleteInvoice(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete invoice with id ${id}`);
    }
  },
};
