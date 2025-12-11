'use client';
import React, { useState, useEffect } from 'react';
import { Table, Button, Drawer, message, Input, Space, Spin, Switch, Dropdown, MenuProps, Modal, Upload, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EllipsisOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import CustomerForm from '@/ui/forms/CustomerForm';
import { customerService } from '@/lib/services/customerService';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/lib/types/customer-types';
import * as XLSX from 'xlsx';

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
  // 导入导出相关状态
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  // 使用useMessage hook获取message实例
  const [messageApi, contextHolder] = message.useMessage();

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

  // 导入相关函数
  const handleImport = async (file: File) => {
    setImportLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // 转换数据格式
      const customersToImport = jsonData.map((item: any) => ({
        name: item['客户姓名'],
        code: item['客户编号'],
        phone: item['手机号'],
        company: item['公司名'],
        province: item['省份'],
        city: item['城市'],
        district: item['区县'],
        address: item['地址'],
        remark: item['备注'],
        status: item['状态'] === '启用' ? 1 : 0
      }));
      
      // 批量导入客户
      for (const customer of customersToImport) {
        await customerService.createCustomer(customer as CreateCustomerDto);
      }
      
      messageApi.success('导入成功');
      setIsImportModalVisible(false);
      fetchCustomers();
    } catch (error) {
      console.error('导入失败:', error);
      messageApi.error('导入失败，请检查文件格式');
    } finally {
      setImportLoading(false);
    }
  };

  // 导出相关函数
  const handleExport = (type: 'all' | 'filter' | 'selected') => {
    let dataToExport: Customer[] = [];
    
    if (type === 'all') {
      dataToExport = customers;
    } else if (type === 'filter') {
      dataToExport = filteredCustomers;
    } else if (type === 'selected') {
      const selectedIds = selectedRowKeys.map(key => Number(key));
      dataToExport = customers.filter(customer => selectedIds.includes(customer.id));
    }
    
    // 转换为导出格式
    const exportData = dataToExport.map(customer => ({
      '客户编号': customer.code,
      '客户姓名': customer.name,
      '手机号': customer.phone,
      '公司名': customer.company,
      '省份': customer.province,
      '城市': customer.city,
      '区县': customer.district,
      '地址': customer.address,
      '备注': customer.remark,
      '状态': customer.status === 1 ? '启用' : '禁用'
    }));
    
    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '客户列表');
    
    // 导出文件
    XLSX.writeFile(workbook, `客户列表_${new Date().toISOString().slice(0, 10)}.xlsx`);
    messageApi.success('导出成功');
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '客户编号': 'C001',
        '客户姓名': '张三',
        '手机号': '13800138000',
        '公司名': '张三公司',
        '省份': '广东省',
        '城市': '深圳市',
        '区县': '南山区',
        '地址': '科技园路1号',
        '备注': '测试客户',
        '状态': '启用'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '客户模板');
    XLSX.writeFile(workbook, '客户导入模板.xlsx');
    messageApi.success('模板下载成功');
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
      title: '',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: Customer) => (
        <Space size="small" style={{ justifyContent: 'center' }}>
          <Button
            type="link"
            onClick={() => showEditModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
              title="确定要删除这个客户吗？"
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
      {contextHolder}
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
          <Button type="primary" onClick={showCreateModal}>
            添加客户
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
            title={`确定要删除选中的 ${selectedRowKeys.length} 个客户吗？`}
            onConfirm={handleBatchDelete}
            okText="确认"
            cancelText="取消"
          >
            <Button danger onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        </div>
        
        {/* 客户列表 */}
        <div style={{ overflowX: 'auto', marginBottom: 16, maxWidth: '100%', boxSizing: 'border-box' }}>
          <Table
            columns={columns}
            dataSource={filteredCustomers}
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

        {/* 导入弹窗 */}
        <Modal
          title="导入客户"
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
              <p>请按照模板格式填写数据，确保字段完整</p>
            </div>
          </div>
        </Modal>
      </div>
    </Spin>
  );
};

export default CustomersPage;
