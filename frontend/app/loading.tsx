'use client';

import { Spin, Layout } from 'antd';

const Loading = () => {
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Spin size="large" tip="加载中..." />
    </Layout>
  );
};

export default Loading;