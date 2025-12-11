'use client';
import React, { useState, useEffect } from 'react';
import { Table, Button, Drawer, message, Input, Space, Spin, Switch, DatePicker, Select, Dropdown, MenuProps, Modal, Upload, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EllipsisOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import PaymentForm from '@/ui/forms/PaymentForm';
import BatchPaymentForm from '@/ui/forms/BatchPaymentForm';
import { paymentService } from '@/lib/services/paymentService';
import { customerService } from '@/lib/services/customerService';
import { saleOrderService } from '@/lib/services/saleOrderService';
import { Payment, CreatePaymentDto, UpdatePaymentDto } from '@/lib/types/payment-types';
import { Customer } from '@/lib/types/customer-types';
import { SaleOrder } from '@/lib/types/sale-order-types';
import { formatPrice, formatDate, formatDateOnly } from '@/lib/utils/format';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);
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
    account: '',
    saleOrderCode: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [localSearchParams, setLocalSearchParams] = useState({
    customerId: undefined as number | undefined,
    paymentDateRange: undefined as [Date, Date] | undefined,
    paymentMethod: '',
    account: '',
    saleOrderCode: ''
  });
  // 导入导出相关状态
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  // 使用useMessage hook获取message实例
  const [messageApi, contextHolder] = message.useMessage();

  // 加载收款记录和客户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [paymentsData, customersData, saleOrdersData] = await Promise.all([
          paymentService.getPayments(),
          customerService.getCustomers(),
          saleOrderService.getSaleOrders()
        ]);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setSaleOrders(Array.isArray(saleOrdersData) ? saleOrdersData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setPayments([]);
        setCustomers([]);
        setSaleOrders([]);
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
      messageApi.success('收款记录删除成功');
      fetchPayments();
    } catch (error) {
      console.error('收款记录删除失败');
      messageApi.error('收款记录删除失败');
    }
  };

  // 批量删除收款记录
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning('请先选择要删除的收款记录');
      return;
    }

    try {
      // 遍历选中的收款记录ID，逐一删除
      for (const id of selectedRowKeys) {
        await paymentService.deletePayment(Number(id));
      }
      messageApi.success(`成功删除 ${selectedRowKeys.length} 条收款记录`);
      fetchPayments();
      setSelectedRowKeys([]); // 清空选中状态
    } catch (error) {
      console.error('批量删除收款记录失败:', error);
      messageApi.error('批量删除收款记录失败');
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
      account: '',
      saleOrderCode: ''
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

  // 导入相关函数
  const handleImport = async (file: File) => {
    setImportLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // 创建客户名称到ID的映射
      const customerMap: Record<string, number> = {};
      customers.forEach(customer => {
        customerMap[`${customer.code} ${customer.name}`] = customer.id;
        customerMap[customer.name] = customer.id; // 支持仅用名称查找
        customerMap[customer.code] = customer.id; // 支持仅用客户编号查找
      });
      
      // 创建订单号到ID的映射
      const orderMap: Record<string, number> = {};
      saleOrders.forEach(order => {
        orderMap[order.code] = order.id;
      });
      
      // 转换数据格式，处理名称到ID的转换
      const paymentsToImport = jsonData.map((item: any) => {
        // 转换客户名到客户ID
        let customerId = 0;
        const customerName = item['客户名'];
        if (customerMap[customerName]) {
          customerId = customerMap[customerName];
        } else {
          throw new Error(`找不到客户：${customerName}`);
        }
        
        // 转换订单号到订单ID
        const orderCodes = item['订单号']?.split(',').map((code: string) => code.trim()) || [];
        const saleOrderIds = orderCodes.map((code: string) => {
          if (orderMap[code]) {
            return orderMap[code];
          } else {
            throw new Error(`找不到订单：${code}`);
          }
        });
        
        return {
          paymentDate: item['收款日期'],
          customerId: customerId,
          saleOrderIds: saleOrderIds,
          amount: parseFloat(item['付款金额']) || 0,
          paymentMethod: item['付款方式'],
          account: item['收款账户'],
          payerCompany: item['付款公司'],
          remark: item['备注']
        };
      });
      
      // 批量导入收款记录
      await paymentService.batchCreatePayments({ payments: paymentsToImport as CreatePaymentDto[] });
      
      messageApi.success('导入成功');
      setIsImportModalVisible(false);
      fetchPayments();
    } catch (error) {
      console.error('导入失败:', error);
      messageApi.error(`导入失败：${(error as Error).message}`);
    } finally {
      setImportLoading(false);
    }
  };

  // 导出相关函数
  const handleExport = (type: 'all' | 'filter' | 'selected') => {
    let dataToExport: Payment[] = [];
    
    if (type === 'all') {
      dataToExport = payments;
    } else if (type === 'filter') {
      dataToExport = filteredPayments;
    } else if (type === 'selected') {
      const selectedIds = selectedRowKeys.map(key => Number(key));
      dataToExport = payments.filter(payment => selectedIds.includes(payment.id));
    }
    
    // 转换为导出格式
    const exportData = dataToExport.map(payment => ({
      '收款编号': payment.code,
      '收款日期': formatDate(payment.paymentDate),
      '客户名': payment.customerName,
      '付款金额': payment.amount,
      '付款方式': payment.paymentMethod,
      '收款账户': payment.account,
      '付款公司': payment.payerCompany,
      '订单号': Array.isArray(payment.saleOrderIds) ? payment.saleOrderIds.map(orderId => {
        const order = saleOrders.find(o => o.id === orderId);
        return order ? order.code : '';
      }).join(', ') : '',
      '备注': payment.remark
    }));
    
    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '收款记录');
    
    // 导出文件
    XLSX.writeFile(workbook, `收款记录_${new Date().toISOString().slice(0, 10)}.xlsx`);
    messageApi.success('导出成功');
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '收款日期': '2025-12-01',
        '客户名': '客户1',
        '订单号': 'SO001, SO002',
        '付款金额': '1000',
        '付款方式': '银行转账',
        '收款账户': '中国银行',
        '付款公司': '付款公司',
        '备注': '测试收款'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '收款模板');
    XLSX.writeFile(workbook, '收款导入模板.xlsx');
    messageApi.success('模板下载成功');
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
      width: '7%',
      ellipsis: true,
    },
    {
      title: '收款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: '11%',
      ellipsis: true,
      render: (date: string) => formatDateOnly(date),
    },
    {
      title: '客户名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: '11%',
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
      width: '10%',
      ellipsis: true,
    },
    {
      title: '收款账户',
      dataIndex: 'account',
      key: 'account',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '付款公司',
      dataIndex: 'payerCompany',
      key: 'payerCompany',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '订单号',
      dataIndex: 'saleOrderIds',
      key: 'saleOrderIds',
      width: '12%',
      ellipsis: true,
      render: (saleOrderIds: number[]) => {
        if (!Array.isArray(saleOrderIds) || saleOrderIds.length === 0) {
          return '-';
        }
        return saleOrderIds.map(orderId => {
          const order = saleOrders.find(o => o.id === orderId);
          return order ? order.code : '';
        }).join(', ');
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: '8%',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '12%',
      ellipsis: true,
      render: (date: string) => formatDate(date),
    },
    {
      title: '',
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
          <Popconfirm
              title="确定要删除这条收款记录吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                size="small"
              >
                删除
              </Button>
            </Popconfirm>
        </Space>
      ),
    },
  ];

  // 过滤收款记录列表
  const filteredPayments = payments.filter(payment => {
    const matchesCustomer = !searchParams.customerId || payment.customerId === searchParams.customerId;
    const matchesPaymentMethod = !searchParams.paymentMethod || payment.paymentMethod.includes(searchParams.paymentMethod);
    const matchesAccount = !searchParams.account || payment.account.includes(searchParams.account);
    const matchesSaleOrderCode = !searchParams.saleOrderCode || 
      (Array.isArray(payment.saleOrderIds) && payment.saleOrderIds.some(orderId => {
        const order = saleOrders.find(o => o.id === orderId);
        return order && order.code.includes(searchParams.saleOrderCode);
      }));
    
    // 日期范围过滤
    let matchesDateRange = true;
    if (searchParams.paymentDateRange) {
      const [startDate, endDate] = searchParams.paymentDateRange;
      const paymentDate = new Date(payment.paymentDate);
      matchesDateRange = paymentDate >= startDate && paymentDate <= endDate;
    }
    
    return matchesCustomer && matchesPaymentMethod && matchesAccount && matchesDateRange && matchesSaleOrderCode;
  });

  return (
    <Spin spinning={loading} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {contextHolder}
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
            <Input
              placeholder="订单号"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.saleOrderCode}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, saleOrderCode: e.target.value })}
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
          <Button
            type="default"
            icon={<UploadOutlined />}
            onClick={() => setIsImportModalVisible(true)}
          >
            导入
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'all',
                  label: '全部',
                  onClick: () => handleExport('all')
                },
                {
                  key: 'filter',
                  label: '查询条件',
                  onClick: () => handleExport('filter')
                },
                {
                  key: 'selected',
                  label: '勾选',
                  onClick: () => handleExport('selected')
                }
              ]
            }}
          >
            <Button type="default" icon={<DownloadOutlined />}>
              导出
            </Button>
          </Dropdown>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 条收款记录吗？`}
            onConfirm={handleBatchDelete}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="default"
              danger
              disabled={selectedRowKeys.length === 0}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
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
            saleOrders={saleOrders}
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
            saleOrders={saleOrders}
          />
        </Drawer>

        {/* 导入弹窗 */}
        <Modal
          title="导入收款记录"
          open={isImportModalVisible}
          onCancel={() => setIsImportModalVisible(false)}
          footer={null}
          width={600}
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <Button type="default" onClick={handleDownloadTemplate}>
                下载导入模板
              </Button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Upload
                beforeUpload={handleImport}
                showUploadList={false}
                accept=".xlsx, .xls"
              >
                <Button type="primary" loading={importLoading}>
                  点击上传文件
                </Button>
              </Upload>
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              <p>支持格式：.xlsx, .xls</p>
              <p>请按照模板格式填写数据，确保客户名和订单号存在</p>
            </div>
          </div>
        </Modal>


      </div>
    </Spin>
  );
};

export default PaymentsPage;
