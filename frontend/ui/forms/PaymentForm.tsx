'use client';
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select, DatePicker, InputNumber } from 'antd';
import { CreatePaymentDto, UpdatePaymentDto } from '../../lib/types/payment-types';
import { Customer } from '../../lib/types/customer-types';
import { formatPrice } from '@/lib/utils/format';

const { Option } = Select;
const { TextArea } = Input;

interface PaymentFormProps {
  initialValues?: Partial<CreatePaymentDto & { id?: number }> | null;
  onSubmit: (values: CreatePaymentDto | UpdatePaymentDto) => Promise<void> | void;
  onCancel?: () => void;
  isEditing?: boolean;
  visible?: boolean;
  customers: Customer[];
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  initialValues = null,
  onSubmit,
  onCancel,
  isEditing = false,
  visible = false,
  customers,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 监听visible变化，重新初始化表单
  useEffect(() => {
    if (visible) {
      if (isEditing && initialValues) {
        // 编辑模式：直接使用initialValues
        form.setFieldsValue({
          ...initialValues,
          paymentDate: initialValues.paymentDate ? new Date(initialValues.paymentDate) : undefined
        });
      } else {
        // 新增模式：重置表单，默认收款日期为今天
        form.resetFields();
        form.setFieldValue('paymentDate', new Date());
      }
    }
  }, [visible, isEditing, initialValues, form]);

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
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="customerId"
          label="客户名"
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <Select placeholder="请选择客户" loading={loading}>
            {customers.map(customer => (
              <Option key={customer.id} value={customer.id}>
                {customer.code} {customer.name}
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
            parser={value => parseFloat(value?.replace(/¥\s?/, '') || '0')}
          />
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="付款方式"
          rules={[{ required: true, message: '请输入付款方式' }]}
        >
          <Input placeholder="请输入付款方式" />
        </Form.Item>

        <Form.Item
          name="account"
          label="收款账户"
          rules={[{ required: true, message: '请输入收款账户' }]}
        >
          <Input placeholder="请输入收款账户" />
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
