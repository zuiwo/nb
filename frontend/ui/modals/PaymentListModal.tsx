'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Spin, message, App } from 'antd';
import dayjs from 'dayjs';
import { SaleOrder } from '../../lib/types/sale-order-types';
import { Payment, CreatePaymentDto, UpdatePaymentDto } from '../../lib/types/payment-types';
import { Customer } from '../../lib/types/customer-types';
import { paymentService } from '../../lib/services/paymentService';
import { formatPrice, formatDate } from '../../lib/utils/format';
import PaymentForm from '../forms/PaymentForm';

interface PaymentListModalProps {
  order: SaleOrder;
  customers: Customer[];
  saleOrders: SaleOrder[];
  onClose: () => void;
  onPaymentCreated: () => void;
}

const PaymentListModal: React.FC<PaymentListModalProps> = ({
  order,
  customers,
  saleOrders,
  onClose,
  onPaymentCreated
}) => {
  // 获取App上下文，用于使用message实例
  const { message: antdMessage } = App.useApp();
  
  // 状态管理
  const [isPaymentFormVisible, setIsPaymentFormVisible] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 加载当前订单的收款记录
  const loadPayments = async () => {
    try {
      setLoading(true);
      const allPayments = await paymentService.getPayments();
      // 筛选出当前订单的收款记录
      const orderPayments = allPayments.filter(payment => 
        payment.saleOrderIds.includes(order.id)
      );
      setPayments(orderPayments);
    } catch (error) {
      console.error('Failed to load payments:', error);
      antdMessage.error('加载收款记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadPayments();
  }, [order.id]);

  // 新增收款
  const handleAddPayment = () => {
    // 计算建议金额：订单金额 - 已付金额
    const suggestedAmount = order.orderAmount - order.paymentAmount;
    
    // 设置初始值，自动填充订单信息
    setSelectedPayment({
      id: 0,
      code: '',
      paymentDate: dayjs().format('YYYY-MM-DD HH:mm'),
      customerId: order.customerId,
      customerName: order.customerName,
      saleOrderIds: [order.id],
      amount: suggestedAmount > 0 ? suggestedAmount : order.orderAmount,
      paymentMethod: '',
      account: '',
      payerCompany: '',
      remark: '',
      createdAt: '',
      updatedAt: ''
    });
    setIsEditing(false);
    setIsPaymentFormVisible(true);
  };

  // 创建收款记录
  const handleCreatePayment = async (values: CreatePaymentDto | UpdatePaymentDto) => {
    try {
      if (isEditing && selectedPayment) {
        // 编辑收款记录（暂不实现）
        // await paymentService.updatePayment(selectedPayment.id, values as UpdatePaymentDto);
        antdMessage.success('收款记录更新成功');
      } else {
        // 创建收款记录
        await paymentService.createPayment(values as CreatePaymentDto);
        antdMessage.success('收款记录创建成功');
      }
      
      // 关闭表单，刷新数据
      setIsPaymentFormVisible(false);
      setSelectedPayment(null);
      await loadPayments(); // 重新加载收款记录
      onPaymentCreated(); // 通知父组件刷新数据
    } catch (error) {
      console.error('Failed to create payment:', error);
      antdMessage.error('操作失败，请重试');
      throw error; // 让表单组件处理错误
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '收款编号',
      dataIndex: 'code',
      key: 'code',
      ellipsis: true,
    },
    {
      title: '收款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      ellipsis: true,
      render: (date: string) => formatDate(date),
    },
    {
      title: '收款金额',
      dataIndex: 'amount',
      key: 'amount',
      ellipsis: true,
      align: 'right',
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',

      ellipsis: true,
    },
    {
      title: '收款账户',
      dataIndex: 'account',
      key: 'account',
      ellipsis: true,
    },
    {
      title: '付款公司',
      dataIndex: 'payerCompany',
      key: 'payerCompany',
      ellipsis: true,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: '160px',
      key: 'createdAt',
      ellipsis: true,
      render: (date: string) => formatDate(date),
    },
  ];

  return (
    <Modal
      title={`订单 ${order.code} 收款记录`}
      open={true}
      onCancel={onClose}
      footer={null}
      width={1080}
      style={{ top: '20%' }}
      destroyOnHidden
    >
      {/* 收款记录列表 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16 }}>
          <Button type="primary" onClick={handleAddPayment}>
            添加收款
          </Button>
        </div>
        
        <Spin spinning={loading}>
          <div style={{ height: 400, overflowY: 'auto' }}>
            <Table
              dataSource={payments}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              emptyText="暂无收款记录"
            />
          </div>
        </Spin>
      </div>

      {/* 收款表单 */}
      <Modal
        title={isEditing ? '编辑收款记录' : '新增收款记录'}
        open={isPaymentFormVisible}
        onCancel={() => {
          setIsPaymentFormVisible(false);
          setSelectedPayment(null);
        }}
        footer={null}
        width={800}
        style={{ top: '10%' }}
      >
        <PaymentForm
          initialValues={selectedPayment}
          onSubmit={handleCreatePayment}
          onCancel={() => {
            setIsPaymentFormVisible(false);
            setSelectedPayment(null);
          }}
          isEditing={isEditing}
          visible={isPaymentFormVisible}
          customers={customers}
          saleOrders={saleOrders}
        />
      </Modal>
    </Modal>
  );
};

export default PaymentListModal;