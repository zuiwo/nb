'use client';
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Drawer,
  message,
  Input,
  Space,
  Spin,
  Collapse,
  DatePicker,
  Modal,
  Select,
  Dropdown,
  MenuProps,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DollarOutlined,
  EllipsisOutlined
} from '@ant-design/icons';
import { SaleOrder, SaleOrderListQuery, CreateSaleOrderDto, UpdateSaleOrderDto } from '@/lib/types/sale-order-types';
import { saleOrderService } from '@/lib/services/saleOrderService';
import { Customer } from '@/lib/types/customer-types';
import { customerService } from '@/lib/services/customerService';
import { formatPrice, formatDate } from '@/lib/utils/format';
import SaleOrderForm from '@/ui/forms/SaleOrderForm';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const SalesPage = () => {
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSaleOrder, setCurrentSaleOrder] = useState<SaleOrder | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedSaleOrderId, setSelectedSaleOrderId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useState<SaleOrderListQuery>({
    code: '',
    customerName: '',
    createTimeRange: undefined,
  });
  const [localSearchParams, setLocalSearchParams] = useState<SaleOrderListQuery>({
    code: '',
    customerName: '',
    createTimeRange: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 加载销售订单和客户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [saleOrdersData, customersData] = await Promise.all([
          saleOrderService.getSaleOrders(),
          customerService.getCustomers(),
        ]);
        setSaleOrders(Array.isArray(saleOrdersData) ? saleOrdersData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setSaleOrders([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchSaleOrders = async () => {
    try {
      setLoading(true);
      const data = await saleOrderService.getSaleOrders(searchParams);
      setSaleOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取销售订单失败:', error);
      setSaleOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = () => {
    setSearchParams(localSearchParams);
    fetchSaleOrders();
  };

  // 重置搜索条件
  const handleReset = () => {
    const resetParams = {
      code: '',
      customerName: '',
      createTimeRange: undefined,
    };
    setLocalSearchParams(resetParams);
    setSearchParams(resetParams);
    fetchSaleOrders();
  };

  // 新增销售订单
  const handleCreate = () => {
    setIsEditing(false);
    setCurrentSaleOrder(null);
    setIsDrawerVisible(true);
  };

  // 编辑销售订单
  const handleEdit = (saleOrder: SaleOrder) => {
    setIsEditing(true);
    setCurrentSaleOrder(saleOrder);
    setIsDrawerVisible(true);
  };

  // 删除销售订单
  const handleDelete = (id: number) => {
    setSelectedSaleOrderId(id);
    setIsDeleteModalVisible(true);
  };

  // 确认删除销售订单
  const confirmDelete = async () => {
    if (!selectedSaleOrderId) return;
    
    try {
      await saleOrderService.deleteSaleOrder(selectedSaleOrderId);
      message.success('销售订单删除成功');
      fetchSaleOrders();
      setIsDeleteModalVisible(false);
      setSelectedSaleOrderId(null);
    } catch (error) {
      console.error('销售订单删除失败:', error);
      message.error('销售订单删除失败');
    }
  };

  // 添加收款
  const handleAddPayment = (saleOrder: SaleOrder) => {
    // TODO: 实现添加收款功能
    console.log('添加收款:', saleOrder);
    message.info('添加收款功能待实现');
  };

  // 创建销售订单
  const handleCreateSaleOrder = async (values: CreateSaleOrderDto) => {
    try {
      await saleOrderService.createSaleOrder(values);
      message.success('销售订单创建成功');
      fetchSaleOrders();
      setIsDrawerVisible(false);
    } catch (error) {
      console.error('销售订单创建失败:', error);
      throw error;
    }
  };

  // 更新销售订单
  const handleUpdateSaleOrder = async (values: UpdateSaleOrderDto) => {
    if (!currentSaleOrder) return;
    
    try {
      await saleOrderService.updateSaleOrder(currentSaleOrder.id, values);
      message.success('销售订单更新成功');
      fetchSaleOrders();
      setIsDrawerVisible(false);
    } catch (error) {
      console.error('销售订单更新失败:', error);
      throw error;
    }
  };

  // 渲染商品列表
  const renderProductList = (items: SaleOrder['items']) => {
    return (
      <Table
        dataSource={items}
        rowKey="id"
        pagination={false}
        columns={[
          {
            title: '商品名',
            dataIndex: 'productName',
            key: 'productName',
            width: '20%',
          },
          {
            title: '商品编号',
            dataIndex: 'productCode',
            key: 'productCode',
            width: '15%',
          },
          {
            title: '数量',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '10%',
            align: 'right',
          },
          {
            title: '单位',
            dataIndex: 'unit',
            key: 'unit',
            width: '10%',
          },
          {
            title: '单价',
            dataIndex: 'price',
            key: 'price',
            width: '15%',
            align: 'right',
            render: (price: number) => formatPrice(price),
          },
          {
            title: '优惠金额',
            dataIndex: 'discountAmount',
            key: 'discountAmount',
            width: '15%',
            align: 'right',
            render: (amount: number) => formatPrice(amount),
          },
          {
            title: '合计金额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: '15%',
            align: 'right',
            render: (amount: number) => formatPrice(amount),
          },
        ]}
        size="small"
        bordered
      />
    );
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'code',
      key: 'code',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '12%',
      ellipsis: true,
      render: (time: string) => formatDate(time),
    },
    {
      title: '客户名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '客户手机号',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '客户城市',
      dataIndex: 'customerCity',
      key: 'customerCity',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      width: '10%',
      ellipsis: true,
      align: 'right' as const,
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: '付款金额',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      width: '10%',
      ellipsis: true,
      align: 'right' as const,
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: '8%',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: SaleOrder) => {
        // 定义操作按钮
        const editButton = (
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
        );

        const addPaymentButton = (
          <Button
            type="link"
            onClick={() => handleAddPayment(record)}
            size="small"
          >
            收款
          </Button>
        );

        const deleteButton = (
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            删除
          </Button>
        );

        // 操作按钮列表
        const actions = [editButton, addPaymentButton, deleteButton];

        // 如果按钮数量超过2个，使用下拉菜单
        if (actions.length > 2) {
          // 显示前两个按钮，其余放入下拉菜单
          const visibleActions = actions.slice(0, 2);
          const dropdownActions = actions.slice(2);

          // 下拉菜单配置
          const menuProps: MenuProps = {
            items: dropdownActions.map((action, index) => ({
              key: `action-${index}`,
              label: action,
            })),
          };

          return (
            <Space size="small" style={{ justifyContent: 'center' }}>
              {visibleActions}
              <Dropdown menu={menuProps} trigger={['click']}>
                <Button
                  type="link"
                  size="small"
                >
                  <EllipsisOutlined />
                </Button>
              </Dropdown>
            </Space>
          );
        }

        // 按钮数量≤2个，直接显示
        return (
          <Space size="small" style={{ justifyContent: 'center' }}>
            {actions}
          </Space>
        );
      },
    },
  ];

  // 过滤销售订单列表
  const filteredSaleOrders = saleOrders.filter(saleOrder => {
    const matchesCode = !searchParams.code || saleOrder.code.includes(searchParams.code);
    const matchesCustomerName = !searchParams.customerName || 
      saleOrder.customerName.includes(searchParams.customerName);
    
    // 日期范围过滤
    let matchesDateRange = true;
    if (searchParams.createTimeRange) {
      const [startDate, endDate] = searchParams.createTimeRange;
      const orderDate = new Date(saleOrder.createTime);
      matchesDateRange = orderDate >= startDate && orderDate <= endDate;
    }
    
    return matchesCode && matchesCustomerName && matchesDateRange;
  });

  // 渲染展开的商品列表
  const expandedRowRender = (record: SaleOrder) => (
    <div style={{ margin: 0 }}>
      <Collapse defaultActiveKey={[]}>
        <Panel header="商品列表" key="1">
          {renderProductList(record.items)}
        </Panel>
      </Collapse>
    </div>
  );

  return (
    <Spin spinning={loading} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: 0, width: '100%' }}>
        {/* 标题行 */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>销售管理</h2>
        </div>
        
        {/* 查询区域 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Input
              placeholder="订单号"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.code}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, code: e.target.value })}
            />
            <Input
              placeholder="客户名"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.customerName}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, customerName: e.target.value })}
            />
            <RangePicker
              size="middle"
              style={{ width: 300 }}
              value={localSearchParams.createTimeRange}
              onChange={(dates) => setLocalSearchParams({ ...localSearchParams, createTimeRange: dates as [Date, Date] | undefined })}
              placeholder={['开始日期', '结束日期']}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </div>
          
          {/* 新增按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
            <Button type="primary" onClick={handleCreate}>
              新建销售单
            </Button>
          </div>
        </div>
        
        {/* 销售订单列表 */}
        <div style={{ 
          overflowX: 'auto',
          marginBottom: 16, 
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <Table
            columns={columns}
            dataSource={filteredSaleOrders}
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
            expandable={{ expandedRowRender }}
            // 禁用表格拖动功能，确保表格位置固定
            onRow={() => ({
              draggable: false,
            })}
            // 确保表格自适应宽度，内容不溢出
            style={{
              width: '100%',
              boxSizing: 'border-box',
              tableLayout: 'fixed',
            }}
          />
        </div>

        {/* 删除确认对话框 */}
        <Modal
          title="删除确认"
          open={isDeleteModalVisible}
          onOk={confirmDelete}
          onCancel={() => setIsDeleteModalVisible(false)}
          okText="确认删除"
          cancelText="取消"
          okType="danger"
        >
          <p>确定要删除这条销售订单吗？</p>
        </Modal>

        {/* 销售订单表单抽屉 */}
        <Drawer
          title={isEditing ? '编辑销售订单' : '新增销售订单'}
          placement="right"
          onClose={() => setIsDrawerVisible(false)}
          open={isDrawerVisible}
          size={1200}
          resizable
        >
          <SaleOrderForm
            initialValues={currentSaleOrder}
            onSubmit={isEditing ? handleUpdateSaleOrder : handleCreateSaleOrder}
            onCancel={() => setIsDrawerVisible(false)}
            isEditing={isEditing}
            visible={isDrawerVisible}
          />
        </Drawer>
      </div>
    </Spin>
  );
};

export default SalesPage;
