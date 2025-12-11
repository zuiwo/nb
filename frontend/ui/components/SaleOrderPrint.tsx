'use client';
import React from 'react';
import { SaleOrder } from '@/lib/types/sale-order-types';
import { formatPrice } from '@/lib/utils/format';

interface SaleOrderPrintProps {
  saleOrder: SaleOrder;
}

const SaleOrderPrint: React.FC<SaleOrderPrintProps> = ({ saleOrder }) => {
  // 计算总件数（油管批发类型使用）
  const totalPackages = saleOrder.items.reduce((sum) => {
    // 假设每件的数量是固定的，这里需要根据实际业务逻辑调整
    // 参考文件中显示每件对应不同的数量，所以这里暂时简单处理
    return sum + 5; // 临时值，实际应该根据商品类型和规格计算
  }, 0);

  // 产品数据分页，每15条一页
  const pageSize = 15;
  const pages = Math.ceil(saleOrder.items.length / pageSize);
  
  // 生成分页数据
  const getPageItems = (pageIndex: number) => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return saleOrder.items.slice(start, end);
  };

  // 渲染销售单头部（标题、日期、客户信息）
  const renderHeader = () => (
    <>
      {/* 标题 */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '18px', 
        fontWeight: 'bold', 
        marginBottom: '10px', 
        width: '100%' 
      }}>宁波世航液压科技有限公司销售单</div>
      
      {/* 销售日期和订单编号 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '10px', 
        width: '100%' 
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>销售日期: {new Date(saleOrder.createTime).toLocaleDateString()}</div>
      </div>
      
      {/* 客户信息 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '10px', 
        width: '100%', 
        fontWeight: 'bold' 
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div>客户:{saleOrder.customerId} {saleOrder.customerName}</div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>电话: {saleOrder.customerPhone}</div>
          <div>地址: {saleOrder.customerCity}</div>
          <div>序号: {saleOrder.code.slice(-3)}</div>
        </div>
      </div>
    </>
  );

  // 渲染产品列表
  const renderProductTable = (pageIndex: number, items: SaleOrder['items']) => (
    <table style={{ 
      width: '100%', 
      borderCollapse: 'collapse', 
      marginBottom: '10px' 
    }}>
      <thead>
        <tr>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold' 
          }}>序号</th>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold', 
            textAlign: 'left', 
            paddingLeft: '10px' 
          }}>名称及规格</th>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold' 
          }}>件数</th>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold' 
          }}>发货明细</th>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold' 
          }}>单位</th>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold' 
          }}>数量</th>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold' 
          }}>单价</th>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold' 
          }}>金额</th>
          <th style={{ 
            border: '1px solid #000', 
            padding: '5px', 
            textAlign: 'center', 
            backgroundColor: '#f0f0f0', 
            fontWeight: 'bold', 
            width: '80px' 
          }}>备注</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.id}>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{pageIndex * pageSize + index + 1}</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', paddingLeft: '10px' }}>{item.productName}</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>5</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{item.quantity}</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{item.unit}</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{item.quantity}</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{formatPrice(item.price)}</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{formatPrice(item.totalAmount)}</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{item.remark}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // 渲染页脚（合计、欠款、制单人等）
  const renderFooter = () => (
    <>
      {/* 总件数和本页合计 */}
      <div style={{ 
        textAlign: 'center', 
        fontWeight: 'bold', 
        margin: '10px 0' 
      }}>共 {totalPackages} 件</div>
      
      <div style={{ 
        textAlign: 'right', 
        fontWeight: 'bold', 
        marginRight: '20px' 
      }}>本页合计：{formatPrice(saleOrder.orderAmount)}</div>
      
      {/* 上次欠款和累计欠款 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        margin: '10px 0', 
        fontWeight: 'bold' 
      }}>
        <div>上次欠款：{formatPrice(0)}</div>
        <div>累计欠款：{formatPrice(saleOrder.orderAmount)}</div>
      </div>
      
      {/* 制单人和地址 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '20px' 
      }}>
        <div>
          <div>制单人: 赵建峰 手机: 15939519989</div>
          <div>地址: 宁波市江北区庄桥街道马径工业园区</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>客户签收:</div>
          <div style={{ 
            marginTop: '10px', 
            width: '200px', 
            height: '30px', 
            borderBottom: '1px solid #000', 
            marginLeft: 'auto' 
          }}></div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ 
      fontFamily: 'SimSun, serif', 
      fontSize: '12px', 
      width: '100%', 
      maxWidth: '24cm', 
      margin: '0 auto', 
      boxSizing: 'border-box' 
    }}>
      {/* 多页渲染 */}
      {Array.from({ length: pages }).map((_, pageIndex) => {
        const pageItems = getPageItems(pageIndex);
        const isLastPage = pageIndex === pages - 1;
        
        return (
          <div 
            key={pageIndex} 
            style={{
              padding: '0.5cm',
              marginBottom: '1cm',
              pageBreakAfter: isLastPage ? 'auto' : 'always',
            }}
          >
            {/* 每页都显示标题和客户信息 */}
            {renderHeader()}
            
            {/* 产品列表 */}
            {renderProductTable(pageIndex, pageItems)}
            
            {/* 只有最后一页显示合计数据 */}
            {isLastPage && renderFooter()}
          </div>
        );
      })}
    </div>
  );
};

export default SaleOrderPrint;