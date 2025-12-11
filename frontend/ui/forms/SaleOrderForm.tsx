'use client';
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Form,
  Input,
  Button,
  DatePicker,
  Table,
  InputNumber,
  Space,
  Divider,
  Modal,
  Spin,
  App,
  Select,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { SaleOrder, CreateSaleOrderDto, UpdateSaleOrderDto, CreateSaleOrderItemDto, UpdateSaleOrderItemDto } from '@/lib/types/sale-order-types';
import { Product } from '@/lib/types/product-types';
import { Customer } from '@/lib/types/customer-types';
import { saleOrderService } from '@/lib/services/saleOrderService';
import { productService } from '@/lib/services/productService';
import { customerService } from '@/lib/services/customerService';
import { formatPrice } from '@/lib/utils/format';

const { TextArea } = Input;
const { Option } = Select;

interface SaleOrderFormProps {
  initialValues?: Partial<SaleOrder> | null;
  onSubmit: (values: CreateSaleOrderDto | UpdateSaleOrderDto) => Promise<void> | void;
  onCancel?: () => void;
  isEditing?: boolean;
  visible?: boolean;
}

interface ProductSelectModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (products: Product[]) => void;
}

// 商品选择组件
const ProductSelectModal: React.FC<ProductSelectModalProps> = ({ visible, onCancel, onSelect }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const { message: antdMessage } = App.useApp();

  useEffect(() => {
    if (visible) {
      fetchProducts();
      // 每次打开时清除上次选择状态
      setSelectedProducts([]);
    }
  }, [visible]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      antdMessage.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      // 实现商品搜索功能，根据搜索文本过滤商品
      const data = await productService.getProducts();
      const filteredProducts = data.filter(product => {
        if (!searchText) return true;
        return (
          product.name.includes(searchText) ||
          product.code.includes(searchText) ||
          product.category.includes(searchText) ||
          product.brand.includes(searchText)
        );
      });
      setProducts(Array.isArray(filteredProducts) ? filteredProducts : []);
    } catch (error) {
      console.error('Failed to search products:', error);
      antdMessage.error('搜索商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedProducts.length === 0) {
      antdMessage.warning('请选择商品');
      return;
    }
    onSelect(selectedProducts);
    onCancel();
  };

  return (
    <Modal
      title="选择商品"
      open={visible}
      onOk={handleConfirm}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="back" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleConfirm}>
          确定选择（{selectedProducts.length}个）
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input
          placeholder="搜索商品名称、编号、分类或品牌"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          onPressEnter={handleSearch}
          style={{ flex: 1 }}
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          dataSource={products}
          rowKey="id"
          columns={[
            {
              title: '商品编号',
              dataIndex: 'code',
              key: 'code',
              width: '15%',
            },
            {
              title: '商品名称',
              dataIndex: 'name',
              key: 'name',
              width: '25%',
            },
            {
              title: '分类',
              dataIndex: 'category',
              key: 'category',
              width: '15%',
            },
            {
              title: '品牌',
              dataIndex: 'brand',
              key: 'brand',
              width: '15%',
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
              render: (price: number) => formatPrice(price),
              align: 'right',
            },
          ]}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedProducts.map(p => p.id),
            onChange: (_, selectedRows) => {
              setSelectedProducts(selectedRows as Product[]);
            },
          }}
          style={{ width: '100%' }}
        />
      </Spin>
    </Modal>
  );
};

const SaleOrderForm: React.FC<SaleOrderFormProps> = ({
  initialValues = null,
  onSubmit,
  onCancel,
  isEditing = false,
  visible = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<(CreateSaleOrderItemDto | UpdateSaleOrderItemDto & { uniqueKey?: string })[]>([]);
  const [productSelectModalVisible, setProductSelectModalVisible] = useState(false);
  const [totalInfo, setTotalInfo] = useState({
    totalOriginalAmount: 0,
    totalDiscountAmount: 0,
    totalAmount: 0,
  });
  
  // 获取message实例
  const { message: antdMessage } = App.useApp();

  // 生成唯一标识符
  const generateUniqueKey = () => {
    return Math.random().toString(36).substring(2, 12);
  };

  // 加载客户列表
  useEffect(() => {
    if (visible) {
      fetchCustomers();
    }
  }, [visible]);

  // 初始化表单
  useEffect(() => {
    if (visible) {
      if (isEditing && initialValues) {
        // 编辑模式：使用初始值填充表单
        const orderCode = initialValues.code || '';
        const customerId = initialValues.customerId || 0;
        
        // 处理客户ID，保持数字类型
        let customerFieldValue = undefined;
        if (customerId > 0) {
          customerFieldValue = customerId; // 直接使用数字类型，不转换为字符串
        }
        
        // 为每个商品项添加uniqueKey
        const itemsWithKeys = (initialValues.items || []).map(item => ({
          ...item,
          uniqueKey: generateUniqueKey(),
        }));
        
        form.setFieldsValue({
          createTime: initialValues.createTime ? dayjs(initialValues.createTime) : dayjs(),
          customerId: customerFieldValue,
          remark: initialValues.remark,
          code: orderCode,
          items: itemsWithKeys, // 将商品信息设置到表单字段值中
        });
        setOrderCode(orderCode);
        setItems(itemsWithKeys);
        // 设置客户信息
        if (customerId > 0) {
          fetchCustomerById(customerId);
        }
      } else {
        // 新增模式：重置表单并生成订单号
        form.setFieldsValue({
          createTime: dayjs(),
          customerId: undefined, // 重置客户选择
        });
        generateOrderCode();
        setItems([]);
        setSelectedCustomer(null);
      }
    }
  }, [visible, isEditing, initialValues, form, customers]);

  // 计算总价
  useEffect(() => {
    const { totalOriginalAmount, totalDiscountAmount, totalAmount } = saleOrderService.calculateSaleOrderAmount(items);
    setTotalInfo({
      totalOriginalAmount,
      totalDiscountAmount,
      totalAmount,
    });
  }, [items]);

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      antdMessage.error('获取客户列表失败');
    }
  };

  const fetchCustomerById = async (customerId: number) => {
    try {
      setLoading(true);
      const customer = await customerService.getCustomerById(customerId);
      setSelectedCustomer(customer);
      // 选择后不需要再次设置表单值，因为AutoComplete已经通过labelInValue属性设置了正确的值
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      // 只在控制台记录错误，不向用户显示，避免频繁报错影响体验
    } finally {
      setLoading(false);
    }
  };

  const generateOrderCode = async () => {
    try {
      const code = await saleOrderService.generateSaleOrderCode();
      setOrderCode(code);
      // 设置表单内部状态，确保表单验证通过
      form.setFieldsValue({ code });
    } catch (error) {
      console.error('Failed to generate order code:', error);
      antdMessage.error('生成订单号失败，将使用默认订单号');
      // 降级策略：生成一个默认的订单号
      const now = new Date();
      const year = now.getFullYear().toString().slice(2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const defaultCode = `S${year}${month}${day}${random}`;
      setOrderCode(defaultCode);
      // 设置表单内部状态，确保表单验证通过
      form.setFieldsValue({ code: defaultCode });
    }
  };

  // 处理客户选择（仅在用户选择时触发）
  const handleCustomerSelect = (value: number) => {
    // 调用fetchCustomerById获取客户信息
    fetchCustomerById(value);
  };

  // 计算单项总金额
  const calculateItemTotal = (item: CreateSaleOrderItemDto | UpdateSaleOrderItemDto) => {
    return (item.price * item.quantity) - item.discountAmount;
  };

  // 处理商品数量或单价变化
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    
    // 自动计算合计金额
    if (field === 'price' || field === 'quantity' || field === 'discountAmount') {
      newItems[index].totalAmount = calculateItemTotal(newItems[index]);
    }
    
    setItems(newItems);
  };

  // 删除商品行
  const deleteItem = (index: number) => {
    if (items.length <= 1) {
      antdMessage.warning('至少需要保留一行商品');
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // 打开商品选择弹窗
  const openProductSelectModal = () => {
    setProductSelectModalVisible(true);
  };

  // 选择商品
  const handleProductSelect = (products: Product[]) => {
    // 选择商品后添加新行
    const newItems = [...items];
    
    products.forEach(product => {
      const newItem: CreateSaleOrderItemDto & { uniqueKey: string } = {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unit: product.unit,
        price: product.price,
        quantity: 1, // 默认数量为1
        discountAmount: 0,
        totalAmount: product.price * 1, // 默认数量为1，计算总价
        remark: '',
        uniqueKey: generateUniqueKey(),
      };
      newItems.push(newItem);
    });
    
    setItems(newItems);
    
    // 更新Form表单数据，确保新添加的商品行被Form组件正确识别
    form.setFieldsValue({
      items: newItems,
    });
    
    setProductSelectModalVisible(false);
  };

  // 表单提交处理
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证商品信息
      if (items.length === 0) {
        antdMessage.error('至少需要添加一行商品');
        return;
      }
      
      for (const item of items) {
        if (!item.productId || !item.productName || item.quantity <= 0 || item.price <= 0) {
          antdMessage.error('请填写完整的商品信息');
          return;
        }
      }
      
      // 格式化数据
      const formattedValues = {
        code: orderCode,
        createTime: values.createTime.format('YYYY-MM-DD'),
        customerId: parseInt(values.customerId), // 转换为number类型
        items: items.map(item => ({
          ...item,
          totalAmount: calculateItemTotal(item),
        })),
        remark: values.remark || '',
      };
      
      setLoading(true);
      await onSubmit(formattedValues as CreateSaleOrderDto | UpdateSaleOrderDto);
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Submit failed:', error);
      if (error instanceof Error) {
        antdMessage.error(error.message || '提交失败，请重试');
      } else {
        antdMessage.error('提交失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 商品表格列配置
  const itemColumns = [
    {
      title: '商品编号',
      dataIndex: 'productCode',
      key: 'productCode',
      width: '12%',
      minWidth: 120,
      resizable: true,
      render: (_: any, _record: any, index: number) => (
        <Form.Item
          name={['items', index, 'productCode']}
          noStyle
        >
          <Input
            placeholder="商品编号"
            value={items[index].productCode}
            readOnly
          />
        </Form.Item>
      ),
    },
    {
      title: '商品名',
      dataIndex: 'productName',
      key: 'productName',
      width: '30%',
      minWidth: 200,
      resizable: true,
      render: (_: any, _record: any, index: number) => (
        <Form.Item
          name={['items', index, 'productName']}
          noStyle
        >
          <Input
            placeholder="商品名称"
            value={items[index].productName}
            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
          />
        </Form.Item>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: '8%',
      minWidth: 80,
      resizable: true,
      render: (_: any, _record: any, index: number) => (
        <Form.Item
          name={['items', index, 'unit']}
          noStyle
        >
          <Input
            placeholder="单位"
            value={items[index].unit}
            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
          />
        </Form.Item>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '10%',
      minWidth: 100,
      resizable: true,
      align: 'right' as const,
      render: (_: any, _record: any, index: number) => (
        <Form.Item
          name={['items', index, 'quantity']}
          noStyle
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="数量"
            min={0}
            step={1}
            value={items[index].quantity}
            onChange={(value) => handleItemChange(index, 'quantity', value || 0)}
          />
        </Form.Item>
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: '12%',
      minWidth: 120,
      resizable: true,
      align: 'right' as const,
      render: (_: any, _record: any, index: number) => (
        <Form.Item
          name={['items', index, 'price']}
          noStyle
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="单价"
            min={0}
            step={0.01}
            value={items[index].price}
            onChange={(value) => handleItemChange(index, 'price', value || 0)}
            formatter={value => `¥ ${value}`}
            parser={value => parseFloat(value?.replace(/¥\s?/, '') || '0')}
          />
        </Form.Item>
      ),
    },
    {
      title: '优惠金额',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: '12%',
      minWidth: 120,
      resizable: true,
      align: 'right' as const,
      render: (_: any, _record: any, index: number) => (
        <Form.Item
          name={['items', index, 'discountAmount']}
          noStyle
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="优惠金额"
            min={0}
            step={0.01}
            value={items[index].discountAmount}
            onChange={(value) => handleItemChange(index, 'discountAmount', value || 0)}
            formatter={value => `¥ ${value}`}
            parser={value => parseFloat(value?.replace(/¥\s?/, '') || '0')}
          />
        </Form.Item>
      ),
    },
    {
      title: '小计',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '12%',
      minWidth: 120,
      resizable: true,
      align: 'right' as const,
      render: (totalAmount: number) => formatPrice(totalAmount),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: '12%',
      minWidth: 120,
      resizable: true,
      render: (_: any, _record: any, index: number) => (
        <Form.Item
          name={['items', index, 'remark']}
          noStyle
        >
          <Input
            placeholder="备注"
            value={items[index].remark}
            onChange={(e) => handleItemChange(index, 'remark', e.target.value)}
          />
        </Form.Item>
      ),
    },
    {
      title: '',
      key: 'action',
      width: '5%',
      minWidth: 60,
      resizable: true,
      align: 'center' as const,
      render: (_: any, _record: any, index: number) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteItem(index)}
          size="small"
          disabled={items.length <= 1}
          iconOnly
        />
      ),
    },
  ];

  return (
    <>
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* 订单基础信息 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>订单基础信息</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                name="createTime"
                label="下单日期"
                rules={[{ required: true, message: '请选择下单日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="选择日期"
                  allowClear={false}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
              <Form.Item
                name="code"
                label="订单编号"
                rules={[{ required: true, message: '请输入订单编号' }]}
              >
                <Input
                  value={orderCode}
                  placeholder="自动生成"
                  prefix={<CheckOutlined />}
                  onChange={(e) => setOrderCode(e.target.value)}
                />
              </Form.Item>
            </div>
          </div>

          <Divider />

          {/* 客户信息 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: '16px' }}>
              <h3 style={{ margin: 0 }}>客户信息 <span style={{ color: '#ff4d4f' }}>*</span></h3>
              <Form.Item
                name="customerId"
                rules={[{ required: true, message: '请选择客户' }]}
                noStyle
              >
                <Select
                  placeholder="输入客户名称或手机号筛选"
                  style={{ width: 300 }}
                  allowClear
                  onSelect={handleCustomerSelect}
                  showSearch
                  filterOption={(input, option) => {
                    if (!option) return false;
                    const customer = customers.find(c => c.id === option.value);
                    if (!customer) return false;
                    const searchValue = input.toLowerCase();
                    return (
                      customer.code.toLowerCase().includes(searchValue) ||
                      customer.name.toLowerCase().includes(searchValue) ||
                      customer.phone.toLowerCase().includes(searchValue)
                    );
                  }}
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.code} {customer.name} {customer.phone}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            {selectedCustomer ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ color: '#666', marginBottom: 4 }}>客户编号</div>
                  <div>{selectedCustomer.code}</div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: 4 }}>客户名</div>
                  <div>{selectedCustomer.name}</div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: 4 }}>手机号</div>
                  <div>{selectedCustomer.phone}</div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: 4 }}>地址</div>
                  <div>{selectedCustomer.province}{selectedCustomer.city}{selectedCustomer.district}{selectedCustomer.address}</div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#999' }}>请选择客户</div>
            )}
          </div>

          <Divider />

          {/* 商品信息 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: '16px' }}>
              <h3 style={{ margin: 0 }}>商品信息</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openProductSelectModal}
              >
                选择商品
              </Button>
            </div>
            <Table
              columns={itemColumns}
              dataSource={items}
              rowKey="uniqueKey"
              pagination={false}
              bordered
              summary={() => (
              <Table.Summary>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={9} align="right" >
                    <span style={{ marginRight: '40px' }}>原价总金额：{formatPrice(totalInfo.totalOriginalAmount)}</span>
                    <span style={{ marginRight: '40px' }}>优惠总金额：{formatPrice(totalInfo.totalDiscountAmount)}</span>
                    <strong style={{ marginRight: '180px' }}>应付总金额：{formatPrice(totalInfo.totalAmount)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
            />
          </div>

          {/* 备注 */}
          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea
              rows={4}
              placeholder="请输入备注"
            />
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <Space size="middle">
              <Button onClick={onCancel}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditing ? '更新销售订单' : '创建销售订单'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>

      {/* 商品选择弹窗 */}
      <ProductSelectModal
        visible={productSelectModalVisible}
        onCancel={() => {
          setProductSelectModalVisible(false);
        }}
        onSelect={handleProductSelect}
      />
    </>
  );
};

export default SaleOrderForm;
