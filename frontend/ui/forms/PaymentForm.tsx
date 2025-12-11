'use client';
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select, DatePicker, InputNumber, App } from 'antd';
import dayjs from 'dayjs';
import { CreatePaymentDto, UpdatePaymentDto } from '../../lib/types/payment-types';
import { Customer } from '../../lib/types/customer-types';
import { DictionaryItem } from '../../lib/types/dictionary-types';
import { SaleOrder } from '../../lib/types/sale-order-types';
import { dictionaryService } from '../../lib/services/dictionaryService';
import { settingService } from '../../lib/services/settingService';


const { Option } = Select;
const { TextArea } = Input;

interface PaymentFormProps {
  initialValues?: Partial<CreatePaymentDto & { id?: number }> | null;
  onSubmit: (values: CreatePaymentDto | UpdatePaymentDto) => Promise<void> | void;
  onCancel?: () => void;
  isEditing?: boolean;
  visible?: boolean;
  customers: Customer[];
  saleOrders?: SaleOrder[];
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  initialValues = null,
  onSubmit,
  onCancel,
  isEditing = false,
  visible = false,
  customers,
  saleOrders = [],
}) => {
  // 获取App上下文，用于使用message实例
  const { message: antdMessage } = App.useApp();
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<DictionaryItem[]>([]);
  const [accounts, setAccounts] = useState<DictionaryItem[]>([]);
  const [dictLoading, setDictLoading] = useState(true);
  const [localSaleOrders, setLocalSaleOrders] = useState<SaleOrder[]>(saleOrders);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();

  // 加载设置和字典数据
  const loadDictData = async () => {
    try {
      setDictLoading(true);
      // 获取设置数据
      const settingsData = await settingService.getSettings();
      setSettings(settingsData);
      
      // 获取字典映射关系
      const paymentMethodDictCode = settingsData.find(s => s.key === 'payment_method_dict')?.value || '';
      const accountDictCode = settingsData.find(s => s.key === 'payment_account_dict')?.value || '';
      
      // 只有在字典映射不为空时才获取字典项
      let paymentMethodItems: DictionaryItem[] = [];
      let accountItems: DictionaryItem[] = [];
      
      if (paymentMethodDictCode) {
        paymentMethodItems = await dictionaryService.getDictionaryItems(paymentMethodDictCode);
      }
      
      if (accountDictCode) {
        accountItems = await dictionaryService.getDictionaryItems(accountDictCode);
      }
      
      // 过滤掉禁用状态的字典项，只保留启用状态的字典项
      setPaymentMethods(paymentMethodItems.filter(item => item.status === 1));
      setAccounts(accountItems.filter(item => item.status === 1));
      
    } catch (error) {
      console.error('Failed to load dictionary data:', error);
      antdMessage.error('加载字典数据失败');
    } finally {
      setDictLoading(false);
    }
  };

  // 获取字典数据
  useEffect(() => {
    if (visible) {
      loadDictData();
    }
  }, [visible]);

  // 监听saleOrders或selectedCustomerId变化，更新本地订单列表
  useEffect(() => {
    setLocalSaleOrders(saleOrders);
  }, [saleOrders]);

  // 当selectedCustomerId变化时，过滤订单列表
  useEffect(() => {
    if (selectedCustomerId) {
      setLocalSaleOrders(saleOrders.filter(order => order.customerId === selectedCustomerId));
    } else {
      setLocalSaleOrders(saleOrders);
    }
  }, [selectedCustomerId, saleOrders]);

  // 当initialValues变化时，设置selectedCustomerId
  useEffect(() => {
    if (initialValues?.customerId) {
      setSelectedCustomerId(initialValues.customerId);
    }
  }, [initialValues]);

  // 监听visible变化，重新初始化表单
  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // 无论编辑还是新增模式，只要有初始值就使用
        form.setFieldsValue({
          ...initialValues,
          paymentDate: initialValues.paymentDate ? dayjs(initialValues.paymentDate) : undefined
        });
      } else {
        // 新增模式且无初始值：重置表单，默认收款日期为今天
        form.resetFields();
        form.setFieldValue('paymentDate', dayjs());
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 格式化日期为字符串
      const formattedValues = {
        ...values,
        paymentDate: values.paymentDate ? values.paymentDate.format('YYYY-MM-DD') : undefined
      };
      await onSubmit(formattedValues);
    } catch (error) {
      console.error('Submit failed:', error);
      if (error instanceof Error) {
        message.error(error.message || '提交失败，请重试');
      } else {
        message.error('提交失败，请重试');
      }
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Form.Item
          name="paymentDate"
          label="收款日期"
          rules={[{ required: true, message: '请选择收款日期' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder="选择日期"
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="customerId"
          label="客户名"
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <Select 
            placeholder="请选择客户" 
            loading={loading}
            allowClear
            onChange={(value) => {
              setSelectedCustomerId(value);
              // 客户变化时，重置订单选择
              form.setFieldValue('saleOrderIds', []);
            }}
          >
            {customers.map(customer => (
            <Option key={customer.id} value={customer.id}>
              {customer.code} {customer.name} {customer.phone}
            </Option>
          ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="saleOrderIds"
          label="订单号"
          rules={[{ required: true, message: '请选择订单号' }]}
        >
          <Select
            mode="multiple"
            placeholder="请选择订单号"
            loading={loading}
            showSearch
            filterOption={(input, option) => {
              if (!option || !option.children) return false;
              // 直接将option.children转换为字符串，因为我们知道它是字符串类型
              const orderCode = String(option.children);
              return orderCode.toLowerCase().includes(input.toLowerCase());
            }}
            onChange={(values) => {
              // 选择订单后，如果没有选择客户，则自动填充客户信息
              if (values.length > 0 && !selectedCustomerId) {
                const firstOrder = saleOrders.find(order => order.id === values[0]);
                if (firstOrder) {
                  form.setFieldValue('customerId', firstOrder.customerId);
                  setSelectedCustomerId(firstOrder.customerId);
                }
              }
            }}
          >
            {saleOrders
              // 根据选择的客户过滤订单
              .filter(order => !selectedCustomerId || order.customerId === selectedCustomerId)
              .map(order => (
              <Option key={order.id} value={order.id}>
                {order.code} - {order.customerName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label="付款金额"
          rules={[
            { required: true, message: '请输入付款金额' },
            { type: 'number', min: 0.01, message: '付款金额必须大于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入付款金额"
            min={0.01}
            step={0.01}
            formatter={value => `¥ ${value}`}
            parser={(value) => {
              const parsed = parseFloat(value?.replace(/¥\s?/, '') || '0');
              return parsed as 0.01;
            }}
          />
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="付款方式"
          rules={[{ required: false, message: '请选择付款方式' }]}
        >
          <Select placeholder="请选择付款方式" loading={dictLoading} allowClear>
            {paymentMethods.map(method => (
              <Option key={method.code} value={method.code}>
                {method.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="account"
          label="收款账户"
          rules={[{ required: false, message: '请选择收款账户' }]}
        >
          <Select placeholder="请选择收款账户" loading={dictLoading} allowClear>
            {accounts.map(account => (
              <Option key={account.code} value={account.code}>
                {account.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="payerCompany"
          label="付款公司"
        >
          <Input placeholder="请输入付款公司（可选）" />
        </Form.Item>
      </div>

      <Form.Item
        name="remark"
        label="备注"
      >
        <TextArea rows={4} placeholder="请输入备注" />
      </Form.Item>

      <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
          {isEditing ? '更新收款记录' : '创建收款记录'}
        </Button>
        {onCancel && (
          <Button onClick={onCancel}>
            取消
          </Button>
        )}
      </Form.Item>
    </Form>
  );
};

export default PaymentForm;
