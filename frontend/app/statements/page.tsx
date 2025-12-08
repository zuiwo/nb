'use client';
import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, DatePicker, Select, message, App, Tabs, Progress } from 'antd';
import { SyncOutlined, SearchOutlined } from '@ant-design/icons';
import { statementService } from '@/lib/services/statementService';
import { customerService } from '@/lib/services/customerService';
import { StatementRecord } from '@/lib/types/statement-types';
import { Customer } from '@/lib/types/customer-types';
import { formatPrice, formatDate } from '@/lib/utils/format';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const StatementsPage = () => {
  const { message: antdMessage } = App.useApp();
  const [statements, setStatements] = useState<StatementRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('statements');
  const [searchParams, setSearchParams] = useState({
    customerId: undefined as number | undefined,
    startTime: undefined as string | undefined,
    endTime: undefined as string | undefined,
  });
  const [localSearchParams, setLocalSearchParams] = useState({
    customerId: undefined as number | undefined,
    dateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100); // 默认每页100条
  const [total, setTotal] = useState(0);

  // 加载对帐单和客户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [customersData] = await Promise.all([
          customerService.getCustomers(),
        ]);
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 监听searchParams或currentPage或pageSize变化，自动获取数据
  useEffect(() => {
    fetchStatements();
  }, [searchParams, currentPage, pageSize]);

  // 获取对帐单数据
  const fetchStatements = async () => {
    try {
      setLoading(true);
      const params = {
        ...searchParams,
        page: currentPage,
        pageSize: pageSize,
      };
      const response = await statementService.getStatements(params);
      setStatements(Array.isArray(response.records) ? response.records : []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('获取对帐单失败:', error);
      antdMessage.error('获取对帐单失败');
      setStatements([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 手动同步对帐单
  const handleSyncStatements = async () => {
    try {
      setSyncing(true);
      await statementService.syncStatements();
      antdMessage.success('对帐单同步成功');
      await fetchStatements();
    } catch (error) {
      console.error('同步对帐单失败:', error);
      antdMessage.error('同步对帐单失败');
    } finally {
      setSyncing(false);
    }
  };

  // 搜索处理
  const handleSearch = () => {
    // 转换日期范围为字符串
    const newSearchParams = {
      customerId: localSearchParams.customerId,
      startTime: localSearchParams.dateRange?.[0].format('YYYY-MM-DD'),
      endTime: localSearchParams.dateRange?.[1].format('YYYY-MM-DD'),
    };
    setSearchParams(newSearchParams);
    setCurrentPage(1); // 搜索时重置到第一页
  };

  // 重置搜索条件
  const handleReset = () => {
    const resetParams = {
      customerId: undefined,
      dateRange: undefined,
    };
    setLocalSearchParams(resetParams);
    setSearchParams({
      customerId: undefined,
      startTime: undefined,
      endTime: undefined,
    });
    setCurrentPage(1);
  };

  // 数据统计处理
  const processStatistics = () => {
    // 按客户分组，获取每个客户的所有记录
    const customerMap = new Map<number, StatementRecord[]>();
    statements.forEach(record => {
      if (!customerMap.has(record.customerId)) {
        customerMap.set(record.customerId, []);
      }
      customerMap.get(record.customerId)?.push(record);
    });
    
    // 处理每个客户的统计数据
    const stats = [];
    for (const [customerId, records] of customerMap.entries()) {
      // 按日期排序，获取最新记录
      const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestRecord = sortedRecords[0];
      
      // 计算最后发货时间
      const shipmentRecords = sortedRecords.filter(r => r.saleAmount > 0);
      const lastShipmentTime = shipmentRecords.length > 0 
        ? shipmentRecords[0].date 
        : '-';
      
      stats.push({
        customerId: latestRecord.customerId,
        customerCode: latestRecord.customerCode,
        customerName: latestRecord.customerName,
        lastShipmentTime,
        balance: latestRecord.balance
      });
    }
    
    // 按欠款金额从大到小排序
    return stats.sort((a, b) => b.balance - a.balance);
  };

  // 计算最大欠款金额，用于进度条比例
  const getMaxBalance = () => {
    const stats = processStatistics();
    return stats.length > 0 
      ? Math.max(...stats.map(s => Math.abs(s.balance)), 1)
      : 1;
  };

  // 表格列配置
  const columns = [
    {
      title: '客户编号',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: '12%',
      ellipsis: true,
      render: (date: string) => formatDate(date),
      sorter: true,
    },
    {
      title: '发货金额',
      dataIndex: 'saleAmount',
      key: 'saleAmount',
      width: '10%',
      ellipsis: true,
      render: (amount: number) => formatPrice(amount),
      align: 'right' as const,
    },
    {
      title: '收款金额',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      width: '10%',
      ellipsis: true,
      render: (amount: number) => formatPrice(amount),
      align: 'right' as const,
    },
    {
      title: '累计欠款',
      dataIndex: 'balance',
      key: 'balance',
      width: '10%',
      ellipsis: true,
      align: 'right' as const,
      // 欠款金额为正数时显示红色，小于等于0时显示黑色
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : '#000000' }}>
          {formatPrice(amount)}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: '30%',
      ellipsis: true,
    },
  ];

  // 统计表格列配置
  const statsColumns = [
    {
      title: '客户编号',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: '15%',
      ellipsis: true,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: '20%',
      ellipsis: true,
    },
    {
      title: '最后发货时间',
      dataIndex: 'lastShipmentTime',
      key: 'lastShipmentTime',
      width: '20%',
      ellipsis: true,
      render: (time: string) => time !== '-' ? formatDate(time) : '-',
    },
    {
      title: '累积欠款金额',
      dataIndex: 'balance',
      key: 'balance',
      width: '20%',
      ellipsis: true,
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : '#000000' }}>
          {formatPrice(amount)}
        </span>
      ),
    },
    {
      title: '欠款比例',
      dataIndex: 'balance',
      key: 'progress',
      width: '25%',
      ellipsis: true,
      render: (amount: number) => {
        const maxBalance = getMaxBalance();
        const percent = Math.min((Math.abs(amount) / maxBalance) * 100, 100);
        return (
          <Progress
            percent={percent}
            strokeColor={amount > 0 ? '#ff4d4f' : '#52c41a'}
            showInfo={false}
            style={{ width: '100%' }}
          />
        );
      },
    },
  ];

  return (
    <Spin spinning={loading} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: 0, width: '100%', overflowX: 'hidden' }}>
        {/* 标题行 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>对帐单</h2>
          <Button 
            type="primary" 
            icon={<SyncOutlined spin={syncing} />} 
            onClick={handleSyncStatements}
            loading={syncing}
          >
            手动同步
          </Button>
        </div>

        {/* 标签页 */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          style={{ marginBottom: 16 }} 
          items={[
            {
              key: 'statements',
              label: '对帐单',
              children: (
                <>
                  {/* 查询区域 */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      <Select
                        placeholder="选择客户"
                        allowClear
                        size="middle"
                        style={{ width: 200 }}
                        value={localSearchParams.customerId}
                        onChange={(value) => setLocalSearchParams({ ...localSearchParams, customerId: value })}
                        showSearch
                        filterOption={(input, option) => {
                          if (!option) return false;
                          const customer = customers.find(c => c.id === option.value);
                          if (!customer) return false;
                          const searchValue = input.toLowerCase();
                          return (
                            customer.code.toLowerCase().includes(searchValue) ||
                            customer.name.toLowerCase().includes(searchValue)
                          );
                        }}
                      >
                        {customers.map(customer => (
                          <Option key={customer.id} value={customer.id}>
                            {customer.code} {customer.name}
                          </Option>
                        ))}
                      </Select>
                      <RangePicker
                        size="middle"
                        style={{ width: 300 }}
                        value={localSearchParams.dateRange}
                        onChange={(dates) => setLocalSearchParams({ ...localSearchParams, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined })}
                        placeholder={['开始日期', '结束日期']}
                      />
                      <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        搜索
                      </Button>
                      <Button onClick={handleReset}>
                        重置
                      </Button>
                    </div>
                  </div>
                  
                  {/* 对帐单列表 */}
                  <div style={{ overflowX: 'auto', marginBottom: 16, maxWidth: '100%', boxSizing: 'border-box' }}>
                    <Table
                      columns={columns}
                      dataSource={statements}
                      rowKey="id"
                      loading={loading}
                      scroll={{ x: '1440px' }}
                      pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['50', '100', '200', '500'],
                        showTotal: (total) => `共 ${total} 条数据`,
                        showQuickJumper: true,
                        size: 'default',
                        locale: {
                          items_per_page: '/页',
                          jump_to: '跳到第',
                          jump_to_confirm: '页',
                          prev_page: '上一页',
                          next_page: '下一页',
                          page: '页',
                        },
                        total: total,
                        onChange: (page, size) => {
                          setCurrentPage(page);
                          setPageSize(size);
                          fetchStatements();
                        },
                        onShowSizeChange: (current, size) => {
                          setCurrentPage(1);
                          setPageSize(size);
                          fetchStatements();
                        }
                      }}
                      // 禁用表格拖动功能
                      onRow={() => ({
                        draggable: false,
                      })}
                      // 确保表格内元素不溢出
                      style={{
                        minWidth: '100%',
                        boxSizing: 'border-box',
                        tableLayout: 'fixed',
                      }}
                    />
                  </div>
                </>
              ),
            },
            {
              key: 'statistics',
              label: '数据统计',
              children: (
                <>
                  {/* 统计表格 */}
                  <div style={{ overflowX: 'auto', marginBottom: 16, maxWidth: '100%', boxSizing: 'border-box' }}>
                    <Table
                      columns={statsColumns}
                      dataSource={processStatistics()}
                      rowKey="customerId"
                      loading={loading}
                      scroll={{ x: '1440px' }}
                      pagination={{
                        current: 1,
                        pageSize: 100,
                        showSizeChanger: true,
                        pageSizeOptions: ['50', '100', '200'],
                        showTotal: (total) => `共 ${total} 条数据`,
                        showQuickJumper: true,
                        size: 'default',
                        locale: {
                          items_per_page: '/页',
                          jump_to: '跳到第',
                          jump_to_confirm: '页',
                          prev_page: '上一页',
                          next_page: '下一页',
                          page: '页',
                        },
                      }}
                      // 禁用表格拖动功能
                      onRow={() => ({
                        draggable: false,
                      })}
                      // 确保表格内元素不溢出
                      style={{
                        minWidth: '100%',
                        boxSizing: 'border-box',
                        tableLayout: 'fixed',
                      }}
                    />
                  </div>
                </>
              ),
            },
          ]}
        />
      </div>
    </Spin>
  );
};

export default StatementsPage;
