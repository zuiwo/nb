'use client';
import React, { useState, useEffect } from 'react';
import { Table, Button, Drawer, message, Input, Select, Space, Card, Spin, Switch, Dropdown, MenuProps, Modal, Upload, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EllipsisOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import ProductForm from '@/ui/forms/ProductForm';
import { productService } from '@/lib/services/productService';
import { settingService } from '@/lib/services/settingService';
import { dictionaryService } from '@/lib/services/dictionaryService';
import { Product, CreateProductDto, UpdateProductDto } from '@/lib/types/product-types';
import { Setting } from '@/lib/types/setting-types';
import { DictionaryItem } from '@/lib/types/dictionary-types';
import { formatPrice, formatDate } from '@/lib/utils/format';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { Search } = Input;

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchParams, setSearchParams] = useState({
    code: '',
    name: '',
    category: '',
    status: undefined as number | undefined
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [localSearchParams, setLocalSearchParams] = useState({
    code: '',
    name: '',
    category: '',
    status: undefined as number | undefined
  });
  const [categoryOptions, setCategoryOptions] = useState<DictionaryItem[]>([]);
  const [brandOptions, setBrandOptions] = useState<DictionaryItem[]>([]);
  const [unitOptions, setUnitOptions] = useState<DictionaryItem[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  // 导入导出相关状态
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  // 使用useMessage hook获取message实例
  const [messageApi, contextHolder] = message.useMessage();

  // 加载产品和字典数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, settingsData] = await Promise.all([
          productService.getProducts(),
          settingService.getSettings()
        ]);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setSettings(settingsData);
        
        // 获取字典映射关系
        const categoryDictCode = settingsData.find(s => s.key === 'product_category_dict')?.value || '';
        const brandDictCode = settingsData.find(s => s.key === 'product_brand_dict')?.value || '';
        const unitDictCode = settingsData.find(s => s.key === 'product_unit_dict')?.value || '';
        
        // 并行获取字典项
        const [categoryItems, brandItems, unitItems] = await Promise.all([
          dictionaryService.getDictionaryItems(categoryDictCode),
          dictionaryService.getDictionaryItems(brandDictCode),
          dictionaryService.getDictionaryItems(unitDictCode)
        ]);
        
        // 过滤掉禁用状态的字典项，只保留启用状态的字典项
        setCategoryOptions(categoryItems.filter(item => item.status === 1));
        setBrandOptions(brandItems.filter(item => item.status === 1));
        setUnitOptions(unitItems.filter(item => item.status === 1));
        
      } catch (error) {
        console.error('Failed to load data:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      // 确保products始终是数组，防止null导致的filter错误
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取产品列表失败:', error);
      // 发生错误时，将products设置为空数组
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: CreateProductDto | UpdateProductDto) => {
    try {
      await productService.createProduct(values as CreateProductDto);
      console.log('产品创建成功');
      setIsDrawerVisible(false);
      fetchProducts();
    } catch (error) {
      console.error('产品创建失败');
      console.error('Failed to create product:', error);
      // 重新抛出错误，让ProductForm组件捕获并显示
      throw error;
    }
  };

  const handleUpdate = async (values: CreateProductDto | UpdateProductDto) => {
    if (!currentProduct) return;
    
    try {
      await productService.updateProduct(currentProduct.id, values as UpdateProductDto);
      console.log('产品更新成功');
      setIsDrawerVisible(false);
      fetchProducts();
    } catch (error) {
      console.error('产品更新失败');
      console.error('Failed to update product:', error);
      // 重新抛出错误，让ProductForm组件捕获并显示
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      console.log('产品删除成功');
      fetchProducts();
    } catch (error) {
      console.error('产品删除失败');
      console.error('Failed to delete product:', error);
    }
  };

  // 批量删除处理
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    
    try {
      await productService.batchDeleteProducts(selectedRowKeys.map(key => Number(key)));
      console.log('批量删除成功');
      setSelectedRowKeys([]);
      fetchProducts();
    } catch (error) {
      console.error('批量删除失败');
      console.error('Failed to batch delete products:', error);
    }
  };

  // 表格行选择处理
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 搜索处理
  const handleSearch = () => {
    setSearchParams(localSearchParams);
    fetchProducts();
  };

  // 重置搜索条件
  const handleReset = () => {
    const resetParams = {
      code: '',
      name: '',
      category: '',
      status: undefined
    };
    setLocalSearchParams(resetParams);
    setSearchParams(resetParams);
    fetchProducts();
  };

  // 处理启用状态切换
  const handleStatusChange = async (id: number, checked: boolean) => {
    try {
      await productService.updateProduct(id, { status: checked ? 1 : 0 });
      console.log('状态更新成功');
      fetchProducts();
    } catch (error) {
      console.error('状态更新失败');
      console.error('Failed to update product status:', error);
    }
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
      const productsToImport = jsonData.map((item: any) => ({
        name: item['产品名称'],
        code: item['产品编码'],
        category: item['产品分类'],
        brand: item['品牌'],
        unit: item['单位'],
        price: parseFloat(item['价格']) || 0,
        status: item['状态'] === '启用' ? 1 : 0,
        remark: item['备注']
      }));
      
      // 批量导入产品
      for (const product of productsToImport) {
        await productService.createProduct(product as CreateProductDto);
      }
      
      messageApi.success('导入成功');
      setIsImportModalVisible(false);
      fetchProducts();
    } catch (error) {
      console.error('导入失败:', error);
      messageApi.error('导入失败，请检查文件格式');
    } finally {
      setImportLoading(false);
    }
  };

  // 导出相关函数
  const handleExport = (type: 'all' | 'filter' | 'selected') => {
    let dataToExport: Product[] = [];
    
    if (type === 'all') {
      dataToExport = products;
    } else if (type === 'filter') {
      dataToExport = filteredProducts;
    } else if (type === 'selected') {
      const selectedIds = selectedRowKeys.map(key => Number(key));
      dataToExport = products.filter(product => selectedIds.includes(product.id));
    }
    
    // 转换为导出格式
    const exportData = dataToExport.map(product => ({
      '产品编码': product.code,
      '产品名称': product.name,
      '产品分类': product.category,
      '品牌': product.brand,
      '单位': product.unit,
      '价格': product.price,
      '状态': product.status === 1 ? '启用' : '禁用',
      '备注': product.remark
    }));
    
    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '产品列表');
    
    // 导出文件
    XLSX.writeFile(workbook, `产品列表_${new Date().toISOString().slice(0, 10)}.xlsx`);
    messageApi.success('导出成功');
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '产品编码': 'PROD001',
        '产品名称': '示例产品',
        '产品分类': '分类1',
        '品牌': '品牌1',
        '单位': '个',
        '价格': 100,
        '状态': '启用',
        '备注': '示例备注'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '产品模板');
    XLSX.writeFile(workbook, '产品导入模板.xlsx');
    messageApi.success('模板下载成功');
  };

  const showCreateModal = () => {
    setIsEditing(false);
    setCurrentProduct(null);
    setIsDrawerVisible(true);
  };

  const showEditModal = (product: Product) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setIsDrawerVisible(true);
  };

  // 创建字典项映射，用于将编号转换为名称
  const createDictItemMap = (items: DictionaryItem[]) => {
    const map: Record<string, string> = {};
    items.forEach(item => {
      map[item.code] = item.name;
    });
    return map;
  };

  const columns = [
    {
      title: '产品编码',
      dataIndex: 'code',
      key: 'code',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      ellipsis: true,
    },
    {
      title: '产品分类',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      ellipsis: true,
      render: (category: string) => {
        const categoryMap = createDictItemMap(categoryOptions);
        return categoryMap[category] || category;
      },
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: '15%',
      ellipsis: true,
      render: (brand: string) => {
        const brandMap = createDictItemMap(brandOptions);
        return brandMap[brand] || brand;
      },
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: '10%',
      ellipsis: true,
      render: (unit: string) => {
        const unitMap = createDictItemMap(unitOptions);
        return unitMap[unit] || unit;
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
      width: '5%',
      render: (status: number, record: Product) => (
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
      render: (_: unknown, record: Product) => (
        <Space size="small" style={{ justifyContent: 'center' }}>
          <Button
            type="link"
            onClick={() => showEditModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
              title="确定要删除这个产品吗？"
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

  // 过滤产品列表
  const filteredProducts = products.filter(product => {
    const matchesCode = !searchParams.code || product.code.includes(searchParams.code);
    const matchesName = !searchParams.name || product.name.includes(searchParams.name);
    const matchesCategory = !searchParams.category || product.category.includes(searchParams.category);
    const matchesStatus = searchParams.status === undefined || product.status === searchParams.status;
    return matchesCode && matchesName && matchesCategory && matchesStatus;
  });

  return (
    <Spin spinning={loading} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {contextHolder}
      <div style={{ padding: 0, width: '100%', overflowX: 'hidden' }}>
        {/* 标题行 */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>产品管理</h2>
        </div>
        
        {/* 查询区域 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Input
              placeholder="产品编号"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.code}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, code: e.target.value })}
            />
            <Input
              placeholder="产品名称"
              allowClear
              size="middle"
              style={{ width: 200 }}
              value={localSearchParams.name}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, name: e.target.value })}
            />
            <Select
              placeholder="全部"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.category}
              onChange={(value) => setLocalSearchParams({ ...localSearchParams, category: value })}
            >
              {categoryOptions.map(item => (
                <Option key={item.code} value={item.code}>
                  {item.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="启用状态"
              allowClear
              size="middle"
              style={{ width: 120 }}
              value={localSearchParams.status}
              onChange={(value) => setLocalSearchParams({ ...localSearchParams, status: value })}
            >
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
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
            添加产品
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
            title={`确定要删除选中的 ${selectedRowKeys.length} 个产品吗？`}
            onConfirm={handleBatchDelete}
            okText="确认"
            cancelText="取消"
          >
            <Button danger onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        </div>
        
        {/* 产品列表 */}
        <div style={{ overflowX: 'auto', marginBottom: 16, maxWidth: '100%', boxSizing: 'border-box' }}>
          <Table
            columns={columns}
            dataSource={filteredProducts}
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
          title={isEditing ? '编辑产品' : '新增产品'}
          placement="right"
          onClose={() => setIsDrawerVisible(false)}
          open={isDrawerVisible}
          size={1200}
          resizable
        >
          <ProductForm
            initialValues={currentProduct}
            onSubmit={isEditing ? handleUpdate : handleCreate}
            onCancel={() => setIsDrawerVisible(false)}
            isEditing={isEditing}
            visible={isDrawerVisible}
          />
        </Drawer>

        {/* 导入弹窗 */}
        <Modal
          title="导入产品"
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

export default ProductsPage;
