'use client';
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Input,
  Table,
  Modal,
  Form,
  Select,
  Switch,
  message,
  Space,
  Card,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { dictionaryService } from '../../../lib/services/dictionaryService';
import {
  DictionaryType,
  DictionaryItem,
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
  CreateDictionaryItemRequest,
  UpdateDictionaryItemRequest
} from '../../../lib/types/dictionary-types';

const { Title, Text } = Typography;
const { Option } = Select;

const DictionaryManagementPage = () => {
  // 状态管理
  const [dictTypes, setDictTypes] = useState<DictionaryType[]>([]);
  const [dictItems, setDictItems] = useState<DictionaryItem[]>([]);
  const [selectedDictType, setSelectedDictType] = useState<DictionaryType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [itemSearchText, setItemSearchText] = useState<string>('');

  // 弹窗状态
  const [typeModalVisible, setTypeModalVisible] = useState<boolean>(false);
  const [itemModalVisible, setItemModalVisible] = useState<boolean>(false);
  const [isEditingType, setIsEditingType] = useState<boolean>(false);
  const [isEditingItem, setIsEditingItem] = useState<boolean>(false);
  const [currentType, setCurrentType] = useState<DictionaryType | null>(null);
  const [currentItem, setCurrentItem] = useState<DictionaryItem | null>(null);

  // 表单实例
  const [typeForm] = Form.useForm<CreateDictionaryTypeRequest | UpdateDictionaryTypeRequest>();
  const [itemForm] = Form.useForm<CreateDictionaryItemRequest | UpdateDictionaryItemRequest>();

  // 加载字典类型
  const loadDictTypes = async () => {
    try {
      setLoading(true);
      const types = await dictionaryService.getDictionaryTypes();
      setDictTypes(types);
      if (types.length > 0 && !selectedDictType) {
        setSelectedDictType(types[0]);
      }
    } catch (error) {
      message.error('加载字典类型失败');
      console.error('Failed to load dictionary types:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载字典项
  const loadDictItems = async (dictTypeCode?: string) => {
    try {
      setLoading(true);
      const items = await dictionaryService.getDictionaryItems(dictTypeCode);
      setDictItems(items);
    } catch (error) {
      message.error('加载字典项失败');
      console.error('Failed to load dictionary items:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadDictTypes();
  }, []);

  // 当选中的字典类型变化时，加载对应的字典项
  useEffect(() => {
    if (selectedDictType) {
      loadDictItems(selectedDictType.code);
    } else {
      setDictItems([]);
    }
  }, [selectedDictType]);

  // 筛选字典项
  const filteredItems = dictItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchText.toLowerCase()) ||
    item.code.toLowerCase().includes(itemSearchText.toLowerCase())
  );

  // 处理字典类型选择
  const handleTypeSelect = (type: DictionaryType) => {
    setSelectedDictType(type);
  };

  // 处理新增字典类型
  const handleAddType = () => {
    setIsEditingType(false);
    setCurrentType(null);
    typeForm.resetFields();
    setTypeModalVisible(true);
  };

  // 处理编辑字典类型
  const handleEditType = (type: DictionaryType) => {
    setIsEditingType(true);
    setCurrentType(type);
    typeForm.setFieldsValue({
      name: type.name,
    });
    setTypeModalVisible(true);
  };

  // 处理保存字典类型
  const handleSaveType = async () => {
    try {
      const values = await typeForm.validateFields();
      
      if (isEditingType && currentType) {
        // 更新字典类型
        await dictionaryService.updateDictionaryType(currentType.id, values as UpdateDictionaryTypeRequest);
        message.success('字典类型更新成功');
      } else {
        // 创建字典类型
        await dictionaryService.createDictionaryType(values as CreateDictionaryTypeRequest);
        message.success('字典类型创建成功');
      }
      
      setTypeModalVisible(false);
      loadDictTypes();
    } catch (error) {
      console.error('Failed to save dictionary type:', error);
      message.error('保存字典类型失败');
    }
  };

  // 处理删除字典类型
  const handleDeleteType = async (id: number) => {
    try {
      await dictionaryService.deleteDictionaryType(id);
      message.success('字典类型删除成功');
      loadDictTypes();
      if (selectedDictType?.id === id) {
        setSelectedDictType(null);
      }
    } catch (error) {
      console.error('Failed to delete dictionary type:', error);
      message.error('删除字典类型失败');
    }
  };

  // 处理新增字典项
  const handleAddItem = () => {
    if (!selectedDictType) {
      message.warning('请先选择字典类型');
      return;
    }
    
    setIsEditingItem(false);
    setCurrentItem(null);
    itemForm.resetFields();
    itemForm.setFieldsValue({
      dictTypeCode: selectedDictType.code,
    });
    setItemModalVisible(true);
  };

  // 处理编辑字典项
  const handleEditItem = (item: DictionaryItem) => {
    setIsEditingItem(true);
    setCurrentItem(item);
    itemForm.setFieldsValue({
      name: item.name,
      dictTypeCode: item.dictTypeCode,
      status: item.status,
    });
    setItemModalVisible(true);
  };

  // 处理保存字典项
  const handleSaveItem = async () => {
    try {
      const values = await itemForm.validateFields();
      
      if (isEditingItem && currentItem) {
        // 更新字典项
        await dictionaryService.updateDictionaryItem(currentItem.id, values as UpdateDictionaryItemRequest);
        message.success('字典项更新成功');
      } else {
        // 创建字典项
        await dictionaryService.createDictionaryItem(values as CreateDictionaryItemRequest);
        message.success('字典项创建成功');
      }
      
      setItemModalVisible(false);
      loadDictItems(selectedDictType?.code);
    } catch (error) {
      console.error('Failed to save dictionary item:', error);
      message.error('保存字典项失败');
    }
  };

  // 处理删除字典项
  const handleDeleteItem = async (id: number) => {
    try {
      await dictionaryService.deleteDictionaryItem(id);
      message.success('字典项删除成功');
      loadDictItems(selectedDictType?.code);
    } catch (error) {
      console.error('Failed to delete dictionary item:', error);
      message.error('删除字典项失败');
    }
  };

  // 处理状态切换
  const handleStatusChange = async (item: DictionaryItem, checked: boolean) => {
    try {
      await dictionaryService.updateDictionaryItem(item.id, {
        ...item,
        status: checked ? 1 : 0,
      } as UpdateDictionaryItemRequest);
      message.success('状态更新成功');
      loadDictItems(selectedDictType?.code);
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('状态更新失败');
    }
  };

  // 字典项表格列
  const itemColumns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: '25%',
    },
    {
      title: '字典值',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '25%',
      render: (status: number, record: DictionaryItem) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusChange(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '25%',
      render: (_: any, record: DictionaryItem) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
            style={{ color: '#1890ff' }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteItem(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>字典管理</Title>
      
      <Row gutter={[24, 24]}>
        {/* 左侧字典类型管理 */}
        <Col xs={24} md={8}>
          <Card title="字典列表" extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddType}
            >
              添加
            </Button>
          }>
            <div>
              {dictTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedDictType?.id === type.id ? '#e6f7ff' : 'transparent',
                    borderTop: '1px solid #f0f0f0',
                    borderRight: '1px solid #f0f0f0',
                    borderBottom: '1px solid #f0f0f0',
                    borderLeft: selectedDictType?.id === type.id ? '3px solid #1890ff' : '1px solid #f0f0f0',
                    marginBottom: 8,
                    borderRadius: 4,
                    padding: '12px 16px',
                    transition: 'all 0.3s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <Text strong>{type.name}</Text>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{type.code}</div>
                  </div>
                  <Space size="middle">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditType(type);
                      }}
                      style={{ color: '#1890ff' }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteType(type.id);
                      }}
                    />
                  </Space>
                </div>
              ))}
              {dictTypes.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                  暂无字典类型
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* 右侧字典项管理 */}
        <Col xs={24} md={16}>
          {selectedDictType ? (
            <Card 
              title={
                <Text strong style={{ fontSize: 18 }}>{selectedDictType.name} - 字典值管理</Text>
              } 
              extra={
                <Space>
                  <Input.Search
                    placeholder="搜索字典值"
                    allowClear
                    size="middle"
                    style={{ width: 200 }}
                    onSearch={setItemSearchText}
                    onChange={(e) => setItemSearchText(e.target.value)}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddItem}
                  >
                    添加
                  </Button>
                </Space>
              }
            >
              <Table
                columns={itemColumns}
                dataSource={filteredItems}
                rowKey="id"
                pagination={false}
                loading={loading}
                bordered
              />
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                <Text>请选择一个字典类型进行管理</Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* 字典类型弹窗 */}
      <Modal
        title={isEditingType ? '编辑字典类型' : '新建字典类型'}
        open={typeModalVisible}
        onCancel={() => setTypeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTypeModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveType}>
            确定
          </Button>
        ]}
        style={{ top: '20%' }}
      >
        <Form
          form={typeForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="字典类型名称"
            rules={[{ required: true, message: '请输入字典类型名称' }]}
          >
            <Input placeholder="请输入字典类型名称" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 字典项弹窗 */}
      <Modal
        title={isEditingItem ? '编辑字典值' : '新建字典值'}
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setItemModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveItem}>
            确定
          </Button>
        ]}
        style={{ top: '20%' }}
      >
        <Form
          form={itemForm}
          layout="vertical"
          initialValues={{
            status: 1,
          }}
        >
          <Form.Item
            name="name"
            label="字典值"
            rules={[{ required: true, message: '请输入字典值' }]}
          >
            <Input placeholder="请输入字典值" />
          </Form.Item>
          <Form.Item
            name="dictTypeCode"
            label="字典类型"
            rules={[{ required: true, message: '请选择字典类型' }]}
          >
            <Select disabled={!!selectedDictType} placeholder="请选择字典类型">
              {dictTypes.map(type => (
                <Option key={type.code} value={type.code}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DictionaryManagementPage;
