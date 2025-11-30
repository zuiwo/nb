# 搭建nb2项目开发环境

## 一、前端环境搭建
1. 使用pnpm初始化Next.js项目，采用App Router模式
2. 安装并配置Ant Design V6.0
3. 按照用户要求的目录结构组织代码：
   ```
   nb2/frontend/
   ├── app/           # 仅存放路由相关文件（Next.js App Router 核心目录）
   │   ├── products/  # 产品相关路由
   │   │   └── page.tsx  # 产品列表主页（路由：/products）
   │   └── layout.tsx     # 全局布局
   ├── lib/           # 非路由功能类代码
   │   ├── services/  # 接口请求封装
   │   │   └── productService.ts
   │   ├── types/     # 类型定义
   │   │   └── product.ts
   │   └── utils/     # 可重用实用函数
   ├── ui/            # 所有 UI 组件
   │   ├── forms/     # 表单类组件
   │   │   └── ProductForm.tsx
   │   └── common/    # 通用 UI 组件
   ├── next.config.ts
   └── tsconfig.json
   ```
4. 配置基础样式和主题

## 二、后端环境搭建
1. 初始化Go项目，创建基础目录结构
2. 配置Go模块和依赖管理
3. 编写数据库连接代码，连接本地MySQL
4. 创建必要的数据库表结构

## 三、数据库配置
1. 连接本地MySQL服务
2. 创建名为nb2的数据库
3. 配置数据库用户和权限

## 四、项目整体结构
```
nb2/
├── frontend/          # Next.js前端项目（按用户要求的目录结构）
└── backend/           # Go后端项目
    ├── cmd/           # 命令行入口
    ├── internal/      # 内部包
    ├── pkg/           # 公共包
    └── go.mod         # Go模块配置
```