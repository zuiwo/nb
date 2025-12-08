'use client';
import React, { useState, useEffect } from 'react';
import { Table, Button, Drawer, message, Input, Space, Spin, Switch, DatePicker, Select, Dropdown, MenuProps, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EllipsisOutlined } from '@ant-design/icons';
import PaymentForm from '@/ui/forms/PaymentForm';
import BatchPaymentForm from '@/ui/forms/BatchPaymentForm';
import { paymentService } from '@/lib/services/paymentService';
import { customerService } from '@/lib/services/customerService';
import { Payment, CreatePaymentDto, UpdatePaymentDto } from '@/lib/types/payment-types';
import { Customer } from '@/lib/types/customer-types';
import { formatPrice, formatDate } from '@/lib/utils/format';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isBatchDrawerVisible, setIsBatchDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchParams, setSearchParams] = useState({
    customerId: undefined as number | undefined,
    paymentDateRange: undefined as [Date, Date] | undefined,
    paymentMethod: '',
    account: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [localSearchParams, setLocalSearchParams] = useState({
    customerId: undefined as number | undefined,
    paymentDateRange: undefined as [Date, Date] | undefined,
    paymentMethod: '',
    account: ''
  });

  // 加载收款记录和客户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [paymentsData, customersData] = await Promise.all([
          paymentService.getPayments(),
          customerService.getCustomers()
        ]);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setPayments([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取收款记录失败:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: CreatePaymentDto) => {
    try {
      await paymentService.createPayment(values);
      console.log('收款记录创建成功');
      setIsDrawerVisible(false);
      fetchPayments();
    } catch (error) {
      console.error('收款记录创建失败');
      console.error('Failed to create payment:', error);
      throw error;
    }
  };

  const handleBatchCreate = async (values: { payments: CreatePaymentDto[] }) => {
    try {
      await paymentService.batchCreatePayments(values);
      console.log('批量创建收款记录成功');
      setIsBatchDrawerVisible(false);
      fetchPayments();
    } catch (error) {
      console.error('批量创建收款记录失败');
      console.error('Failed to batch create payments:', error);
      throw error;
    }
  };

  const handleUpdate = async (values: UpdatePaymentDto) => {
    if (!currentPayment) return;
    
    try {
      await paymentService.updatePayment(currentPayment.id, values);
      console.log('收款记录更新成功');
      setIsDrawerVisible(false);
      fetchPayments();
    } catch (error) {
      console.error('收款记录更新失败');
      console.error('Failed to update payment:', error);
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await paymentService.deletePayment(id);
      console.log('收款记录删除成功');
      fetchPayments();
    } catch (error) {
      console.error('收款记录删除失败');
      console.error('Failed to delete payment:', error);
    }
  };

  // 表格行选择处理
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 搜索处理
  const handleSearch = () => {
    setSearchParams(localSearchParams);
    fetchPayments();
  };

  // 重置搜索条件
  const handleReset = () => {
    const resetParams = {
      customerId: undefined,
      paymentDateRange: undefined,
      paymentMethod: '',
      account: ''
    };
    setLocalSearchParams(resetParams);
    setSearchParams(resetParams);
    fetchPayments();
  };

  const showCreateModal = () => {
    setIsEditing(false);
    setCurrentPayment(null);
    setIsDrawerVisible(true);
  };

  const showBatchCreateModal = () => {
    setIsBatchDrawerVisible(true);
  };

  const showEditModal = (payment: Payment) => {
    setIsEditing(true);
    setCurrentPayment(payment);
    setIsDrawerVisible(true);
  };

  // 创建客户映射，用于将客户ID转换为客户名称
  const createCustomerMap = () => {
    const map: Record<number, string> = {};
    customers.forEach(customer => {
      map[customer.id] = `${customer.code} ${customer.name}`;
    });
    return map;
  };

  const columns = [
    {
      title: '收款编号',
      dataIndex: 'code',
      key: 'code',
      width: '8%',
      ellipsis: true,
    },
    {
      title: '收款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: '12%',
      ellipsis: true,
      render: (date: string) => formatDate(date),
    },
    {
      title: '客户名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '付款金额',
      dataIndex: 'amount',
      key: 'amount',
      width: '8%',
      ellipsis: true,
      render: (amount: number) => formatPrice(amount),
      align: 'right',
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '收款账户',
      dataIndex: 'account',
      key: 'account',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '付款公司',
      dataIndex: 'payerCompany',
      key: 'payerCompany',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: '9%',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: Payment) => (
        <Space size="small" style={{ justifyContent: 'center' }}>
          <Button
            type="link"
            onClick={() => showEditModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 过滤收款记录列表
  const filteredPayments = payments.filter(payment => {
    const matchesCustomer = !searchParams.customerId || payment.customerId === searchParams.customerId;
    const matchesPaymentMethod = !searchParams.paymentMethod || payment.paymentMethod.includes(searchParams.paymentMethod);
    const matchesAccount = !searchParams.account || payment.account.includes(searchParams.account);
    
    // 日期范围过滤
    let matchesDateRange = true;
    if (searchParams.paymentDateRange) {
      const [startDate, endDate] = searchParams.paymentDateRange;
      const paymentDate = new Date(payment.paymentDate);
      matchesDateRange = paymentDate >= startDate && paymentDate <= endDate;
    }
    
    return matchesCustomer && matchesPaymentMethod && matchesAccount && matchesDateRange;
  });

  return (
    <Spin spinning={loading} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: 0, width: '100%', overflowX: 'hidden' }}>
        {/* 标题行 */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>收款管理</h2>
        </div>
        
        {/* 查询区域 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Select
              placeholder="选择客户"
              allowClear
              size="middle"
              style={{ width: 200 }}
              value={localSearchParams.customerId}
              onChange={(value) => setLocalSearchParams({ ...localSearchParams, customerId: value })}
              showSearch
              filterOption={(input, option) => {
                if (!option) return false;
                const customer = customers.find(c => c.id === option.value);
                if (!customer) return false;
                const searchValue = input.toLowerCase();
                return (
                  customer.code.toLowerCase().includes(searchValue) ||
                  customer.name.toLowerCase().includes(searchValue)
                );
              }}
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.code} {customer.name}
                </Option>
              ))}
            </Select>
            <RangePicker
              size="middle"
              style={{ width: 300 }}
              value={localSearchParams.paymentDateRange}
              onChange={(dates) => setLocalSearchParams({ ...localSearchParams, paymentDateRange: dates as [Date, Date] | undefined })}
              placeholder={['开始日期', '结束日期']}
            />
            <Input
              placeholder="付款方式"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.paymentMethod}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, paymentMethod: e.target.value })}
            />
            <Input
              placeholder="收款账户"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.account}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, account: e.target.value })}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>
        
        {/* 操作按钮行 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start', gap: 12 }}>
          <Button type="primary" onClick={showCreateModal}>
            添加收款
          </Button>
          <Button type="default" onClick={showBatchCreateModal}>
            批量创建
          </Button>
        </div>
        
        {/* 收款记录列表 */}
        <div style={{ overflowX: 'auto', marginBottom: 16, maxWidth: '100%', boxSizing: 'border-box' }}>
          <Table
            columns={columns}
            dataSource={filteredPayments}
            rowKey="id"
            loading={loading}
            scroll={{ x: '1440px' }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `共 ${total} 条数据`,
              showQuickJumper: true,
              size: 'default',
              locale: {
                items_per_page: '/页',
                jump_to: '跳到第',
                jump_to_confirm: '页',
                prev_page: '上一页',
                next_page: '下一页',
                page: '页',
              },
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              onShowSizeChange: (current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }
            }}
            rowSelection={{ selectedRowKeys, onChange: onSelectChange }}
            // 禁用表格拖动功能
            onRow={() => ({
              draggable: false,
            })}
            // 确保表格内元素不溢出
            style={{
              minWidth: '100%',
              boxSizing: 'border-box',
              tableLayout: 'fixed',
            }}
          />
        </div>

        <Drawer
          title={isEditing ? '编辑收款记录' : '新增收款记录'}
          placement="right"
          onClose={() => setIsDrawerVisible(false)}
          open={isDrawerVisible}
          size={1200}
          resizable
        >
          <PaymentForm
            initialValues={currentPayment}
            onSubmit={isEditing ? handleUpdate : handleCreate}
            onCancel={() => setIsDrawerVisible(false)}
            isEditing={isEditing}
            visible={isDrawerVisible}
            customers={customers}
          />
        </Drawer>

        <Drawer
          title="批量创建收款记录"
          placement="right"
          onClose={() => setIsBatchDrawerVisible(false)}
          open={isBatchDrawerVisible}
          size={1200}
          resizable
        >
          <BatchPaymentForm
            onSubmit={handleBatchCreate}
            onCancel={() => setIsBatchDrawerVisible(false)}
            visible={isBatchDrawerVisible}
            customers={customers}
          />
        </Drawer>
      </div>
    </Spin>
  );
};

export default PaymentsPage;
