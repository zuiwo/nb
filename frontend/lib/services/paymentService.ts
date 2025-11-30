import { Payment, CreatePaymentDto, UpdatePaymentDto, BatchCreatePaymentDto } from '../types/payment-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const paymentService = {
  async getPayments(): Promise<Payment[]> {
    const response = await fetch(`${API_BASE_URL}/payments`);
    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create payment');
    }
    return response.json();
  },

  async batchCreatePayments(data: BatchCreatePaymentDto): Promise<Payment[]> {
    const response = await fetch(`${API_BASE_URL}/payments/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to batch create payments');
    }
    return response.json();
  },

  async updatePayment(id: number, data: UpdatePaymentDto): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update payment with id ${id}`);
    }
    return response.json();
  },

  async deletePayment(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete payment with id ${id}`);
    }
  },
};
