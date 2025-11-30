'use client';
import React, { useState, useEffect } from 'react';
import { Typography, Form, Select, Button, message, Card, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { settingService } from '../../../lib/services/settingService';
import { dictionaryService } from '../../../lib/services/dictionaryService';
import { Setting } from '../../../lib/types/setting-types';
import { DictionaryType } from '../../../lib/types/dictionary-types';

const { Title } = Typography;
const { Option } = Select;

const SystemSettingsPage = () => {
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
        const formData: any = {};
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
  }, [form]);

  // 保存设置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      // 将表单数据转换为设置数据
      const updatedSettings = settings.map(setting => ({
        ...setting,
        value: values[setting.key]
      }));
      
      // 更新设置
      await settingService.updateSettings(updatedSettings);
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
