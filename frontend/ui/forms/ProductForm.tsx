'use client';
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, InputNumber, message, Select } from 'antd';
import { CreateProductDto, UpdateProductDto } from '../../lib/types/product-types';
import { productService } from '../../lib/services/productService';
import { settingService } from '../../lib/services/settingService';
import { dictionaryService } from '../../lib/services/dictionaryService';
import { Setting } from '../../lib/types/setting-types';
import { DictionaryItem } from '../../lib/types/dictionary-types';

const { Option } = Select;

interface ProductFormProps {
  initialValues?: Partial<CreateProductDto & { id?: number }> | null;
  onSubmit: (values: CreateProductDto | UpdateProductDto) => Promise<void> | void;
  onCancel?: () => void;
  isEditing?: boolean;
  visible?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialValues = null,
  onSubmit,
  onCancel,
  isEditing = false,
  visible = false,
}) => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<DictionaryItem[]>([]);
  const [brandOptions, setBrandOptions] = useState<DictionaryItem[]>([]);
  const [unitOptions, setUnitOptions] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 生成产品编号
  const generateProductCode = async () => {
    try {
      const code = await productService.generateProductCode();
      form.setFieldValue('code', code);
    } catch (error) {
      console.error('Failed to generate product code:', error);
      form.setFieldValue('code', 'P0001'); // 生成失败时使用默认值
    }
  };

  // 加载设置和字典数据
  const loadDictData = async () => {
    try {
      setLoading(true);
      const settingsData = await settingService.getSettings();
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
      console.error('Failed to load dictionary data:', error);
      message.error('加载字典数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听visible变化，重新初始化表单
  useEffect(() => {
    if (visible) {
      loadDictData();
      
      if (isEditing && initialValues) {
        // 编辑模式：直接使用initialValues
        form.setFieldsValue({
          ...initialValues,
          status: initialValues.status === 1
        });
      } else {
        // 新增模式：重置表单并生成产品编号
        form.resetFields();
        generateProductCode();
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
          label="产品编号"
          rules={[
            { required: true, message: '请输入产品编号' }
          ]}
        >
          <Input placeholder="请输入产品编号" />
        </Form.Item>

        <Form.Item
          name="name"
          label="产品名称"
          rules={[{ required: true, message: '请输入产品名称' }]}
        >
          <Input placeholder="请输入产品名称" />
        </Form.Item>

        <Form.Item
          name="price"
          label="价格"
          rules={[{ required: true, message: '请输入价格', type: 'number', min: 0 }]}
        >
          <InputNumber<number>
            style={{ width: '100%' }}
            placeholder="请输入价格"
            min={0}
            step={0.01}
            formatter={value => `¥ ${value}`}
            parser={value => parseFloat(value?.replace(/¥\s?/, '') || '0')}
          />
        </Form.Item>

        <Form.Item
          name="category"
          label="产品分类"
        >
          <Select placeholder="请选择产品分类（可选）" loading={loading}>
            {categoryOptions.map(item => (
              <Option key={item.code} value={item.code}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="brand"
          label="品牌"
        >
          <Select placeholder="请选择品牌（可选）" loading={loading}>
            {brandOptions.map(item => (
              <Option key={item.code} value={item.code}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="unit"
          label="单位"
        >
          <Select placeholder="请选择单位（可选）" loading={loading}>
            {unitOptions.map(item => (
              <Option key={item.code} value={item.code}>
                {item.name}
              </Option>
            ))}
          </Select>
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
          {isEditing ? '更新产品' : '创建产品'}
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

export default ProductForm;
