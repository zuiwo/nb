# 产品管理API接口文档

## 1. 接口基础信息

- **API Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`

## 2. 接口列表

### 2.1 获取产品列表

- **URL**: `/products`
- **方法**: `GET`
- **请求参数**: 无
- **响应示例**: 
  ```json
  [
    {
      "id": 1,
      "name": "产品名称",
      "code": "P00001",
      "category": "产品分类",
      "brand": "品牌",
      "unit": "单位",
      "price": 100.0,
      "status": 1,
      "remark": "备注",
      "createdAt": "2025-11-28T09:00:00Z",
      "updatedAt": "2025-11-28T09:00:00Z"
    }
  ]
  ```

### 2.2 获取单个产品

- **URL**: `/products/:id`
- **方法**: `GET`
- **路径参数**:
  - `id`: 产品ID
- **响应示例**:
  ```json
  {
    "id": 1,
    "name": "产品名称",
    "code": "P00001",
    "category": "产品分类",
    "brand": "品牌",
    "unit": "单位",
    "price": 100.0,
    "status": 1,
    "remark": "备注",
    "createdAt": "2025-11-28T09:00:00Z",
    "updatedAt": "2025-11-28T09:00:00Z"
  }
  ```

### 2.3 创建产品

- **URL**: `/products`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "产品名称",
    "code": "P00001", // 可选，不提供则自动生成
    "category": "产品分类", // 可选
    "brand": "品牌", // 可选
    "unit": "单位", // 可选
    "price": 100.0,
    "status": 1, // 可选，默认1（启用）
    "remark": "备注" // 可选
  }
  ```
- **响应示例**:
  ```json
  {
    "id": 1,
    "name": "产品名称",
    "code": "P00001",
    "category": "产品分类",
    "brand": "品牌",
    "unit": "单位",
    "price": 100.0,
    "status": 1,
    "remark": "备注",
    "createdAt": "2025-11-28T09:00:00Z",
    "updatedAt": "2025-11-28T09:00:00Z"
  }
  ```

### 2.4 更新产品

- **URL**: `/products/:id`
- **方法**: `PUT`
- **路径参数**:
  - `id`: 产品ID
- **请求体**:
  ```json
  {
    "name": "产品名称", // 可选
    "code": "P00001", // 可选
    "category": "产品分类", // 可选
    "brand": "品牌", // 可选
    "unit": "单位", // 可选
    "price": 100.0, // 可选
    "status": 1, // 可选
    "remark": "备注" // 可选
  }
  ```
- **响应示例**:
  ```json
  {
    "id": 1,
    "name": "产品名称",
    "code": "P00001",
    "category": "产品分类",
    "brand": "品牌",
    "unit": "单位",
    "price": 100.0,
    "status": 1,
    "remark": "备注",
    "createdAt": "2025-11-28T09:00:00Z",
    "updatedAt": "2025-11-28T09:30:00Z"
  }
  ```

### 2.5 删除产品

- **URL**: `/products/:id`
- **方法**: `DELETE`
- **路径参数**:
  - `id`: 产品ID
- **响应示例**:
  ```json
  {
    "message": "Product deleted successfully"
  }
  ```

### 2.6 批量删除产品

- **URL**: `/products/batch`
- **方法**: `DELETE`
- **请求体**:
  ```json
  {
    "ids": [1, 2, 3]
  }
  ```
- **响应示例**:
  ```json
  {
    "message": "Products deleted successfully",
    "rowsAffected": 3
  }
  ```

## 3. 状态码说明

- `200 OK`: 请求成功
- `201 Created`: 创建成功
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 4. 错误响应示例

```json
{
  "error": "Failed to fetch products"
}
```