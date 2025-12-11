import { SaleOrder } from '../types/sale-order-types';
import { Payment } from '../types/payment-types';

/**
 * 计算指定订单的收款金额
 * @param targetOrders 需要计算的订单列表
 * @param allOrders 所有订单列表
 * @param payments 所有收款记录
 * @returns 订单ID到收款金额的映射
 */
export const calculateOrderPaymentAmounts = (targetOrders: SaleOrder[], allOrders: SaleOrder[], payments: Payment[]): Map<number, number> => {
  // 1. 获取需要计算的订单ID集合
  const targetOrderIds = new Set(targetOrders.map(order => order.id));
  
  // 2. 筛选相关的收款记录（包含任何目标订单ID的收款记录）
  const relatedPayments = payments.filter(payment => {
    return payment.saleOrderIds.some(id => targetOrderIds.has(id));
  });

  // 3. 按收款日期排序（从早到晚）
  const sortedPayments = [...relatedPayments].sort((a, b) => {
    return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
  });

  // 4. 初始化订单收款金额映射
  const paymentMap = new Map<number, number>();
  
  // 先将所有目标订单的初始收款金额设置为0
  targetOrders.forEach(order => {
    paymentMap.set(order.id, 0);
  });
  
  // 5. 临时存储所有订单的当前收款金额，用于准确计算
  const tempPaymentMap = new Map<number, number>();
  allOrders.forEach(order => {
    tempPaymentMap.set(order.id, 0);
  });
  
  // 6. 先计算所有订单的初始收款金额（仅包含不相关的收款记录）
  payments.forEach(payment => {
    // 跳过相关收款记录，这些将在后续重新计算
    if (relatedPayments.includes(payment)) {
      return;
    }
    
    // 按订单创建日期排序关联订单
    const relatedOrders = allOrders
      .filter(order => payment.saleOrderIds.includes(order.id))
      .sort((a, b) => {
        return new Date(a.createTime).getTime() - new Date(b.createTime).getTime();
      });

    let remainingAmount = payment.amount;

    // 依次分配金额到关联订单
    for (const order of relatedOrders) {
      if (remainingAmount <= 0) break;

      const currentPayment = tempPaymentMap.get(order.id) || 0;

      // 不再限制收款金额不能超过订单金额，直接累加
      if (remainingAmount > 0) {
        // 将全部剩余金额分配给当前订单
        tempPaymentMap.set(order.id, currentPayment + remainingAmount);
        remainingAmount = 0;
      }
    }
  });

  // 7. 复制初始计算结果到最终结果映射
  targetOrders.forEach(order => {
    paymentMap.set(order.id, tempPaymentMap.get(order.id) || 0);
  });

  // 8. 按收款记录分配金额（重新计算相关收款记录）
  for (const payment of sortedPayments) {
    // 按订单创建日期排序关联订单
    const relatedOrders = allOrders
      .filter(order => payment.saleOrderIds.includes(order.id))
      .sort((a, b) => {
        return new Date(a.createTime).getTime() - new Date(b.createTime).getTime();
      });

    let remainingAmount = payment.amount;

    // 依次分配金额到关联订单
    for (const order of relatedOrders) {
      if (remainingAmount <= 0) break;

      const currentPayment = tempPaymentMap.get(order.id) || 0;

      // 不再限制收款金额不能超过订单金额，直接累加
      if (remainingAmount > 0) {
        // 将全部剩余金额分配给当前订单
        tempPaymentMap.set(order.id, currentPayment + remainingAmount);
        remainingAmount = 0;
      }
    }
  }

  // 9. 更新目标订单的最终收款金额
  targetOrders.forEach(order => {
    paymentMap.set(order.id, tempPaymentMap.get(order.id) || 0);
  });

  return paymentMap;
};

/**
 * 计算所有订单的收款金额
 * @param salesOrders 所有订单列表
 * @param payments 所有收款记录
 * @returns 订单ID到收款金额的映射
 */
export const calculateAllOrderPaymentAmounts = (salesOrders: SaleOrder[], payments: Payment[]): Map<number, number> => {
  // 直接调用calculateOrderPaymentAmounts，传入所有订单
  return calculateOrderPaymentAmounts(salesOrders, salesOrders, payments);
};

/**
 * 获取与指定订单相关联的所有订单
 * @param order 指定订单
 * @param allOrders 所有订单列表
 * @param payments 所有收款记录
 * @returns 相关联的订单列表
 */
export const getRelatedOrders = (order: SaleOrder, allOrders: SaleOrder[], payments: Payment[]): SaleOrder[] => {
  // 1. 获取与该订单直接关联的收款记录
  const relatedPayments = payments.filter(payment => {
    return payment.saleOrderIds.includes(order.id);
  });
  
  // 2. 获取这些收款记录关联的所有订单ID
  const relatedOrderIds = new Set<number>();
  relatedPayments.forEach(payment => {
    payment.saleOrderIds.forEach(id => {
      relatedOrderIds.add(id);
    });
  });
  
  // 3. 获取这些订单ID对应的订单
  return allOrders.filter(o => relatedOrderIds.has(o.id));
};

/**
 * 获取与多个订单相关联的所有订单
 * @param orders 指定订单列表
 * @param allOrders 所有订单列表
 * @param payments 所有收款记录
 * @returns 相关联的订单列表
 */
export const getRelatedOrdersForMultiple = (orders: SaleOrder[], allOrders: SaleOrder[], payments: Payment[]): SaleOrder[] => {
  // 1. 获取所有相关订单ID
  const relatedOrderIds = new Set<number>();
  
  orders.forEach(order => {
    const relatedOrders = getRelatedOrders(order, allOrders, payments);
    relatedOrders.forEach(o => {
      relatedOrderIds.add(o.id);
    });
  });
  
  // 2. 获取这些订单ID对应的订单
  return allOrders.filter(o => relatedOrderIds.has(o.id));
};