import { Product, CreateProductDto, UpdateProductDto } from '../types/product-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const productService = {
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const data = await response.json();
    // 确保返回的数据是数组
    return Array.isArray(data) ? data : [];
  },

  async getProductById(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product with id ${id}`);
    }
    return response.json();
  },

  async generateProductCode(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/products/generate-code`);
    if (!response.ok) {
      throw new Error('Failed to generate product code');
    }
    const data = await response.json();
    return data.code;
  },

  async checkProductCode(code: string, id?: number): Promise<boolean> {
    let url = `${API_BASE_URL}/products/check-code?code=${encodeURIComponent(code)}`;
    if (id) {
      url += `&id=${id}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to check product code');
    }
    const data = await response.json();
    return data.isUnique;
  },

  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create product');
    }
    return response.json();
  },

  async updateProduct(id: number, data: UpdateProductDto): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update product with id ${id}`);
    }
    return response.json();
  },

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete product with id ${id}`);
    }
  },

  async batchDeleteProducts(ids: number[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/batch`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Failed to batch delete products');
    }
  },
};
