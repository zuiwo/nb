'use client';
import { useState, Suspense, useEffect } from "react";
import { Layout, Menu, Skeleton } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  StockOutlined,
  FileTextOutlined,
  UserOutlined,
  ProductOutlined,
  SettingOutlined,
  DatabaseOutlined,
  BookOutlined,
  DollarOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

// 内容区域的骨架屏组件
const ContentSkeleton = () => {
  return (
    <div style={{ padding: '24px 0' }}>
      <Skeleton active paragraph={{ rows: 10 }} title />
    </div>
  );
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['sales']);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const pathname = usePathname();

  // 根据当前路由设置选中的菜单
  useEffect(() => {
    let newSelectedKeys: string[] = ['sales'];
    let newOpenKeys: string[] = [];

    if (pathname.startsWith('/basic-info/products')) {
      newSelectedKeys = ['products'];
      newOpenKeys = ['basic-info'];
    } else if (pathname.startsWith('/basic-info/customers')) {
      newSelectedKeys = ['customers'];
      newOpenKeys = ['basic-info'];
    } else if (pathname.startsWith('/settings/system')) {
      newSelectedKeys = ['system'];
      newOpenKeys = ['settings'];
    } else if (pathname.startsWith('/settings/dictionary')) {
      newSelectedKeys = ['dictionary'];
      newOpenKeys = ['settings'];
    } else if (pathname.startsWith('/sales')) {
      newSelectedKeys = ['sales'];
    } else if (pathname.startsWith('/purchase')) {
      newSelectedKeys = ['purchase'];
    } else if (pathname.startsWith('/inventory')) {
      newSelectedKeys = ['inventory'];
    } else if (pathname.startsWith('/bills')) {
      newSelectedKeys = ['statements'];
    } else if (pathname.startsWith('/payments')) {
      newSelectedKeys = ['payments'];
    } else if (pathname.startsWith('/statements')) {
      newSelectedKeys = ['statements'];
    }

    setSelectedKeys(newSelectedKeys);
    setOpenKeys(newOpenKeys);
  }, [pathname]);

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        padding: 0, 
        background: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        height: '64px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start',
          paddingLeft: '24px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#000',
        }}>
          <BookOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
          销售系统
        </div>
        <div style={{ paddingRight: 24 }}>
          {/* 顶部右侧内容，如用户信息等，暂时为空 */}
        </div>
      </Header>
      
      {/* 主体内容区域 */}
      <Layout style={{ flex: 1, marginTop: '64px', display: 'flex' }}>
        {/* 侧边栏 */}
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          style={{ 
            background: '#fff', 
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)', 
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            top: '64px',
            bottom: 0,
            zIndex: 999
          }}
        >
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: 0
          }}>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <Menu
                theme="light"
                mode="inline"
                selectedKeys={selectedKeys}
                openKeys={openKeys}
                onOpenChange={setOpenKeys}
                style={{ borderRight: 0, height: '100%' }}
                items={[
                  {
                    key: 'sales',
                    icon: <ShoppingOutlined />,
                    label: <Link href="/sales">销售</Link>,
                  },
                  {
                    key: 'payments',
                    icon: <DollarOutlined />,
                    label: <Link href="/payments">收款</Link>,
                  },
                  {
                    key: 'purchase',
                    icon: <ShoppingCartOutlined />,
                    label: <Link href="/purchase">进货</Link>,
                  },
                  {
                    key: 'inventory',
                    icon: <StockOutlined />,
                    label: <Link href="/inventory">库存</Link>,
                  },
                  {
                    key: 'statements',
                    icon: <FileTextOutlined />,
                    label: <Link href="/statements">对帐单</Link>,
                  },
                  {
                    key: 'basic-info',
                    icon: <DatabaseOutlined />,
                    label: '基础信息',
                    children: [
                      {
                        key: 'customers',
                        icon: <UserOutlined />,
                        label: <Link href="/basic-info/customers">客户</Link>,
                      },
                      {
                        key: 'products',
                        icon: <ProductOutlined />,
                        label: <Link href="/basic-info/products">产品</Link>,
                      },
                    ],
                  },
                  {
                    key: 'settings',
                    icon: <SettingOutlined />,
                    label: '设置',
                    children: [
                      {
                        key: 'system',
                        icon: <SettingOutlined />,
                        label: <Link href="/settings/system">系统设置</Link>,
                      },
                      {
                        key: 'dictionary',
                        icon: <DatabaseOutlined />,
                        label: <Link href="/settings/dictionary">字典管理</Link>,
                      },
                    ],
                  },
                ]}
              />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: '8px 0',
              borderTop: '1px solid #f0f0f0'
            }}>
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 40,
                  height: 32,
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </div>
          </div>
        </Sider>
        
        {/* 主内容区域 */}
        <Layout style={{ marginLeft: collapsed ? '80px' : '200px', flex: 1 }}>
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              minHeight: 280,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* 使用Suspense包裹内容，实现加载状态 */}
            <Suspense fallback={<ContentSkeleton />}>
              {children}
            </Suspense>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
