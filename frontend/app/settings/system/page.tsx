'use client';
import React, { useState, useEffect } from 'react';
import { Typography, Form, Select, Button, Card, Space, App } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { settingService } from '../../../lib/services/settingService';
import { dictionaryService } from '../../../lib/services/dictionaryService';
import { Setting } from '../../../lib/types/setting-types';
import { DictionaryType } from '../../../lib/types/dictionary-types';

const { Title } = Typography;
const { Option } = Select;

const SystemSettingsPage = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [dictTypes, setDictTypes] = useState<DictionaryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 加载设置和字典类型
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [settingsData, dictTypesData] = await Promise.all([
          settingService.getSettings(),
          dictionaryService.getDictionaryTypes()
        ]);
        setSettings(settingsData);
        setDictTypes(dictTypesData);
        
        // 将设置数据转换为表单数据
        const formData: Record<string, string> = {};
        settingsData.forEach(setting => {
          formData[setting.key] = setting.value;
        });
        form.setFieldsValue(formData);
      } catch (error) {
        console.error('Failed to load data:', error);
        message.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [form, message]);

  // 保存设置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      // 将表单数据转换为设置数据，包括新增的设置
      const settingKeys = Object.keys(values);
      const updatedSettings: Setting[] = [];
      
      // 处理现有设置
      const existingSettingKeys = new Set(settings.map(s => s.key));
      
      // 更新现有设置
      settings.forEach(setting => {
        updatedSettings.push({
          ...setting,
          value: values[setting.key]
        });
      });
      
      // 添加新设置
      settingKeys.forEach(key => {
        if (!existingSettingKeys.has(key)) {
          updatedSettings.push({
            id: 0, // 新设置，id由后端生成
            key: key,
            value: values[key],
            description: key.includes('payment_method') ? '付款方式字典' : '收款账户字典',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
      
      // 更新设置
      await settingService.updateSettings(updatedSettings);
      
      // 使用组件内的message方法，避免V6上下文问题
      message.success('设置保存成功');
    } catch (error) {
      console.error('Failed to save settings:', error);
      message.error('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>系统设置</Title>
      <Card title="字典映射配置" style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="product_category_dict"
              label="产品分类字典"
              rules={[{ required: true, message: '请选择产品分类字典' }]}
            >
              <Select placeholder="请选择产品分类字典">
                {dictTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="product_brand_dict"
              label="品牌字典"
              rules={[{ required: true, message: '请选择品牌字典' }]}
            >
              <Select placeholder="请选择品牌字典">
                {dictTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="product_unit_dict"
              label="单位字典"
              rules={[{ required: true, message: '请选择单位字典' }]}
            >
              <Select placeholder="请选择单位字典">
                {dictTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="payment_method_dict"
              label="付款方式字典"
              rules={[{ required: true, message: '请选择付款方式字典' }]}
            >
              <Select placeholder="请选择付款方式字典">
                {dictTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="payment_account_dict"
              label="收款账户字典"
              rules={[{ required: true, message: '请选择收款账户字典' }]}
            >
              <Select placeholder="请选择收款账户字典">
                {dictTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                保存设置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SystemSettingsPage;
