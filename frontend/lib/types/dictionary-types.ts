// 字典类型定义
export interface DictionaryType {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// 字典项定义
export interface DictionaryItem {
  id: number;
  code: string;
  name: string;
  dictTypeCode: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 创建字典类型请求
export interface CreateDictionaryTypeRequest {
  name: string;
}

// 更新字典类型请求
export interface UpdateDictionaryTypeRequest {
  name?: string;
}

// 创建字典项请求
export interface CreateDictionaryItemRequest {
  name: string;
  dictTypeCode: string;
  status?: number;
}

// 更新字典项请求
export interface UpdateDictionaryItemRequest {
  name?: string;
  dictTypeCode?: string;
  status?: number;
}
