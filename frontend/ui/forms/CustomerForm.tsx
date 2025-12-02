'use client';
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, message, Select } from 'antd';
import { CreateCustomerDto, UpdateCustomerDto } from '../../lib/types/customer-types';
import { customerService } from '../../lib/services/customerService';

const { Option } = Select;

interface CustomerFormProps {
  initialValues?: Partial<CreateCustomerDto & { id?: number }> | null;
  onSubmit: (values: CreateCustomerDto | UpdateCustomerDto) => Promise<void> | void;
  onCancel?: () => void;
  isEditing?: boolean;
  visible?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialValues = null,
  onSubmit,
  onCancel,
  isEditing = false,
  visible = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 生成客户编号
  const generateCustomerCode = async () => {
    try {
      const code = await customerService.generateCustomerCode();
      form.setFieldValue('code', code);
    } catch (error) {
      console.error('Failed to generate customer code:', error);
      message.error('生成客户编号失败，请手动输入');
      // 不设置默认值，让用户手动输入
    }
  };

  // 监听visible变化，重新初始化表单
  useEffect(() => {
    if (visible) {
      if (isEditing && initialValues) {
        // 编辑模式：直接使用initialValues
        form.setFieldsValue({
          ...initialValues,
          status: initialValues.status === 1
        });
      } else {
        // 新增模式：重置表单并设置默认状态为启用，生成客户编号
        form.resetFields();
        form.setFieldsValue({ status: true });
        generateCustomerCode();
      }
    }
  }, [visible, isEditing, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 将Switch的布尔值转换为数字（1/0）
      const formattedValues = {
        ...values,
        status: values.status ? 1 : 0
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
          name="code"
          label="客户编号"
          rules={[
            { required: true, message: '请输入客户编号' }
          ]}
        >
          <Input placeholder="请输入客户编号" />
        </Form.Item>

        <Form.Item
          name="name"
          label="客户姓名"
          rules={[{ required: true, message: '请输入客户姓名' }]}
        >
          <Input placeholder="请输入客户姓名" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
          ]}
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>

        <Form.Item
          name="company"
          label="公司名"
        >
          <Input placeholder="请输入公司名（可选）" />
        </Form.Item>

        <Form.Item
          name="province"
          label="省份"
        >
          <Input placeholder="请输入省份" />
        </Form.Item>

        <Form.Item
          name="city"
          label="城市"
        >
          <Input placeholder="请输入城市" />
        </Form.Item>

        <Form.Item
          name="district"
          label="区县"
        >
          <Input placeholder="请输入区县" />
        </Form.Item>

        <Form.Item
          name="address"
          label="详细地址"
        >
          <Input placeholder="请输入详细地址" />
        </Form.Item>
      </div>

      <Form.Item
        name="remark"
        label="备注"
      >
        <Input.TextArea rows={4} placeholder="请输入备注" />
      </Form.Item>

      <Form.Item
        name="status"
        label="启用状态"
        valuePropName="checked"
      >
        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
      </Form.Item>

      <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
          {isEditing ? '更新客户' : '创建客户'}
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

export default CustomerForm;
