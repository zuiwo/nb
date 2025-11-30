import { Setting } from '../types/setting-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const settingService = {
  // 获取所有设置
  async getSettings(): Promise<Setting[]> {
    const response = await fetch(`${API_BASE_URL}/settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // 更新设置
  async updateSettings(settings: Setting[]): Promise<Setting[]> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update settings');
    }
    return response.json();
  },
};
