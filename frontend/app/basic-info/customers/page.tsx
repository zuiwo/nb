'use client';
import React, { useState, useEffect } from 'react';
import { Table, Button, Drawer, message, Input, Space, Spin, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import CustomerForm from '@/ui/forms/CustomerForm';
import { customerService } from '@/lib/services/customerService';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/lib/types/customer-types';

const { Search } = Input;

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchParams, setSearchParams] = useState({
    code: '',
    name: '',
    phone: '',
    company: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [localSearchParams, setLocalSearchParams] = useState({
    code: '',
    name: '',
    phone: '',
    company: ''
  });

  // 加载客户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const customersData = await customerService.getCustomers();
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取客户列表失败:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: CreateCustomerDto | UpdateCustomerDto) => {
    try {
      await customerService.createCustomer(values as CreateCustomerDto);
      console.log('客户创建成功');
      setIsDrawerVisible(false);
      fetchCustomers();
    } catch (error) {
      console.error('客户创建失败');
      console.error('Failed to create customer:', error);
      throw error;
    }
  };

  const handleUpdate = async (values: CreateCustomerDto | UpdateCustomerDto) => {
    if (!currentCustomer) return;
    
    try {
      await customerService.updateCustomer(currentCustomer.id, values as UpdateCustomerDto);
      console.log('客户更新成功');
      setIsDrawerVisible(false);
      fetchCustomers();
    } catch (error) {
      console.error('客户更新失败');
      console.error('Failed to update customer:', error);
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await customerService.deleteCustomer(id);
      console.log('客户删除成功');
      fetchCustomers();
    } catch (error) {
      console.error('客户删除失败');
      console.error('Failed to delete customer:', error);
    }
  };

  // 批量删除处理
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    
    try {
      await customerService.batchDeleteCustomers(selectedRowKeys.map(key => Number(key)));
      console.log('批量删除成功');
      setSelectedRowKeys([]);
      fetchCustomers();
    } catch (error) {
      console.error('批量删除失败');
      console.error('Failed to batch delete customers:', error);
    }
  };

  // 表格行选择处理
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 搜索处理
  const handleSearch = () => {
    setSearchParams(localSearchParams);
    fetchCustomers();
  };

  // 重置搜索条件
  const handleReset = () => {
    const resetParams = {
      code: '',
      name: '',
      phone: '',
      company: ''
    };
    setLocalSearchParams(resetParams);
    setSearchParams(resetParams);
    fetchCustomers();
  };

  // 处理启用状态切换
  const handleStatusChange = async (id: number, checked: boolean) => {
    try {
      await customerService.updateCustomer(id, { status: checked ? 1 : 0 });
      console.log('状态更新成功');
      fetchCustomers();
    } catch (error) {
      console.error('状态更新失败');
      console.error('Failed to update customer status:', error);
    }
  };

  const showCreateModal = () => {
    setIsEditing(false);
    setCurrentCustomer(null);
    setIsDrawerVisible(true);
  };

  const showEditModal = (customer: Customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    setIsDrawerVisible(true);
  };

  const columns = [
    {
      title: '客户编号',
      dataIndex: 'code',
      key: 'code',
      width: '8%',
      ellipsis: true,
    },
    {
      title: '客户姓名',
      dataIndex: 'name',
      key: 'name',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '公司名',
      dataIndex: 'company',
      key: 'company',
      width: '15%',
      ellipsis: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: '20%',
      ellipsis: true,
      render: (address: string, record: Customer) => {
        return `${record.province}${record.city}${record.district}${address}`;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '启用状态',
      dataIndex: 'status',
      key: 'status',
      width: '8%',
      ellipsis: true,
      render: (status: number, record: Customer) => (
        <Switch 
          checked={status === 1} 
          onChange={(checked) => handleStatusChange(record.id, checked)} 
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: Customer) => (
        <Space size="small" style={{ justifyContent: 'center' }}>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 过滤客户列表
  const filteredCustomers = customers.filter(customer => {
    const matchesCode = !searchParams.code || customer.code.includes(searchParams.code);
    const matchesName = !searchParams.name || customer.name.includes(searchParams.name);
    const matchesPhone = !searchParams.phone || customer.phone.includes(searchParams.phone);
    const matchesCompany = !searchParams.company || customer.company.includes(searchParams.company);
    return matchesCode && matchesName && matchesPhone && matchesCompany;
  });

  return (
    <Spin spinning={loading} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: 0, width: '100%' }}>
        {/* 标题行 */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>客户管理</h2>
        </div>
        
        {/* 查询区域 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Input
              placeholder="客户编号"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.code}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, code: e.target.value })}
            />
            <Input
              placeholder="客户姓名"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.name}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, name: e.target.value })}
            />
            <Input
              placeholder="公司名"
              allowClear
              size="middle"
              style={{ width: 200 }}
              value={localSearchParams.company}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, company: e.target.value })}
            />
            <Input
              placeholder="手机号"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.phone}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, phone: e.target.value })}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            新增客户
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
            批量删除
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={loading}
          scroll={{ x: '100%' }}
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
            },
          }}
          rowSelection={{ selectedRowKeys, onChange: onSelectChange }}
        />

        <Drawer
          title={isEditing ? '编辑客户' : '新增客户'}
          placement="right"
          onClose={() => setIsDrawerVisible(false)}
          open={isDrawerVisible}
          size="large"
        >
          <CustomerForm
            initialValues={currentCustomer}
            onSubmit={isEditing ? handleUpdate : handleCreate}
            onCancel={() => setIsDrawerVisible(false)}
            isEditing={isEditing}
            visible={isDrawerVisible}
          />
        </Drawer>
      </div>
    </Spin>
  );
};

export default CustomersPage;
