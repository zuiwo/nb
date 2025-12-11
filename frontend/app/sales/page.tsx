'use client';
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Table,
  Button,
  Drawer,
  message,
  Input,
  Space,
  Spin,
  Collapse,
  DatePicker,
  Modal,
  Select,
  Dropdown,
  MenuProps,
  App,
  Tag,
  Popconfirm,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DollarOutlined,
  EllipsisOutlined,
  PrinterOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { SaleOrder, SaleOrderListQuery, CreateSaleOrderDto, UpdateSaleOrderDto } from '@/lib/types/sale-order-types';
import { saleOrderService } from '@/lib/services/saleOrderService';
import { Customer } from '@/lib/types/customer-types';
import { customerService } from '@/lib/services/customerService';
import { Product } from '@/lib/types/product-types';
import { productService } from '@/lib/services/productService';
import { Payment, CreatePaymentDto } from '@/lib/types/payment-types';
import { paymentService } from '@/lib/services/paymentService';
import { formatPrice, formatDate, formatDateOnly } from '@/lib/utils/format';
import { calculateOrderPaymentAmounts, getRelatedOrdersForMultiple, calculateAllOrderPaymentAmounts } from '@/lib/utils/payment-allocation';
import SaleOrderForm from '@/ui/forms/SaleOrderForm';
import PaymentForm from '@/ui/forms/PaymentForm';
import PaymentListModal from '@/ui/modals/PaymentListModal';
import SaleOrderPrint from '@/ui/components/SaleOrderPrint';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

// 订单状态常量定义
const ORDER_STATUS = {
  PENDING: { text: '待付款', value: 'pending', color: 'default' },
  UNSETTLED: { text: '未结清', value: 'unsettled', color: 'warning' },
  SETTLED: { text: '已结清', value: 'settled', color: 'success' }
};

// 获取订单状态
const getOrderStatus = (order: SaleOrder) => {
  if (order.paymentAmount === 0) {
    return ORDER_STATUS.PENDING;
  } else if (order.paymentAmount < order.orderAmount) {
    return ORDER_STATUS.UNSETTLED;
  } else {
    return ORDER_STATUS.SETTLED;
  }
};

const SalesPage = () => {
  const { message: antdMessage } = App.useApp();
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSaleOrder, setCurrentSaleOrder] = useState<SaleOrder | null>(null);
  // 收款表单状态
  const [isPaymentDrawerVisible, setIsPaymentDrawerVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [isPaymentEditing, setIsPaymentEditing] = useState(false);
  // 新增：控制收款列表弹窗
  const [isPaymentListModalVisible, setIsPaymentListModalVisible] = useState(false);
  const [currentOrderForPayment, setCurrentOrderForPayment] = useState<SaleOrder | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [searchParams, setSearchParams] = useState<SaleOrderListQuery>({
    code: '',
    customerName: '',
    createTimeRange: undefined,
    status: undefined,
  });
  const [localSearchParams, setLocalSearchParams] = useState<SaleOrderListQuery>({
    code: '',
    customerName: '',
    createTimeRange: undefined,
    status: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // 打印相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentPrintIndex, setCurrentPrintIndex] = useState(0);
  // 导入导出相关状态
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // 加载销售订单和客户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [saleOrdersData, customersData, paymentsData, productsData] = await Promise.all([
          saleOrderService.getSaleOrders(),
          customerService.getCustomers(),
          paymentService.getPayments(),
          productService.getProducts(),
        ]);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
        
        // 计算所有订单的收款金额
        const allOrders = Array.isArray(saleOrdersData) ? saleOrdersData : [];
        const allPayments = Array.isArray(paymentsData) ? paymentsData : [];
        
        const paymentMap = calculateAllOrderPaymentAmounts(allOrders, allPayments);
        const updatedOrders = allOrders.map(order => ({
          ...order,
          paymentAmount: paymentMap.get(order.id) || 0
        }));
        
        setSaleOrders(updatedOrders);
        setPayments(allPayments);
      } catch (error) {
        console.error('Failed to load data:', error);
        setSaleOrders([]);
        setCustomers([]);
        setProducts([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchSaleOrders = async () => {
    try {
      setLoading(true);
      // 获取最新的销售订单
      const data = await saleOrderService.getSaleOrders(searchParams);
      const allOrders = Array.isArray(data) ? data : [];
      
      // 确保使用最新的收款数据
      const latestPayments = await paymentService.getPayments();
      setPayments(latestPayments);
      
      // 计算所有订单的收款金额
      const paymentMap = calculateAllOrderPaymentAmounts(allOrders, latestPayments);
      const updatedOrders = allOrders.map(order => ({
        ...order,
        paymentAmount: paymentMap.get(order.id) || 0
      }));
      
      setSaleOrders(updatedOrders);
    } catch (error) {
      console.error('获取销售订单失败:', error);
      setSaleOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 手动触发重新计算收款金额
  const handleRecalculatePayments = async () => {
    try {
      setIsRecalculating(true);
      antdMessage.info('开始重新计算收款金额...');
      
      // 获取最新的销售订单和收款记录
      const [updatedOrders, updatedPayments] = await Promise.all([
        saleOrderService.getSaleOrders(),
        paymentService.getPayments()
      ]);
      
      // 重新计算所有订单的收款金额
      const paymentMap = calculateAllOrderPaymentAmounts(updatedOrders, updatedPayments);
      const updatedOrdersWithPayment = updatedOrders.map(order => ({
        ...order,
        paymentAmount: paymentMap.get(order.id) || 0
      }));
      
      setSaleOrders(updatedOrdersWithPayment);
      setPayments(updatedPayments);
      
      antdMessage.success('收款金额重新计算完成');
    } catch (error) {
      console.error('重新计算收款金额失败:', error);
      antdMessage.error('重新计算收款金额失败');
    } finally {
      setIsRecalculating(false);
    }
  };

  // 每日0点自动重新计算
  useEffect(() => {
    const checkAndRecalculate = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 10) {
        handleRecalculatePayments();
      }
    };

    // 每分钟检查一次
    const interval = setInterval(checkAndRecalculate, 60 * 1000);
    
    // 清理定时器
    return () => clearInterval(interval);
  }, []);

  // 搜索处理
  const handleSearch = () => {
    setSearchParams(localSearchParams);
    fetchSaleOrders();
  };

  // 重置搜索条件
  const handleReset = () => {
    const resetParams = {
      code: '',
      customerName: '',
      createTimeRange: undefined,
      status: undefined,
    };
    setLocalSearchParams(resetParams);
    setSearchParams(resetParams);
    fetchSaleOrders();
  };

  // 新增销售订单
  const handleCreate = () => {
    setIsEditing(false);
    setCurrentSaleOrder(null);
    setIsDrawerVisible(true);
  };

  // 编辑销售订单
  const handleEdit = (saleOrder: SaleOrder) => {
    setIsEditing(true);
    setCurrentSaleOrder(saleOrder);
    setIsDrawerVisible(true);
  };

  // 删除销售订单
  const handleDelete = async (id: number) => {
    try {
      await saleOrderService.deleteSaleOrder(id);
      antdMessage.success('销售订单删除成功');
      fetchSaleOrders();
    } catch (error) {
      console.error('销售订单删除失败:', error);
      message.error('销售订单删除失败');
    }
  };

  // 批量删除销售订单
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      antdMessage.warning('请先选择要删除的销售订单');
      return;
    }
    
    try {
      // 遍历选中的销售订单ID，逐一删除
      for (const id of selectedRowKeys) {
        await saleOrderService.deleteSaleOrder(Number(id));
      }
      antdMessage.success(`成功删除 ${selectedRowKeys.length} 条销售订单`);
      fetchSaleOrders();
      setSelectedRowKeys([]); // 清空选中状态
    } catch (error) {
      console.error('批量删除销售订单失败:', error);
      antdMessage.error('批量删除销售订单失败');
    }
  };

  // 添加收款 - 打开收款列表弹窗
  const handleAddPayment = (saleOrder: SaleOrder) => {
    setCurrentOrderForPayment(saleOrder);
    setIsPaymentListModalVisible(true);
  };

  // 打印销售单
  const handlePrint = (saleOrders: SaleOrder[]) => {
    // 创建一个新的 iframe 用于打印
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    // 获取 iframe 的 document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      antdMessage.error('打印失败：无法访问 iframe 文档');
      document.body.removeChild(iframe);
      setIsPrinting(false);
      return;
    }
    
    // 设置 iframe 的基本样式
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>销售单打印</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 0;
                font-family: SimSun, serif;
                font-size: 12px;
              }
              
              .sale-order-page {
                page-break-before: always;
              }
              
              .sale-order-page:first-child {
                page-break-before: auto;
              }
            }
            
            body {
              font-family: SimSun, serif;
              font-size: 12px;
              margin: 0;
              padding: 0.5cm;
            }
            
            .sale-order-page {
              margin-bottom: 1cm;
            }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    iframeDoc.close();
    
    // 等待 iframe 加载完成
    iframe.onload = () => {
      // 使用 ReactDOM.createRoot 渲染打印组件到 iframe 中
      import('react-dom/client').then((ReactDOM) => {
        const printRoot = iframeDoc.getElementById('print-root');
        if (!printRoot) {
          antdMessage.error('打印失败：无法找到打印根元素');
          document.body.removeChild(iframe);
          setIsPrinting(false);
          return;
        }
        
        const root = ReactDOM.createRoot(printRoot);
        root.render(
          <div>
            {saleOrders.map((saleOrder) => (
              <div key={saleOrder.id} className="sale-order-page">
                <SaleOrderPrint saleOrder={saleOrder} />
              </div>
            ))}
          </div>
        );
        
        // 等待组件渲染完成后调用打印
        setTimeout(() => {
          // 聚焦到 iframe 并打印
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          // 打印完成后清理
          setTimeout(() => {
            root.unmount();
            document.body.removeChild(iframe);
            setIsPrinting(false);
            antdMessage.success('打印完成');
          }, 100);
        }, 100);
      });
    };
  };

  // 批量打印销售单
  const handleBatchPrint = () => {
    if (selectedRowKeys.length === 0) {
      antdMessage.warning('请先选择要打印的销售单');
      return;
    }
    
    // 获取选中的销售单
    const selectedOrders = saleOrders.filter(order => selectedRowKeys.includes(order.id));
    
    // 设置打印状态
    setIsPrinting(true);
    
    // 调用打印函数，一次性打印所有选中的销售单
    handlePrint(selectedOrders);
  };

  // 导入相关函数
  const handleImport = async (file: File) => {
    setImportLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // 创建客户名称到ID的映射
      const customerMap: Record<string, number> = {};
      customers.forEach(customer => {
        customerMap[`${customer.code} ${customer.name}`] = customer.id;
        customerMap[customer.name] = customer.id; // 支持仅用名称查找
        customerMap[customer.code] = customer.id; // 支持仅用客户编号查找
      });
      
      // 创建产品名称/编码到ID的映射
      const productMap: Record<string, { id: number; unit: string }> = {};
      products.forEach(product => {
        productMap[`${product.code} ${product.name}`] = { id: product.id, unit: product.unit };
        productMap[product.name] = { id: product.id, unit: product.unit }; // 支持仅用名称查找
        productMap[product.code] = { id: product.id, unit: product.unit }; // 支持仅用产品编码查找
      });
      
      // 按订单号分组，将多行产品明细合并为一个订单
      const ordersMap: Record<string, any[]> = {};
      jsonData.forEach((item: any) => {
        const orderCode = item['订单号'];
        if (!ordersMap[orderCode]) {
          ordersMap[orderCode] = [];
        }
        ordersMap[orderCode].push(item);
      });
      
      // 转换数据格式，处理名称到ID的转换
      const ordersToImport: CreateSaleOrderDto[] = Object.entries(ordersMap).map(([orderCode, items]) => {
        const firstItem = items[0];
        
        // 转换客户名到客户ID
        let customerId = 0;
        // 确保客户名称被正确转换为字符串类型
        const customerName = String(firstItem['客户名'] || '');
        if (customerMap[customerName]) {
          customerId = customerMap[customerName];
        } else {
          throw new Error(`找不到客户：${customerName}`);
        }
        
        // 转换产品明细
        const saleOrderItems = items.map((item: any) => {
          // 确保所有字符串字段被正确转换为字符串类型
          const productCode = String(item['产品编码'] || '');
          const productName = String(item['产品名称'] || '');
          
          let productInfo = productMap[`${productCode} ${productName}`] || 
                           productMap[productName] || 
                           productMap[productCode];
          
          if (!productInfo) {
            throw new Error(`找不到产品：${productName} (${productCode})`);
          }
          
          return {
            productId: productInfo.id,
            productCode: productCode,
            productName: productName,
            quantity: parseInt(item['数量']) || 0,
            unit: productInfo.unit,
            price: parseFloat(item['单价']) || 0,
            discountAmount: parseFloat(item['优惠金额']) || 0,
            totalAmount: parseFloat(item['合计金额']) || 0,
            remark: String(item['备注'] || '')
          };
        });
        
        return {
          // 确保所有字符串字段被正确转换为字符串类型
          code: String(orderCode || ''),
          createTime: String(firstItem['创建时间'] || new Date().toISOString()),
          customerId: customerId,
          items: saleOrderItems,
          remark: String(firstItem['备注'] || '')
        };
      });
      
      // 批量导入销售订单
      for (const order of ordersToImport) {
        await saleOrderService.createSaleOrder(order);
      }
      
      antdMessage.success('导入成功');
      setIsImportModalVisible(false);
      fetchSaleOrders();
    } catch (error) {
      console.error('导入失败:', error);
      antdMessage.error(`导入失败：${(error as Error).message}`);
    } finally {
      setImportLoading(false);
    }
  };

  // 导出相关函数
  const handleExport = (type: 'all' | 'filter' | 'selected') => {
    let dataToExport: SaleOrder[] = [];
    
    if (type === 'all') {
      dataToExport = saleOrders;
    } else if (type === 'filter') {
      dataToExport = filteredSaleOrders;
    } else if (type === 'selected') {
      const selectedIds = selectedRowKeys.map(key => Number(key));
      dataToExport = saleOrders.filter(order => selectedIds.includes(order.id));
    }
    
    // 将订单数据转换为导出格式，每个产品明细一行
    const exportData = dataToExport.flatMap(order => {
      return order.items.map(item => ({
        '订单号': order.code,
        '创建时间': formatDate(order.createTime),
        '客户名': order.customerName,
        '客户手机号': order.customerPhone,
        '客户城市': order.customerCity,
        '产品编码': item.productCode,
        '产品名称': item.productName,
        '数量': item.quantity,
        '单位': item.unit,
        '单价': item.price,
        '优惠金额': item.discountAmount,
        '合计金额': item.totalAmount,
        '订单金额': order.orderAmount,
        '收款金额': order.paymentAmount,
        '订单状态': getOrderStatus(order).text,
        '备注': item.remark || order.remark
      }));
    });
    
    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '销售订单');
    
    // 导出文件
    XLSX.writeFile(workbook, `销售订单_${new Date().toISOString().slice(0, 10)}.xlsx`);
    antdMessage.success('导出成功');
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '订单号': 'S20251210001',
        '创建时间': '2025-12-10',
        '客户名': '张三',
        '产品编码': 'P001',
        '产品名称': '产品1',
        '数量': '10',
        '单位': '个',
        '单价': '100',
        '优惠金额': '0',
        '合计金额': '1000',
        '备注': '测试订单'
      },
      {
        '订单号': 'S20251210001',
        '创建时间': '2025-12-10',
        '客户名': '张三',
        '产品编码': 'P002',
        '产品名称': '产品2',
        '数量': '5',
        '单位': '个',
        '单价': '200',
        '优惠金额': '100',
        '合计金额': '900',
        '备注': '测试订单'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '销售订单模板');
    XLSX.writeFile(workbook, '销售订单导入模板.xlsx');
    antdMessage.success('模板下载成功');
  };

  // 创建收款记录
  const handleCreatePayment = async (values: CreatePaymentDto) => {
    try {
      await paymentService.createPayment(values);
      // 获取最新的收款记录，更新payments状态
      const latestPayments = await paymentService.getPayments();
      setPayments(latestPayments);
      antdMessage.success('收款记录创建成功');
      setIsPaymentDrawerVisible(false);
      fetchSaleOrders(); // 刷新销售订单列表，更新付款金额
    } catch (error) {
      console.error('收款记录创建失败:', error);
      throw error;
    }
  };

  // 创建销售订单
  const handleCreateSaleOrder = async (values: CreateSaleOrderDto) => {
    try {
      await saleOrderService.createSaleOrder(values);
      antdMessage.success('销售订单创建成功');
      fetchSaleOrders();
      setIsDrawerVisible(false);
    } catch (error) {
      console.error('销售订单创建失败:', error);
      throw error;
    }
  };

  // 更新销售订单
  const handleUpdateSaleOrder = async (values: UpdateSaleOrderDto) => {
    if (!currentSaleOrder) return;
    
    try {
      await saleOrderService.updateSaleOrder(currentSaleOrder.id, values);
      antdMessage.success('销售订单更新成功');
      fetchSaleOrders();
      setIsDrawerVisible(false);
    } catch (error) {
      console.error('销售订单更新失败:', error);
      throw error;
    }
  };

  // 渲染商品列表
  const renderProductList = (items: SaleOrder['items']) => {
    return (
      <Table
        dataSource={items}
        rowKey="id"
        pagination={false}
        columns={[
          {
            title: '商品名',
            dataIndex: 'productName',
            key: 'productName',
            width: '20%',
          },
          {
            title: '商品编号',
            dataIndex: 'productCode',
            key: 'productCode',
            width: '15%',
          },
          {
            title: '数量',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '10%',
            align: 'right',
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
            align: 'right',
            render: (price: number) => formatPrice(price),
          },
          {
            title: '优惠金额',
            dataIndex: 'discountAmount',
            key: 'discountAmount',
            width: '15%',
            align: 'right',
            render: (amount: number) => formatPrice(amount),
          },
          {
            title: '合计金额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: '15%',
            align: 'right',
            render: (amount: number) => formatPrice(amount),
          },
        ]}
        size="small"
        bordered
      />
    );
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'code',
      key: 'code',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '下单时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '12%',
      ellipsis: true,
      render: (time: string) => formatDateOnly(time),
    },
    {
      title: '客户名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '客户手机号',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '客户城市',
      dataIndex: 'customerCity',
      key: 'customerCity',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      width: '10%',
      ellipsis: true,
      align: 'right' as const,
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: '收款金额',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      width: '10%',
      ellipsis: true,
      align: 'right' as const,
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      ellipsis: true,
      render: (_: unknown, record: SaleOrder) => {
        const status = getOrderStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: '8%',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '12%',
      ellipsis: true,
      render: (time: string) => formatDate(time),
    },
    {
      title: '',
      key: 'action',
      width: 200,
      fixed: 'right',
      align: 'center' as const,
      render: (_: unknown, record: SaleOrder) => {
        // 定义操作按钮
        const editButton = (
          <Button
            type="link"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              handleEdit(record);
            }}
            size="small"
          >
            编辑
          </Button>
        );

        const addPaymentButton = (
          <Button
            type="link"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              handleAddPayment(record);
            }}
            size="small"
          >
            收款
          </Button>
        );

        const printButton = (
          <Button
            type="link"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              handlePrint([record]);
            }}
            size="small"
            icon={<PrinterOutlined />}
          >
            打印
          </Button>
        );

        const deleteButton = (
          <Popconfirm
            title="确定要删除这条销售订单吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              size="small"
              onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
            >
              删除
            </Button>
          </Popconfirm>
        );

        // 操作按钮列表
        const actions = [editButton, addPaymentButton, printButton, deleteButton];

        // 如果按钮数量超过2个，使用下拉菜单
        if (actions.length > 2) {
          // 显示前两个按钮，其余放入下拉菜单
          const visibleActions = actions.slice(0, 2);
          const dropdownActions = actions.slice(2);

          // 下拉菜单配置
          const menuProps: MenuProps = {
            items: dropdownActions.map((action, index) => ({
              key: `action-${index}`,
              label: action,
            })),
          };

          return (
            <Space size="small" style={{ justifyContent: 'center' }}>
              {visibleActions}
              <Dropdown menu={menuProps} trigger={['click']}>
                <Button
                  type="link"
                  size="small"
                  onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
                >
                  <EllipsisOutlined />
                </Button>
              </Dropdown>
            </Space>
          );
        }

        // 按钮数量≤2个，直接显示
        return (
          <Space size="small" style={{ justifyContent: 'center' }}>
            {actions}
          </Space>
        );
      },
    },
  ];

  // 过滤销售订单列表
  const filteredSaleOrders = saleOrders.filter(saleOrder => {
    const matchesCode = !searchParams.code || saleOrder.code.includes(searchParams.code);
    const matchesCustomerName = !searchParams.customerName || 
      saleOrder.customerName.includes(searchParams.customerName);
    
    // 日期范围过滤
    let matchesDateRange = true;
    if (searchParams.createTimeRange) {
      const [startDate, endDate] = searchParams.createTimeRange;
      const orderDate = new Date(saleOrder.createTime);
      matchesDateRange = orderDate >= startDate && orderDate <= endDate;
    }
    
    // 订单状态过滤
    let matchesStatus = true;
    if (searchParams.status) {
      const orderStatus = getOrderStatus(saleOrder);
      matchesStatus = orderStatus.value === searchParams.status;
    }
    
    return matchesCode && matchesCustomerName && matchesDateRange && matchesStatus;
  });

  // 渲染展开的商品列表
  const expandedRowRender = (record: SaleOrder) => (
    <div style={{ margin: 0 }}>
      {renderProductList(record.items)}
    </div>
  );

  return (
    <Spin spinning={loading} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: 0, width: '100%' }}>
        {/* 标题行 */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>销售管理</h2>
        </div>
        
        {/* 查询区域 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Input
              placeholder="订单号"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.code}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, code: e.target.value })}
            />
            <Input
              placeholder="客户名"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.customerName}
              onChange={(e) => setLocalSearchParams({ ...localSearchParams, customerName: e.target.value })}
            />
            <RangePicker
              size="middle"
              style={{ width: 300 }}
              value={localSearchParams.createTimeRange}
              onChange={(dates) => setLocalSearchParams({ ...localSearchParams, createTimeRange: dates as [Date, Date] | undefined })}
              placeholder={['开始日期', '结束日期']}
            />
            <Select
              placeholder="订单状态"
              allowClear
              size="middle"
              style={{ width: 150 }}
              value={localSearchParams.status}
              onChange={(value) => setLocalSearchParams({ ...localSearchParams, status: value })}
            >
              <Select.Option value={ORDER_STATUS.PENDING.value}>{ORDER_STATUS.PENDING.text}</Select.Option>
              <Select.Option value={ORDER_STATUS.UNSETTLED.value}>{ORDER_STATUS.UNSETTLED.text}</Select.Option>
              <Select.Option value={ORDER_STATUS.SETTLED.value}>{ORDER_STATUS.SETTLED.text}</Select.Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </div>
          
          {/* 操作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 12, marginBottom: 16 }}>
            <Button type="primary" onClick={handleCreate}>
              新建销售单
            </Button>
            <Button 
              type="default" 
              onClick={handleBatchPrint} 
              icon={<PrinterOutlined />}
              disabled={selectedRowKeys.length === 0 || isPrinting}
            >
              批量打印 ({selectedRowKeys.length})
            </Button>
            <Button
              type="default"
              icon={<UploadOutlined />}
              onClick={() => setIsImportModalVisible(true)}
            >
              导入
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'all',
                    label: '全部',
                    onClick: () => handleExport('all')
                  },
                  {
                    key: 'filter',
                    label: '查询条件',
                    onClick: () => handleExport('filter')
                  },
                  {
                    key: 'selected',
                    label: '勾选',
                    onClick: () => handleExport('selected')
                  }
                ]
              }}
            >
              <Button type="default" icon={<DownloadOutlined />}>
                导出
              </Button>
            </Dropdown>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'recalculate',
                    label: '收款更新',
                    onClick: handleRecalculatePayments,
                    disabled: isRecalculating
                  },
                  {
                    key: 'batchDelete',
                    label: (
                      <Popconfirm
                        title={`确定要删除选中的 ${selectedRowKeys.length} 条销售订单吗？`}
                        onConfirm={handleBatchDelete}
                        okText="确认"
                        cancelText="取消"
                      >
                        <span style={{ cursor: 'pointer' }}>批量删除 ({selectedRowKeys.length})</span>
                      </Popconfirm>
                    ),
                    disabled: selectedRowKeys.length === 0
                  }
                ]
              }}
            >
              <Button type="default">
                更多操作
              </Button>
            </Dropdown>
          </div>
        </div>
        
        {/* 销售订单列表 */}
        <div style={{ 
          overflowX: 'auto',
          marginBottom: 16, 
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <Table
            columns={columns}
            dataSource={filteredSaleOrders}
            rowKey="id"
            loading={loading}
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
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
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              onShowSizeChange: (current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }
            }}
            expandable={{ expandedRowRender }}
            // 添加行点击事件，点击行打开编辑弹窗
            onRow={(record) => ({
              draggable: false,
              onClick: () => handleEdit(record),
              style: {
                cursor: 'pointer',
              }
            })}
            // 确保表格自适应宽度，内容不溢出
            style={{
              width: '100%',
              boxSizing: 'border-box',
              tableLayout: 'fixed',
            }}
          />
        </div>



        {/* 销售订单表单抽屉 */}
        <Drawer
          title={isEditing ? '编辑销售订单' : '新增销售订单'}
          placement="right"
          onClose={() => setIsDrawerVisible(false)}
          open={isDrawerVisible}
          size={1200}
          resizable
        >
          <SaleOrderForm
            initialValues={currentSaleOrder}
            onSubmit={isEditing ? handleUpdateSaleOrder : handleCreateSaleOrder}
            onCancel={() => setIsDrawerVisible(false)}
            isEditing={isEditing}
            visible={isDrawerVisible}
          />
        </Drawer>

        {/* 收款列表弹窗 */}
        {isPaymentListModalVisible && currentOrderForPayment && (
          <PaymentListModal
            order={currentOrderForPayment}
            customers={customers}
            saleOrders={saleOrders}
            onClose={() => setIsPaymentListModalVisible(false)}
            onPaymentCreated={() => fetchSaleOrders()}
          />
        )}

        {/* 导入弹窗 */}
        <Modal
          title="导入销售订单"
          open={isImportModalVisible}
          onCancel={() => setIsImportModalVisible(false)}
          footer={null}
          width={600}
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <Button type="default" onClick={handleDownloadTemplate}>
                下载导入模板
              </Button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Upload
                beforeUpload={handleImport}
                showUploadList={false}
                accept=".xlsx, .xls"
              >
                <Button type="primary" loading={importLoading}>
                  点击上传文件
                </Button>
              </Upload>
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              <p>支持格式：.xlsx, .xls</p>
              <p>请按照模板格式填写数据，确保字段完整</p>
              <p>同一订单的多行产品明细请使用相同的订单号</p>
            </div>
          </div>
        </Modal>
      </div>
    </Spin>
  );
};

export default SalesPage;
