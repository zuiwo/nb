import { StatementRecord, StatementQueryParams, StatementResponse } from '../types/statement-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const statementService = {
  async getStatements(params?: StatementQueryParams): Promise<StatementResponse> {
    const url = new URL(`${API_BASE_URL}/statements`);
    
    // 添加查询参数
    if (params) {
      if (params.customerId) {
        url.searchParams.append('customerId', params.customerId.toString());
      }
      if (params.startTime) {
        url.searchParams.append('startTime', params.startTime);
      }
      if (params.endTime) {
        url.searchParams.append('endTime', params.endTime);
      }
      if (params.page) {
        url.searchParams.append('page', params.page.toString());
      }
      if (params.pageSize) {
        url.searchParams.append('pageSize', params.pageSize.toString());
      }
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch statements');
    }
    return response.json();
  },

  async syncStatements(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/statements/sync`, {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to sync statements');
    }
  },
};
