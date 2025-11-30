import type { Metadata } from "next";
import "./globals.css";
import { ConfigProvider, App } from "antd";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AppLayout from "./components/AppLayout";

export const metadata: Metadata = {
  title: "nb2",
  description: "nb2项目",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: '#f0f2f5' }}>
        {/* 使用AntdRegistry优化Ant Design样式加载，避免页面闪烁 */}
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1890ff',
              },
            }}
          >
            <App>
              <AppLayout>{children}</AppLayout>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
