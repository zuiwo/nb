import {
  DictionaryType,
  DictionaryItem,
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
  CreateDictionaryItemRequest,
  UpdateDictionaryItemRequest
} from '../types/dictionary-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const dictionaryService = {
  // Dictionary Type Operations
  async getDictionaryTypes(): Promise<DictionaryType[]> {
    const response = await fetch(`${API_BASE_URL}/dictionaries/types`);
    if (!response.ok) {
      throw new Error('Failed to fetch dictionary types');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async getDictionaryTypeById(id: number): Promise<DictionaryType> {
    const response = await fetch(`${API_BASE_URL}/dictionaries/types/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dictionary type with id ${id}`);
    }
    return response.json();
  },

  async createDictionaryType(data: CreateDictionaryTypeRequest): Promise<DictionaryType> {
    // 前端验证：确保必填字段不为空
    if (!data.name) {
      throw new Error('字典类型名称不能为空');
    }
    
    const response = await fetch(`${API_BASE_URL}/dictionaries/types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create dictionary type');
    }
    return response.json();
  },

  async updateDictionaryType(id: number, data: UpdateDictionaryTypeRequest): Promise<DictionaryType> {
    // 前端验证：如果更新名称，确保名称不为空
    if (data.name !== undefined && !data.name) {
      throw new Error('字典类型名称不能为空');
    }
    
    const response = await fetch(`${API_BASE_URL}/dictionaries/types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update dictionary type with id ${id}`);
    }
    return response.json();
  },

  async deleteDictionaryType(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dictionaries/types/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete dictionary type with id ${id}`);
    }
  },

  async batchDeleteDictionaryTypes(ids: number[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dictionaries/types/batch`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Failed to batch delete dictionary types');
    }
  },

  // Dictionary Item Operations
  async getDictionaryItems(dictTypeCode?: string): Promise<DictionaryItem[]> {
    let url = `${API_BASE_URL}/dictionaries/items`;
    if (dictTypeCode) {
      url += `?dictTypeCode=${encodeURIComponent(dictTypeCode)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch dictionary items');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async getDictionaryItemById(id: number): Promise<DictionaryItem> {
    const response = await fetch(`${API_BASE_URL}/dictionaries/items/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dictionary item with id ${id}`);
    }
    return response.json();
  },

  async getDictionaryItemsByTypeCode(code: string): Promise<DictionaryItem[]> {
    const response = await fetch(`${API_BASE_URL}/dictionaries/items/type/${code}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dictionary items for type ${code}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async createDictionaryItem(data: CreateDictionaryItemRequest): Promise<DictionaryItem> {
    // 前端验证：确保必填字段不为空
    if (!data.name || !data.dictTypeCode) {
      throw new Error('字典值和字典类型不能为空');
    }
    
    const response = await fetch(`${API_BASE_URL}/dictionaries/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create dictionary item');
    }
    return response.json();
  },

  async updateDictionaryItem(id: number, data: UpdateDictionaryItemRequest): Promise<DictionaryItem> {
    // 前端验证：如果更新名称，确保名称不为空
    if (data.name !== undefined && !data.name) {
      throw new Error('字典值不能为空');
    }
    
    const response = await fetch(`${API_BASE_URL}/dictionaries/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update dictionary item with id ${id}`);
    }
    return response.json();
  },

  async deleteDictionaryItem(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dictionaries/items/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete dictionary item with id ${id}`);
    }
  },

  async batchDeleteDictionaryItems(ids: number[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dictionaries/items/batch`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Failed to batch delete dictionary items');
    }
  },
};
