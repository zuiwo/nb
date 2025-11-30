import type { Metadata } from "next";
import "./globals.css";
import { ConfigProvider } from "antd";
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
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
            },
          }}
        >
          <AppLayout>{children}</AppLayout>
        </ConfigProvider>
      </body>
    </html>
  );
}
