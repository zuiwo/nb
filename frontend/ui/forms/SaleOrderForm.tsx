'use client';
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Table,
  InputNumber,
  Space,
  message,
  Divider,
  Modal,
  Spin,
  App,
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

const { Option } = Select;
const { TextArea } = Input;

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
  onSelect: (product: Product) => void;
}

// 商品选择组件
const ProductSelectModal: React.FC<ProductSelectModalProps> = ({ visible, onCancel, onSelect }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { message: antdMessage } = App.useApp();

  useEffect(() => {
    if (visible) {
      fetchProducts();
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
      // TODO: 实现商品搜索功能
      antdMessage.info('商品搜索功能待实现');
    } catch (error) {
      console.error('Failed to search products:', error);
      antdMessage.error('搜索商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedProduct) {
      onSelect(selectedProduct);
      onCancel();
    } else {
      antdMessage.warning('请选择商品');
    }
  };

  return (
    <Modal
      title="选择商品"
      open={visible}
      onOk={handleConfirm}
      onCancel={onCancel}
      width={800}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input
          placeholder="搜索商品"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
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
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
          }}
          rowSelection={{
            type: 'radio',
            onChange: (_, selectedRows) => {
              setSelectedProduct(selectedRows[0]);
            },
          }}
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
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
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
        form.setFieldsValue({
          createTime: initialValues.createTime ? dayjs(initialValues.createTime) : dayjs(),
          customerId: initialValues.customerId,
          remark: initialValues.remark,
          code: orderCode, // 设置表单编号字段，确保与状态一致
        });
        setOrderCode(orderCode);
        // 为每个商品项添加uniqueKey
        const itemsWithKeys = (initialValues.items || []).map(item => ({
          ...item,
          uniqueKey: generateUniqueKey(),
        }));
        setItems(itemsWithKeys);
        // 设置客户信息
        fetchCustomerById(initialValues.customerId);
      } else {
        // 新增模式：重置表单并生成订单号
        form.setFieldsValue({
          createTime: dayjs(),
        });
        generateOrderCode();
        setItems([]);
        setSelectedCustomer(null);
      }
    }
  }, [visible, isEditing, initialValues, form]);

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
      const customer = await customerService.getCustomerById(customerId);
      setSelectedCustomer(customer);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      antdMessage.error('获取客户信息失败');
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

  // 处理客户选择
  const handleCustomerChange = (customerId: number) => {
    fetchCustomerById(customerId);
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

  // 添加商品行
  const addItem = () => {
    setItems([...items, {
      productId: 0,
      productCode: '',
      productName: '',
      quantity: 0,
      unit: '',
      price: 0,
      discountAmount: 0,
      totalAmount: 0,
      remark: '',
      uniqueKey: generateUniqueKey(),
    }]);
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
    setSelectedItemIndex(null);
    setProductSelectModalVisible(true);
  };

  // 选择商品
  const handleProductSelect = (product: Product) => {
    // 选择商品后添加新行
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
    
    const newItems = [...items, newItem];
    setItems(newItems);
    
    // 更新Form表单数据，确保新添加的商品行被Form组件正确识别
    form.setFieldsValue({
      items: newItems,
    });
    
    setProductSelectModalVisible(false);
    setSelectedItemIndex(null);
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
        customerId: values.customerId,
        items: items.map(item => ({
          ...item,
          totalAmount: calculateItemTotal(item),
        })),
        remark: values.remark || '',
      };
      
      setLoading(true);
      await onSubmit(formattedValues as CreateSaleOrderDto | UpdateSaleOrderDto);
      antdMessage.success(isEditing ? '销售订单更新成功' : '销售订单创建成功');
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
      title: '操作',
      key: 'action',
      width: 80,
      minWidth: 80,
      resizable: true,
      render: (_, __, index: number) => (
        <Space size="small">
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteItem(index)}
            size="small"
            disabled={items.length <= 0}
          >
            删除
          </Button>
        </Space>
      ),
    },
    {
      title: '商品编号',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
      minWidth: 120,
      resizable: true,
      render: (_, __, index: number) => (
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
      width: 180,
      minWidth: 180,
      resizable: true,
      render: (_, __, index: number) => (
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
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      minWidth: 100,
      resizable: true,
      align: 'right',
      render: (_, __, index: number) => (
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
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      minWidth: 80,
      resizable: true,
      render: (_, __, index: number) => (
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
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      minWidth: 120,
      resizable: true,
      align: 'right',
      render: (_, __, index: number) => (
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
      width: 120,
      minWidth: 120,
      resizable: true,
      align: 'right',
      render: (_, __, index: number) => (
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
      title: '合计金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      minWidth: 120,
      resizable: true,
      align: 'right',
      render: (totalAmount: number) => formatPrice(totalAmount),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      minWidth: 150,
      resizable: true,
      render: (_, __, index: number) => (
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
                  placeholder="选择日期时间"
                  allowClear={false}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>客户信息</h3>
              <Form.Item
                name="customerId"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select
                  placeholder="选择客户"
                  onChange={handleCustomerChange}
                  style={{ width: 200 }}
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
                    <Table.Summary.Cell colSpan={6} align="right">
                      <strong>合计：</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <strong>{formatPrice(totalInfo.totalOriginalAmount)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <strong>{formatPrice(totalInfo.totalDiscountAmount)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <strong style={{ color: '#ff4d4f' }}>{formatPrice(totalInfo.totalAmount)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell colSpan={2} />
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
          setSelectedItemIndex(null);
        }}
        onSelect={handleProductSelect}
      />
    </>
  );
};

export default SaleOrderForm;
