'use client';
import { useState } from "react";
import { Layout, Menu } from "antd";
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
  BookOutlined
} from "@ant-design/icons";
import Link from "next/link";

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
        zIndex: 1000,
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
      <Layout style={{ flex: 1, marginTop: '64px', display: 'flex' }}>
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
            zIndex: 999,
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
                defaultSelectedKeys={['sales']}
                style={{ borderRight: 0, height: '100%' }}
                items={[
                  {
                    key: 'sales',
                    icon: <ShoppingOutlined />,
                    label: <Link href="/sales">销售</Link>,
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
                    key: 'bills',
                    icon: <FileTextOutlined />,
                    label: <Link href="/bills">账单</Link>,
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
        <Layout style={{ marginLeft: collapsed ? '80px' : '200px', flex: 1 }}>
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              minHeight: 280,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
