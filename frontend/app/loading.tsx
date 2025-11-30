'use client';

import { Spin, Layout } from 'antd';

const Loading = () => {
  return (
    <Layout style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f0f2f5',
      margin: 0,
      padding: 0
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Spin size="large" />
        <div style={{ 
          marginTop: '16px', 
          fontSize: '16px', 
          color: '#666',
          textAlign: 'center' 
        }}>加载中...</div>
      </div>
    </Layout>
  );
};

export default Loading;