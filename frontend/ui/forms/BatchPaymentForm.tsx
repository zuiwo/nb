'use client';
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select, DatePicker, Table, InputNumber, App } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { CreatePaymentDto } from '../../lib/types/payment-types';
import { Customer } from '../../lib/types/customer-types';
import { DictionaryItem } from '../../lib/types/dictionary-types';
import { SaleOrder } from '../../lib/types/sale-order-types';
import { dictionaryService } from '../../lib/services/dictionaryService';
import { settingService } from '../../lib/services/settingService';

const { Option } = Select;

interface BatchPaymentFormProps {
  onSubmit: (values: { payments: CreatePaymentDto[] }) => Promise<void> | void;
  onCancel?: () => void;
  visible?: boolean;
  customers: Customer[];
  saleOrders?: SaleOrder[];
}

const BatchPaymentForm: React.FC<BatchPaymentFormProps> = ({
  onSubmit,
  onCancel,
  visible = false,
  customers,
  saleOrders = [],
}) => {
  const { message } = App.useApp();
  const [payments, setPayments] = useState<CreatePaymentDto[]>([
    { paymentDate: dayjs().format('YYYY-MM-DD'), customerId: 0, saleOrderIds: [], amount: 0, paymentMethod: '', account: '' }
  ]);
  const [paymentMethods, setPaymentMethods] = useState<DictionaryItem[]>([]);
  const [accounts, setAccounts] = useState<DictionaryItem[]>([]);
  const [dictLoading, setDictLoading] = useState(true);

  // 加载设置和字典数据
  const loadDictData = async () => {
    try {
      setDictLoading(true);
      // 获取设置数据
      const settingsData = await settingService.getSettings();
      
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
      message.error('加载字典数据失败');
    } finally {
      setDictLoading(false);
    }
  };

  // 获取字典数据
  useEffect(() => {
    if (visible) {
      loadDictData();
    }
  }, [visible, loadDictData]);

  // 监听visible变化，重新初始化表单
  useEffect(() => {
    if (visible) {
      // 重置表单，默认添加一行
      setPayments([
        { paymentDate: dayjs().format('YYYY-MM-DD'), customerId: 0, saleOrderIds: [], amount: 0, paymentMethod: '', account: '' }
      ]);
    }
  }, [visible]);

  // 添加一行
  const addRow = () => {
    setPayments([
      ...payments,
      { paymentDate: dayjs().format('YYYY-MM-DD'), customerId: 0, saleOrderIds: [], amount: 0, paymentMethod: '', account: '' }
    ]);
  };

  // 删除一行
  const removeRow = (index: number) => {
    if (payments.length <= 1) {
      message.warning('至少保留一行');
      return;
    }
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  // 更新行数据
  const updateRow = <K extends keyof CreatePaymentDto>(index: number, field: K, value: CreatePaymentDto[K]) => {
    const newPayments = [...payments];
    newPayments[index] = {
      ...newPayments[index],
      [field]: value
    };
    setPayments(newPayments);
  };

  const handleSubmit = async () => {
    try {
      // 验证所有行的数据
      const valid = payments.every(payment => {
        return (
          payment.paymentDate &&
          payment.customerId > 0 &&
          payment.amount > 0
          // paymentMethod 和 account 不再必填
        );
      });

      if (!valid) {
        message.error('请填写所有必填字段');
        return;
      }

      // 格式化日期为字符串
      const formattedPayments = payments.map(payment => ({
        ...payment,
        paymentDate: payment.paymentDate.split('T')[0] // 确保日期格式正确
      }));

      await onSubmit({ payments: formattedPayments });
    } catch (error) {
      console.error('Submit failed:', error);
      if (error instanceof Error) {
        message.error(error.message || '提交失败，请重试');
      } else {
        message.error('提交失败，请重试');
      }
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '收款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 150,
      render: (_: string, __: CreatePaymentDto, index: number) => (
        <DatePicker
          style={{ width: '100%' }}
          value={payments[index].paymentDate ? dayjs(payments[index].paymentDate) : undefined}
          onChange={(date) => updateRow(index, 'paymentDate', date ? date.format('YYYY-MM-DD HH:mm') : '')}
          showTime={{ format: 'HH:mm' }}
          format="YYYY-MM-DD HH:mm"
        />
      ),
    },
    {
      title: '客户名',
      dataIndex: 'customerId',
      key: 'customerId',
      width: 180,
      render: (_: number, __: CreatePaymentDto, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder="选择客户"
          value={payments[index].customerId || undefined}
          onChange={(value) => updateRow(index, 'customerId', value)}
        >
          {customers.map(customer => (
            <Option key={customer.id} value={customer.id}>
              {customer.code} {customer.name} {customer.phone}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '订单号',
      dataIndex: 'saleOrderIds',
      key: 'saleOrderIds',
      width: 180,
      render: (_: number[], __: CreatePaymentDto, index: number) => (
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="选择订单号"
          value={payments[index].saleOrderIds || undefined}
          onChange={(value) => updateRow(index, 'saleOrderIds', value)}
          showSearch
          filterOption={(input, option) => {
            if (!option || !option.children) return false;
            // 直接将option.children转换为字符串，因为我们知道它是字符串类型
            const orderCode = String(option.children);
            return orderCode.toLowerCase().includes(input.toLowerCase());
          }}
        >
          {saleOrders.map(order => (
            <Option key={order.id} value={order.id}>
              {order.code} - {order.customerName}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '付款金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (_: number, __: CreatePaymentDto, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          placeholder="输入金额"
          min={0.01}
          step={0.01}
          value={payments[index].amount}
          onChange={(value) => updateRow(index, 'amount', value || 0)}
          formatter={(value) => `¥ ${value}`}
          parser={(value) => parseFloat(value?.replace(/¥\s?/, '') || '0')}
        />
      ),
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (_: string, __: CreatePaymentDto, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder="选择付款方式"
          value={payments[index].paymentMethod || undefined}
          onChange={(value) => updateRow(index, 'paymentMethod', value)}
          loading={dictLoading}
          allowClear
        >
          {paymentMethods.map(method => (
            <Option key={method.code} value={method.code}>
              {method.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '收款账户',
      dataIndex: 'account',
      key: 'account',
      width: 120,
      render: (_: string, __: CreatePaymentDto, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder="选择收款账户"
          value={payments[index].account || undefined}
          onChange={(value) => updateRow(index, 'account', value)}
          loading={dictLoading}
          allowClear
        >
          {accounts.map(account => (
            <Option key={account.code} value={account.code}>
              {account.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '付款公司',
      dataIndex: 'payerCompany',
      key: 'payerCompany',
      width: 150,
      render: (_: string, __: CreatePaymentDto, index: number) => (
        <Input
          placeholder="付款公司"
          value={payments[index].payerCompany || ''}
          onChange={(e) => updateRow(index, 'payerCompany', e.target.value)}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      render: (_: string, __: CreatePaymentDto, index: number) => (
        <Input.TextArea
          rows={1}
          placeholder="备注"
          value={payments[index].remark || ''}
          onChange={(e) => updateRow(index, 'remark', e.target.value)}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: string, __: CreatePaymentDto, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeRow(index)}
          iconOnly
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addRow}>
          添加行
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={payments.map((_, index) => ({ ..._, key: index }))}
        pagination={false}
        scroll={{ x: 1000 }}
        bordered
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Button type="primary" onClick={handleSubmit} style={{ marginRight: 8 }}>
          批量创建
        </Button>
        {onCancel && (
          <Button onClick={onCancel}>
            取消
          </Button>
        )}
      </div>
    </div>
  );
};

export default BatchPaymentForm;
