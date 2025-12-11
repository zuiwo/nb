package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/robfig/cron/v3"

	"nb2/internal/config"
	"nb2/pkg/database"
)

// Product 产品模型
type Product struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Code      string  `json:"code"`
	Category  string  `json:"category"`
	Brand     string  `json:"brand"`
	Unit      string  `json:"unit"`
	Price     float64 `json:"price"`
	Status    int     `json:"status"`
	Remark    string  `json:"remark"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

// CreateProductRequest 创建产品请求
type CreateProductRequest struct {
	Name     string  `json:"name" binding:"required"`
	Code     string  `json:"code"`
	Category string  `json:"category"`
	Brand    string  `json:"brand"`
	Unit     string  `json:"unit"`
	Price    float64 `json:"price" binding:"required,gt=0"`
	Status   int     `json:"status"`
	Remark   string  `json:"remark"`
}

// UpdateProductRequest 更新产品请求
type UpdateProductRequest struct {
	Name     string  `json:"name"`
	Code     string  `json:"code"`
	Category string  `json:"category"`
	Brand    string  `json:"brand"`
	Unit     string  `json:"unit"`
	Price    float64 `json:"price" binding:"omitempty,gt=0"`
	Status   int     `json:"status"`
	Remark   string  `json:"remark"`
}

// DictionaryType 字典类型模型
type DictionaryType struct {
	ID        int    `json:"id"`
	Code      string `json:"code"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// DictionaryItem 字典项模型
type DictionaryItem struct {
	ID           int    `json:"id"`
	Code         string `json:"code"`
	Name         string `json:"name"`
	DictTypeCode string `json:"dictTypeCode"`
	Status       int    `json:"status"`
	CreatedAt    string `json:"createdAt"`
	UpdatedAt    string `json:"updatedAt"`
}

// CreateDictionaryTypeRequest 创建字典类型请求
type CreateDictionaryTypeRequest struct {
	Name string `json:"name" binding:"required"`
}

// UpdateDictionaryTypeRequest 更新字典类型请求
type UpdateDictionaryTypeRequest struct {
	Name string `json:"name"`
}

// CreateDictionaryItemRequest 创建字典项请求
type CreateDictionaryItemRequest struct {
	Name         string `json:"name" binding:"required"`
	DictTypeCode string `json:"dictTypeCode" binding:"required"`
	Status       int    `json:"status"`
}

// UpdateDictionaryItemRequest 更新字典项请求
type UpdateDictionaryItemRequest struct {
	Name         string `json:"name"`
	DictTypeCode string `json:"dictTypeCode"`
	Status       int    `json:"status"`
}

// Setting 设置模型
type Setting struct {
	ID          int    `json:"id"`
	Key         string `json:"key"`
	Value       string `json:"value"`
	Description string `json:"description"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// UpdateSettingsRequest 更新设置请求
type UpdateSettingsRequest struct {
	Settings []Setting `json:"settings" binding:"required"`
}

// ========== 客户和发票相关模型 ==========

// Customer 客户模型
type Customer struct {
	ID        int    `json:"id"`
	Code      string `json:"code"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Province  string `json:"province"`
	City      string `json:"city"`
	District  string `json:"district"`
	Address   string `json:"address"`
	Company   string `json:"company"`
	Status    int    `json:"status"`
	Remark    string `json:"remark"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// CreateCustomerRequest 创建客户请求
type CreateCustomerRequest struct {
	Name     string `json:"name" binding:"required"`
	Code     string `json:"code"`
	Phone    string `json:"phone"`
	Province string `json:"province"`
	City     string `json:"city"`
	District string `json:"district"`
	Address  string `json:"address"`
	Company  string `json:"company"`
	Status   int    `json:"status"`
	Remark   string `json:"remark"`
}

// UpdateCustomerRequest 更新客户请求
type UpdateCustomerRequest struct {
	Name     string `json:"name"`
	Code     string `json:"code"`
	Phone    string `json:"phone"`
	Province string `json:"province"`
	City     string `json:"city"`
	District string `json:"district"`
	Address  string `json:"address"`
	Company  string `json:"company"`
	Status   int    `json:"status"`
	Remark   string `json:"remark"`
}

// Invoice 发票模型
type Invoice struct {
	ID            int    `json:"id"`
	CustomerID    int    `json:"customerId"`
	Company       string `json:"company"`
	TaxNumber     string `json:"taxNumber"`
	Bank          string `json:"bank"`
	BankAccount   string `json:"bankAccount"`
	BranchAddress string `json:"branchAddress"`
	Status        int    `json:"status"`
	CreatedAt     string `json:"createdAt"`
	UpdatedAt     string `json:"updatedAt"`
}

// CreateInvoiceRequest 创建发票请求
type CreateInvoiceRequest struct {
	CustomerID    int    `json:"customerId" binding:"required"`
	Company       string `json:"company" binding:"required"`
	TaxNumber     string `json:"taxNumber" binding:"required"`
	Bank          string `json:"bank" binding:"required"`
	BankAccount   string `json:"bankAccount" binding:"required"`
	BranchAddress string `json:"branchAddress"`
	Status        int    `json:"status"`
}

// UpdateInvoiceRequest 更新发票请求
type UpdateInvoiceRequest struct {
	Company       string `json:"company"`
	TaxNumber     string `json:"taxNumber"`
	Bank          string `json:"bank"`
	BankAccount   string `json:"bankAccount"`
	BranchAddress string `json:"branchAddress"`
	Status        int    `json:"status"`
}

// ========== 收款记录相关模型 ==========

// Payment 收款记录模型
type Payment struct {
	ID            int     `json:"id"`
	Code          string  `json:"code"`
	PaymentDate   string  `json:"paymentDate"`
	CustomerID    int     `json:"customerId"`
	CustomerName  string  `json:"customerName"`
	SaleOrderIDs  []int   `json:"saleOrderIds"`
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"paymentMethod"`
	Account       string  `json:"account"`
	PayerCompany  string  `json:"payerCompany"`
	Remark        string  `json:"remark"`
	CreatedAt     string  `json:"createdAt"`
	UpdatedAt     string  `json:"updatedAt"`
}

// CreatePaymentRequest 创建收款记录请求
type CreatePaymentRequest struct {
	PaymentDate   string  `json:"paymentDate" binding:"required"`
	CustomerID    int     `json:"customerId" binding:"required"`
	SaleOrderIDs  []int   `json:"saleOrderIds" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	PaymentMethod string  `json:"paymentMethod"`
	Account       string  `json:"account"`
	PayerCompany  string  `json:"payerCompany"`
	Remark        string  `json:"remark"`
}

// UpdatePaymentRequest 更新收款记录请求
type UpdatePaymentRequest struct {
	PaymentDate   string  `json:"paymentDate"`
	CustomerID    int     `json:"customerId"`
	SaleOrderIDs  []int   `json:"saleOrderIds"`
	Amount        float64 `json:"amount" binding:"omitempty,gt=0"`
	PaymentMethod string  `json:"paymentMethod"`
	Account       string  `json:"account"`
	PayerCompany  string  `json:"payerCompany"`
	Remark        string  `json:"remark"`
}

// BatchCreatePaymentRequest 批量创建收款记录请求
type BatchCreatePaymentRequest struct {
	Payments []CreatePaymentRequest `json:"payments" binding:"required"`
}

// ========== 销售订单相关模型 ==========

// SaleOrder 销售订单模型
type SaleOrder struct {
	ID            int             `json:"id"`
	Code          string          `json:"code"`
	CreateTime    string          `json:"createTime"`
	CustomerID    int             `json:"customerId"`
	CustomerName  string          `json:"customerName"`
	CustomerPhone string          `json:"customerPhone"`
	CustomerCity  string          `json:"customerCity"`
	Items         []SaleOrderItem `json:"items"`
	OrderAmount   float64         `json:"orderAmount"`
	PaymentAmount float64         `json:"paymentAmount"`
	Remark        string          `json:"remark"`
	CreatedAt     string          `json:"createdAt"`
	UpdatedAt     string          `json:"updatedAt"`
}

// SaleOrderItem 销售订单商品模型
type SaleOrderItem struct {
	ID             int     `json:"id"`
	SaleOrderID    int     `json:"saleOrderId"`
	ProductID      int     `json:"productId"`
	ProductCode    string  `json:"productCode"`
	ProductName    string  `json:"productName"`
	Quantity       float64 `json:"quantity"`
	Unit           string  `json:"unit"`
	Price          float64 `json:"price"`
	DiscountAmount float64 `json:"discountAmount"`
	TotalAmount    float64 `json:"totalAmount"`
	Remark         string  `json:"remark"`
}

// CreateSaleOrderRequest 创建销售订单请求
type CreateSaleOrderRequest struct {
	Code       string                       `json:"code" binding:"required"`
	CreateTime string                       `json:"createTime" binding:"required"`
	CustomerID int                          `json:"customerId" binding:"required"`
	Items      []CreateSaleOrderItemRequest `json:"items" binding:"required"`
	Remark     string                       `json:"remark"`
}

// CreateSaleOrderItemRequest 创建销售订单商品请求
type CreateSaleOrderItemRequest struct {
	ProductID      int     `json:"productId" binding:"required"`
	ProductCode    string  `json:"productCode" binding:"required"`
	ProductName    string  `json:"productName" binding:"required"`
	Quantity       float64 `json:"quantity" binding:"required,gt=0"`
	Unit           string  `json:"unit" binding:"required"`
	Price          float64 `json:"price" binding:"required,gt=0"`
	DiscountAmount float64 `json:"discountAmount"`
	TotalAmount    float64 `json:"totalAmount"`
	Remark         string  `json:"remark"`
}

// UpdateSaleOrderRequest 更新销售订单请求
type UpdateSaleOrderRequest struct {
	Code       string                       `json:"code" binding:"required"`
	CreateTime string                       `json:"createTime" binding:"required"`
	CustomerID int                          `json:"customerId" binding:"required"`
	Items      []UpdateSaleOrderItemRequest `json:"items" binding:"required"`
	Remark     string                       `json:"remark"`
}

// UpdateSaleOrderItemRequest 更新销售订单商品请求
type UpdateSaleOrderItemRequest struct {
	ID             int     `json:"id,omitempty"`
	ProductID      int     `json:"productId" binding:"required"`
	ProductCode    string  `json:"productCode" binding:"required"`
	ProductName    string  `json:"productName" binding:"required"`
	Quantity       float64 `json:"quantity" binding:"required,gt=0"`
	Unit           string  `json:"unit" binding:"required"`
	Price          float64 `json:"price" binding:"required,gt=0"`
	DiscountAmount float64 `json:"discountAmount"`
	TotalAmount    float64 `json:"totalAmount"`
	Remark         string  `json:"remark"`
}

// StatementRecord 对帐单记录模型
type StatementRecord struct {
	ID            int     `json:"id"`
	CustomerID    int     `json:"customerId"`
	CustomerCode  string  `json:"customerCode"`
	CustomerName  string  `json:"customerName"`
	Date          string  `json:"date"`
	SaleAmount    float64 `json:"saleAmount"`
	PaymentAmount float64 `json:"paymentAmount"`
	Balance       float64 `json:"balance"`
	Remark        string  `json:"remark"`
	SourceType    string  `json:"sourceType"`
	SourceID      int     `json:"sourceId"`
	CreatedAt     string  `json:"createdAt"`
	UpdatedAt     string  `json:"updatedAt"`
}

func main() {
	// 初始化随机数种子
	rand.Seed(time.Now().UnixNano())

	// 加载配置
	cfg := config.LoadConfig()

	// 初始化数据库连接
	if err := database.InitDB(&cfg.Database); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// 设置定时同步任务
	c := cron.New()
	// 每天5:00执行同步
	_, err := c.AddFunc("0 5 * * *", func() {
		log.Println("开始执行对帐单同步任务（5:00）")
		if err := syncStatements(); err != nil {
			log.Printf("对帐单同步失败：%v\n", err)
		} else {
			log.Println("对帐单同步完成")
		}
	})
	if err != nil {
		log.Printf("Failed to add 5:00 cron job: %v\n", err)
	}

	// 每天17:00执行同步
	_, err = c.AddFunc("0 17 * * *", func() {
		log.Println("开始执行对帐单同步任务（17:00）")
		if err := syncStatements(); err != nil {
			log.Printf("对帐单同步失败：%v\n", err)
		} else {
			log.Println("对帐单同步完成")
		}
	})
	if err != nil {
		log.Printf("Failed to add 17:00 cron job: %v\n", err)
	}

	// 启动定时任务
	c.Start()
	log.Println("定时同步任务已启动")

	// 创建Gin引擎
	r := gin.Default()

	// 添加跨域中间件
	r.Use(corsMiddleware())

	// 健康检查路由
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// 产品路由组
	products := r.Group("/api/products")
	{
		products.GET("", getProducts)
		products.GET("/:id", getProductByID)
		products.POST("", createProduct)
		products.PUT("/:id", updateProduct)
		products.DELETE("/:id", deleteProduct)
		products.DELETE("/batch", batchDeleteProducts)
		products.GET("/generate-code", generateProductCodeAPI)
		products.GET("/check-code", checkProductCode)
	}

	// 字典路由组
	dictionaries := r.Group("/api/dictionaries")
	{
		// 字典类型管理
		dictionaries.GET("/types", getDictionaryTypes)
		dictionaries.GET("/types/:id", getDictionaryTypeByID)
		dictionaries.POST("/types", createDictionaryType)
		dictionaries.PUT("/types/:id", updateDictionaryType)
		dictionaries.DELETE("/types/:id", deleteDictionaryType)
		dictionaries.DELETE("/types/batch", batchDeleteDictionaryTypes)

		// 字典项管理
		dictionaries.GET("/items", getDictionaryItems)
		dictionaries.GET("/items/:id", getDictionaryItemByID)
		dictionaries.POST("/items", createDictionaryItem)
		dictionaries.PUT("/items/:id", updateDictionaryItem)
		dictionaries.DELETE("/items/:id", deleteDictionaryItem)
		dictionaries.DELETE("/items/batch", batchDeleteDictionaryItems)

		// 根据字典类型获取字典项
		dictionaries.GET("/items/type/:code", getDictionaryItemsByTypeCode)
	}

	// 设置路由组
	settings := r.Group("/api/settings")
	{
		settings.GET("", getSettings)
		settings.PUT("", updateSettings)
	}

	// 客户路由组
	customers := r.Group("/api/customers")
	{
		// 基本客户路由
		customers.GET("", getCustomers)
		customers.POST("", createCustomer)
		customers.DELETE("/batch", batchDeleteCustomers)
		// 客户编号生成和检查（放在动态路由之前）
		customers.GET("/generate-code", generateCustomerCodeAPI)
		customers.GET("/check-code", checkCustomerCode)
		// 动态路由（放在具体路由之后）
		customers.GET("/:id", getCustomerByID)
		customers.PUT("/:id", updateCustomer)
		customers.DELETE("/:id", deleteCustomer)
		// 客户发票路由
		customers.GET("/:id/invoices", getCustomerInvoices)
	}

	// 发票路由组
	invoices := r.Group("/api/invoices")
	{
		invoices.POST("", createInvoice)
		invoices.PUT("/:id", updateInvoice)
		invoices.DELETE("/:id", deleteInvoice)
	}

	// 收款路由组
	payments := r.Group("/api/payments")
	{
		payments.GET("", getPayments)
		payments.POST("", createPayment)
		payments.POST("/batch", batchCreatePayments)
		payments.PUT("/:id", updatePayment)
		payments.DELETE("/:id", deletePayment)
	}

	// 销售订单路由组
	saleOrders := r.Group("/api/sale-orders")
	{
		saleOrders.GET("", getSaleOrders)
		saleOrders.GET("/generate-code", generateSaleOrderCodeAPI)
		saleOrders.GET("/:id", getSaleOrderByID)
		saleOrders.POST("", createSaleOrder)
		saleOrders.PUT("/:id", updateSaleOrder)
		saleOrders.DELETE("/:id", deleteSaleOrder)
	}

	// 对帐单路由组
	statements := r.Group("/api/statements")
	{
		statements.GET("", getStatements)
		statements.GET("/sync", syncStatementsAPI)
	}

	// 启动服务器
	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// corsMiddleware 跨域中间件
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// calculateStatementBalance 计算对帐单记录的结余金额
func calculateStatementBalance(records []StatementRecord) []StatementRecord {
	if len(records) == 0 {
		return records
	}

	// 按日期升序排序
	sort.Slice(records, func(i, j int) bool {
		return records[i].Date < records[j].Date
	})

	// 计算结余金额
	balance := 0.0
	for i := range records {
		// 每条记录的差额 = 发货金额 - 收款金额
		diff := records[i].SaleAmount - records[i].PaymentAmount
		balance += diff
		records[i].Balance = balance
	}

	// 按日期降序返回（最新在前）
	sort.Slice(records, func(i, j int) bool {
		return records[i].Date > records[j].Date
	})

	return records
}

// getAllCustomers 获取所有客户
func getAllCustomers() ([]Customer, error) {
	rows, err := database.DB.Query("SELECT id, code, name, phone, province, city, district, address, company, status, remark, created_at, updated_at FROM customers")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var c Customer
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.Phone, &c.Province, &c.City, &c.District, &c.Address, &c.Company, &c.Status, &c.Remark, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		customers = append(customers, c)
	}

	return customers, nil
}

// getCustomerSaleOrders 获取客户的所有销售订单
func getCustomerSaleOrders(customerID int) ([]SaleOrder, error) {
	rows, err := database.DB.Query("SELECT id, code, total_amount, paid_amount, create_time, customer_id, customer_name, customer_phone, customer_city, remark, created_at, updated_at FROM sale_orders WHERE customer_id = ?", customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []SaleOrder
	for rows.Next() {
		var o SaleOrder
		if err := rows.Scan(&o.ID, &o.Code, &o.OrderAmount, &o.PaymentAmount, &o.CreateTime, &o.CustomerID, &o.CustomerName, &o.CustomerPhone, &o.CustomerCity, &o.Remark, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}

	return orders, nil
}

// getCustomerPayments 获取客户的所有收款记录
func getCustomerPayments(customerID int) ([]Payment, error) {
	rows, err := database.DB.Query("SELECT id, code, payment_date, customer_id, sale_order_ids, amount, payment_method, account, payer_company, remark, created_at, updated_at FROM payments WHERE customer_id = ?", customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []Payment
	for rows.Next() {
		var p Payment
		var saleOrderIdsJSON []byte
		if err := rows.Scan(&p.ID, &p.Code, &p.PaymentDate, &p.CustomerID, &saleOrderIdsJSON, &p.Amount, &p.PaymentMethod, &p.Account, &p.PayerCompany, &p.Remark, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}

		// 解析sale_order_ids JSON
		if saleOrderIdsJSON != nil && len(saleOrderIdsJSON) > 0 {
			// 处理空字符串情况
			saleOrderIdsStr := string(saleOrderIdsJSON)
			if saleOrderIdsStr != "" && saleOrderIdsStr != "null" {
				err = json.Unmarshal(saleOrderIdsJSON, &p.SaleOrderIDs)
				if err != nil {
					// JSON解析失败时，设置为空数组，增强容错性
					p.SaleOrderIDs = []int{}
				}
			} else {
				// 空字符串或null时，设置为空数组
				p.SaleOrderIDs = []int{}
			}
		} else {
			// 未设置值时，设置为空数组
			p.SaleOrderIDs = []int{}
		}

		payments = append(payments, p)
	}

	return payments, nil
}

// saveStatementRecords 保存对帐单记录
func saveStatementRecords(records []StatementRecord) error {
	// 开始事务
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 先删除该客户的所有对帐单记录
	if len(records) > 0 {
		_, err := tx.Exec("DELETE FROM statement_records WHERE customer_id = ?", records[0].CustomerID)
		if err != nil {
			return err
		}
	}

	// 批量插入新的对帐单记录
	stmt, err := tx.Prepare("INSERT INTO statement_records (customer_id, customer_code, customer_name, date, sale_amount, payment_amount, balance, remark, source_type, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, record := range records {
		_, err := stmt.Exec(record.CustomerID, record.CustomerCode, record.CustomerName, record.Date, record.SaleAmount, record.PaymentAmount, record.Balance, record.Remark, record.SourceType, record.SourceID)
		if err != nil {
			return err
		}
	}

	// 提交事务
	return tx.Commit()
}

// syncCustomerStatements 同步单个客户的对帐单数据
func syncCustomerStatements(customerID int) error {
	log.Printf("开始同步客户 %d 的对帐单\n", customerID)
	// 获取客户信息
	var customer Customer
	err := database.DB.QueryRow("SELECT id, code, name FROM customers WHERE id = ?", customerID).Scan(&customer.ID, &customer.Code, &customer.Name)
	if err != nil {
		log.Printf("获取客户 %d 信息失败：%v\n", customerID, err)
		return err
	}
	log.Printf("客户信息：ID=%d, 编号=%s, 名称=%s\n", customer.ID, customer.Code, customer.Name)

	// 获取该客户的所有销售订单
	saleOrders, err := getCustomerSaleOrders(customerID)
	if err != nil {
		log.Printf("获取客户 %d 销售订单失败：%v\n", customerID, err)
		return err
	}
	log.Printf("获取到 %d 条销售订单\n", len(saleOrders))

	// 获取该客户的所有收款记录
	payments, err := getCustomerPayments(customerID)
	if err != nil {
		log.Printf("获取客户 %d 收款记录失败：%v\n", customerID, err)
		return err
	}
	log.Printf("获取到 %d 条收款记录\n", len(payments))

	// 合并并处理数据
	var records []StatementRecord

	// 处理销售订单
	for _, order := range saleOrders {
		// 将createTime转换为日期格式（YYYY-MM-DD）
		date := order.CreateTime
		if len(date) > 10 {
			date = date[:10]
		}

		records = append(records, StatementRecord{
			CustomerID:    customer.ID,
			CustomerCode:  customer.Code,
			CustomerName:  customer.Name,
			Date:          date,
			SaleAmount:    order.OrderAmount,
			PaymentAmount: 0,
			Remark:        order.Remark,
			SourceType:    "sale_order",
			SourceID:      order.ID,
		})
	}

	// 处理收款记录
	for _, payment := range payments {
		records = append(records, StatementRecord{
			CustomerID:    customer.ID,
			CustomerCode:  customer.Code,
			CustomerName:  customer.Name,
			Date:          payment.PaymentDate,
			SaleAmount:    0,
			PaymentAmount: payment.Amount,
			Remark:        payment.Remark,
			SourceType:    "payment",
			SourceID:      payment.ID,
		})
	}

	log.Printf("共生成 %d 条对帐单记录\n", len(records))

	// 计算结余金额
	records = calculateStatementBalance(records)

	// 保存对帐单记录
	if err := saveStatementRecords(records); err != nil {
		log.Printf("保存客户 %d 对帐单记录失败：%v\n", customerID, err)
		return err
	}
	log.Printf("客户 %d 对帐单同步完成\n", customerID)
	return nil
}

// syncStatements 同步所有客户的对帐单数据
func syncStatements() error {
	log.Println("开始同步所有客户对帐单")
	// 获取所有客户
	customers, err := getAllCustomers()
	if err != nil {
		log.Printf("获取客户列表失败：%v\n", err)
		return err
	}
	log.Printf("共获取到 %d 个客户\n", len(customers))

	for i, customer := range customers {
		log.Printf("正在同步第 %d/%d 个客户：ID=%d, 名称=%s\n", i+1, len(customers), customer.ID, customer.Name)
		if err := syncCustomerStatements(customer.ID); err != nil {
			log.Printf("同步客户 %d 对帐单失败：%v\n", customer.ID, err)
			return err
		}
	}
	log.Println("所有客户对帐单同步完成")
	return nil
}

// getStatements 获取对帐单列表
func getStatements(c *gin.Context) {
	// 获取查询参数
	customerIDStr := c.Query("customerId")
	startTime := c.Query("startTime")
	endTime := c.Query("endTime")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "100")

	// 解析参数
	var customerID int
	if customerIDStr != "" {
		var err error
		customerID, err = strconv.Atoi(customerIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customerId"})
			return
		}
	}

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)

	// 构建查询条件
	query := "SELECT id, customer_id, customer_code, customer_name, date, sale_amount, payment_amount, balance, remark, source_type, source_id, created_at, updated_at FROM statement_records WHERE 1=1"
	args := []interface{}{}

	if customerID > 0 {
		query += " AND customer_id = ?"
		args = append(args, customerID)
	}

	if startTime != "" {
		query += " AND date >= ?"
		args = append(args, startTime)
	}

	if endTime != "" {
		query += " AND date <= ?"
		args = append(args, endTime)
	}

	// 添加排序
	query += " ORDER BY date DESC, id DESC"

	// 添加分页
	offset := (page - 1) * pageSize
	query += " LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	// 执行查询
	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statements"})
		return
	}
	defer rows.Close()

	// 处理查询结果
	var records []StatementRecord
	for rows.Next() {
		var r StatementRecord
		if err := rows.Scan(&r.ID, &r.CustomerID, &r.CustomerCode, &r.CustomerName, &r.Date, &r.SaleAmount, &r.PaymentAmount, &r.Balance, &r.Remark, &r.SourceType, &r.SourceID, &r.CreatedAt, &r.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan statement record"})
			return
		}
		records = append(records, r)
	}

	// 获取总记录数
	countQuery := "SELECT COUNT(*) FROM statement_records WHERE 1=1"
	countArgs := []interface{}{}

	if customerID > 0 {
		countQuery += " AND customer_id = ?"
		countArgs = append(countArgs, customerID)
	}

	if startTime != "" {
		countQuery += " AND date >= ?"
		countArgs = append(countArgs, startTime)
	}

	if endTime != "" {
		countQuery += " AND date <= ?"
		countArgs = append(countArgs, endTime)
	}

	var total int
	err = database.DB.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count statements"})
		return
	}

	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"total":   total,
		"records": records,
	})
}

// syncStatementsAPI 手动触发对帐单同步的API
func syncStatementsAPI(c *gin.Context) {
	log.Println("手动触发对帐单同步")
	if err := syncStatements(); err != nil {
		log.Printf("对帐单同步失败：%v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync statements", "message": err.Error()})
		return
	}
	log.Println("对帐单同步成功")
	c.JSON(http.StatusOK, gin.H{"message": "对帐单同步成功"})
}

// getProducts 获取产品列表
func getProducts(c *gin.Context) {
	// 检查数据库连接
	if database.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection is nil"})
		return
	}

	rows, err := database.DB.Query("SELECT id, name, COALESCE(code, ''), COALESCE(category, ''), COALESCE(brand, ''), COALESCE(unit, ''), CAST(price AS FLOAT) as price, status, COALESCE(remark, ''), created_at, updated_at FROM products ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products: " + err.Error()})
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Code, &p.Category, &p.Brand, &p.Unit, &p.Price, &p.Status, &p.Remark, &p.CreatedAt, &p.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan product: " + err.Error()})
			return
		}
		products = append(products, p)
	}

	c.JSON(http.StatusOK, products)
}

// getProductByID 根据ID获取产品
func getProductByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var p Product
	err = database.DB.QueryRow("SELECT id, name, code, category, brand, unit, CAST(price AS FLOAT) as price, status, remark, created_at, updated_at FROM products WHERE id = ?", id).Scan(
		&p.ID, &p.Name, &p.Code, &p.Category, &p.Brand, &p.Unit, &p.Price, &p.Status, &p.Remark, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch product"})
		return
	}

	c.JSON(http.StatusOK, p)
}

// generateProductCode 生成产品编号（P+4位数字递增）
func generateProductCode(db *sql.DB) (string, error) {
	// 获取当前最大的产品编号
	var maxCode sql.NullString
	err := db.QueryRow("SELECT MAX(code) FROM products WHERE code REGEXP '^P[0-9]+$'").Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 系统无产品时，生成P0001
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[1:]
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从P0001开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成新编号，始终使用P+4位数字格式
	newCode := fmt.Sprintf("P%04d", nextNum)
	return newCode, nil
}

// createProduct 创建产品
func createProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成或使用提供的产品编号
	productCode := req.Code
	if productCode == "" {
		var err error
		productCode, err = generateProductCode(database.DB)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate product code"})
			return
		}
	} else {
		// 验证产品编号唯一性
		var exists bool
		err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE code = ?)", productCode).Scan(&exists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查产品编号失败"})
			return
		}
		if exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "产品编号已存在"})
			return
		}
	}

	// 设置默认状态为1（启用）
	status := req.Status
	// 确保新建客户默认状态为启用
	if status == 0 {
		status = 1
	}

	result, err := database.DB.Exec(
		"INSERT INTO products (name, code, category, brand, unit, price, status, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		req.Name, productCode, req.Category, req.Brand, req.Unit, req.Price, status, req.Remark,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
		return
	}

	// 获取创建的产品
	var p Product
	err = database.DB.QueryRow("SELECT id, name, code, category, brand, unit, CAST(price AS FLOAT) as price, status, remark, created_at, updated_at FROM products WHERE id = ?", id).Scan(
		&p.ID, &p.Name, &p.Code, &p.Category, &p.Brand, &p.Unit, &p.Price, &p.Status, &p.Remark, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created product"})
		return
	}

	c.JSON(http.StatusCreated, p)
}

// updateProduct 更新产品
func updateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查产品是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// 构建更新语句
	query := "UPDATE products SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if req.Name != "" {
		query += ", name = ?"
		args = append(args, req.Name)
	}
	if req.Code != "" {
		// 验证产品编号唯一性（排除当前产品）
		var codeExists bool
		err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE code = ? AND id != ?)", req.Code, id).Scan(&codeExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查产品编号失败"})
			return
		}
		if codeExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "产品编号已存在"})
			return
		}
		query += ", code = ?"
		args = append(args, req.Code)
	}
	if req.Category != "" {
		query += ", category = ?"
		args = append(args, req.Category)
	}
	if req.Brand != "" {
		query += ", brand = ?"
		args = append(args, req.Brand)
	}
	if req.Unit != "" {
		query += ", unit = ?"
		args = append(args, req.Unit)
	}
	if req.Price > 0 {
		query += ", price = ?"
		args = append(args, req.Price)
	}
	if req.Status == 0 || req.Status == 1 {
		query += ", status = ?"
		args = append(args, req.Status)
	}
	if req.Remark != "" {
		query += ", remark = ?"
		args = append(args, req.Remark)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	// 执行更新
	_, err = database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// 获取更新后的产品
	var p Product
	err = database.DB.QueryRow("SELECT id, name, code, category, brand, unit, CAST(price AS FLOAT) as price, status, remark, created_at, updated_at FROM products WHERE id = ?", id).Scan(
		&p.ID, &p.Name, &p.Code, &p.Category, &p.Brand, &p.Unit, &p.Price, &p.Status, &p.Remark, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated product"})
		return
	}

	c.JSON(http.StatusOK, p)
}

// deleteProduct 删除产品
func deleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// 检查产品是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// 执行删除
	_, err = database.DB.Exec("DELETE FROM products WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// BatchDeleteRequest 批量删除请求
type BatchDeleteRequest struct {
	IDs []int `json:"ids" binding:"required"`
}

// generateProductCodeAPI 生成产品编号API
func generateProductCodeAPI(c *gin.Context) {
	code, err := generateProductCode(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate product code"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": code})
}

// checkProductCode 检查产品编号是否唯一
func checkProductCode(c *gin.Context) {
	code := c.Query("code")
	idStr := c.Query("id")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product code is required"})
		return
	}

	var exists bool
	var err error

	if idStr == "" {
		// 新增产品时，检查所有产品
		err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE code = ?)", code).Scan(&exists)
	} else {
		// 编辑产品时，排除当前产品
		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
			return
		}
		err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE code = ? AND id != ?)", code, id).Scan(&exists)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check product code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"isUnique": !exists})
}

// generateCustomerCodeAPI 生成客户编号API
func generateCustomerCodeAPI(c *gin.Context) {
	code, err := generateCustomerCode(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate customer code"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": code})
}

// checkCustomerCode 检查客户编号是否唯一
func checkCustomerCode(c *gin.Context) {
	code := c.Query("code")
	idStr := c.Query("id")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer code is required"})
		return
	}

	var exists bool
	var err error
	if idStr == "" {
		// 新增客户时，检查所有客户
		err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE code = ?)", code).Scan(&exists)
	} else {
		// 编辑客户时，排除当前客户
		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
			return
		}
		err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE code = ? AND id != ?)", code, id).Scan(&exists)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check customer code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"isUnique": !exists})
}

// batchDeleteProducts 批量删除产品
func batchDeleteProducts(c *gin.Context) {
	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No product IDs provided"})
		return
	}

	// 构建批量删除语句
	query := "DELETE FROM products WHERE id IN ("
	args := []interface{}{}
	for i, id := range req.IDs {
		if i > 0 {
			query += ","
		}
		query += "?"
		args = append(args, id)
	}
	query += ")"

	// 执行批量删除
	result, err := database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete products"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Products deleted successfully",
		"rowsAffected": rowsAffected,
	})
}

// ========== 字典类型 API ==========

// getDictionaryTypes 获取字典类型列表
func getDictionaryTypes(c *gin.Context) {
	rows, err := database.DB.Query("SELECT id, code, name, created_at, updated_at FROM dictionary_types ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dictionary types: " + err.Error()})
		return
	}
	defer rows.Close()

	var types []DictionaryType
	for rows.Next() {
		var t DictionaryType
		if err := rows.Scan(&t.ID, &t.Code, &t.Name, &t.CreatedAt, &t.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan dictionary type: " + err.Error()})
			return
		}
		types = append(types, t)
	}

	c.JSON(http.StatusOK, types)
}

// getDictionaryTypeByID 根据ID获取字典类型
func getDictionaryTypeByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dictionary type ID"})
		return
	}

	var t DictionaryType
	err = database.DB.QueryRow("SELECT id, code, name, created_at, updated_at FROM dictionary_types WHERE id = ?", id).Scan(
		&t.ID, &t.Code, &t.Name, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dictionary type not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dictionary type"})
		return
	}

	c.JSON(http.StatusOK, t)
}

// generateDictTypeCode 生成字典类型编码（D+2位数字递增）
func generateDictTypeCode(db *sql.DB) (string, error) {
	// 获取当前最大的字典类型编码
	var maxCode sql.NullString
	err := db.QueryRow("SELECT MAX(code) FROM dictionary_types WHERE code REGEXP '^D[0-9]+$'").Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 系统无字典类型时，生成D01
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[1:]
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从D01开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成新编号，使用D+2位数字格式
	newCode := fmt.Sprintf("D%02d", nextNum)
	return newCode, nil
}

// createDictionaryType 创建字典类型
func createDictionaryType(c *gin.Context) {
	var req CreateDictionaryTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成字典类型编码
	dictTypeCode, err := generateDictTypeCode(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate dictionary type code"})
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO dictionary_types (code, name) VALUES (?, ?)",
		dictTypeCode, req.Name,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create dictionary type"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
		return
	}

	// 获取创建的字典类型
	var t DictionaryType
	err = database.DB.QueryRow("SELECT id, code, name, created_at, updated_at FROM dictionary_types WHERE id = ?", id).Scan(
		&t.ID, &t.Code, &t.Name, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created dictionary type"})
		return
	}

	c.JSON(http.StatusCreated, t)
}

// updateDictionaryType 更新字典类型
func updateDictionaryType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dictionary type ID"})
		return
	}

	var req UpdateDictionaryTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查字典类型是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM dictionary_types WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dictionary type not found"})
		return
	}

	// 构建更新语句
	query := "UPDATE dictionary_types SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if req.Name != "" {
		query += ", name = ?"
		args = append(args, req.Name)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	// 执行更新
	_, err = database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update dictionary type"})
		return
	}

	// 获取更新后的字典类型
	var t DictionaryType
	err = database.DB.QueryRow("SELECT id, code, name, created_at, updated_at FROM dictionary_types WHERE id = ?", id).Scan(
		&t.ID, &t.Code, &t.Name, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated dictionary type"})
		return
	}

	c.JSON(http.StatusOK, t)
}

// deleteDictionaryType 删除字典类型
func deleteDictionaryType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dictionary type ID"})
		return
	}

	// 检查字典类型是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM dictionary_types WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dictionary type not found"})
		return
	}

	// 执行删除
	_, err = database.DB.Exec("DELETE FROM dictionary_types WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete dictionary type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dictionary type deleted successfully"})
}

// batchDeleteDictionaryTypes 批量删除字典类型
func batchDeleteDictionaryTypes(c *gin.Context) {
	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No dictionary type IDs provided"})
		return
	}

	// 构建批量删除语句
	query := "DELETE FROM dictionary_types WHERE id IN ("
	args := []interface{}{}
	for i, id := range req.IDs {
		if i > 0 {
			query += ","
		}
		query += "?"
		args = append(args, id)
	}
	query += ")"

	// 执行批量删除
	result, err := database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete dictionary types"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Dictionary types deleted successfully",
		"rowsAffected": rowsAffected,
	})
}

// ========== 字典项 API ==========

// getDictionaryItems 获取字典项列表
func getDictionaryItems(c *gin.Context) {
	// 支持按字典类型筛选
	dictTypeCode := c.Query("dictTypeCode")

	var query string
	var args []interface{}

	if dictTypeCode != "" {
		query = "SELECT id, code, name, dict_type_code, status, created_at, updated_at FROM dictionary_items WHERE dict_type_code = ? ORDER BY created_at DESC"
		args = append(args, dictTypeCode)
	} else {
		query = "SELECT id, code, name, dict_type_code, status, created_at, updated_at FROM dictionary_items ORDER BY created_at DESC"
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dictionary items: " + err.Error()})
		return
	}
	defer rows.Close()

	var items []DictionaryItem
	for rows.Next() {
		var item DictionaryItem
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.DictTypeCode, &item.Status, &item.CreatedAt, &item.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan dictionary item: " + err.Error()})
			return
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}

// getDictionaryItemByID 根据ID获取字典项
func getDictionaryItemByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dictionary item ID"})
		return
	}

	var item DictionaryItem
	err = database.DB.QueryRow("SELECT id, code, name, dict_type_code, status, created_at, updated_at FROM dictionary_items WHERE id = ?", id).Scan(
		&item.ID, &item.Code, &item.Name, &item.DictTypeCode, &item.Status, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dictionary item not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dictionary item"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// generateDictItemCode 生成字典项编码（字典编号+3位递增数字，例如D01001、D01002）
func generateDictItemCode(db *sql.DB, dictTypeCode string) (string, error) {
	// 获取当前字典类型下最大的字典项编码
	var maxCode sql.NullString
	err := db.QueryRow("SELECT MAX(code) FROM dictionary_items WHERE dict_type_code = ? AND code REGEXP '^"+dictTypeCode+"[0-9]+$'", dictTypeCode).Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 当前字典类型无字典项时，生成字典编号+001
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[len(dictTypeCode):]
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从001开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成新编号，格式为字典编号+3位递增数字
	newCode := fmt.Sprintf("%s%03d", dictTypeCode, nextNum)
	return newCode, nil
}

// createDictionaryItem 创建字典项
func createDictionaryItem(c *gin.Context) {
	var req CreateDictionaryItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查字典类型是否存在
	var dictTypeExists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM dictionary_types WHERE code = ?)", req.DictTypeCode).Scan(&dictTypeExists)
	if !dictTypeExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dictionary type not found"})
		return
	}

	// 生成字典项编码
	dictItemCode, err := generateDictItemCode(database.DB, req.DictTypeCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate dictionary item code"})
		return
	}

	// 设置默认状态为1（启用）
	status := req.Status
	// 确保新建客户默认状态为启用
	if status == 0 {
		status = 1
	}

	result, err := database.DB.Exec(
		"INSERT INTO dictionary_items (code, name, dict_type_code, status) VALUES (?, ?, ?, ?)",
		dictItemCode, req.Name, req.DictTypeCode, status,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create dictionary item"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
		return
	}

	// 获取创建的字典项
	var item DictionaryItem
	err = database.DB.QueryRow("SELECT id, code, name, dict_type_code, status, created_at, updated_at FROM dictionary_items WHERE id = ?", id).Scan(
		&item.ID, &item.Code, &item.Name, &item.DictTypeCode, &item.Status, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created dictionary item"})
		return
	}

	c.JSON(http.StatusCreated, item)
}

// updateDictionaryItem 更新字典项
func updateDictionaryItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dictionary item ID"})
		return
	}

	var req UpdateDictionaryItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查字典项是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM dictionary_items WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dictionary item not found"})
		return
	}

	// 构建更新语句
	query := "UPDATE dictionary_items SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if req.Name != "" {
		query += ", name = ?"
		args = append(args, req.Name)
	}
	if req.DictTypeCode != "" {
		// 检查字典类型是否存在
		var dictTypeExists bool
		database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM dictionary_types WHERE code = ?)", req.DictTypeCode).Scan(&dictTypeExists)
		if !dictTypeExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dictionary type not found"})
			return
		}
		query += ", dict_type_code = ?"
		args = append(args, req.DictTypeCode)
	}
	if req.Status == 0 || req.Status == 1 {
		query += ", status = ?"
		args = append(args, req.Status)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	// 执行更新
	_, err = database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update dictionary item"})
		return
	}

	// 获取更新后的字典项
	var item DictionaryItem
	err = database.DB.QueryRow("SELECT id, code, name, dict_type_code, status, created_at, updated_at FROM dictionary_items WHERE id = ?", id).Scan(
		&item.ID, &item.Code, &item.Name, &item.DictTypeCode, &item.Status, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated dictionary item"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// deleteDictionaryItem 删除字典项
func deleteDictionaryItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dictionary item ID"})
		return
	}

	// 检查字典项是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM dictionary_items WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dictionary item not found"})
		return
	}

	// 执行删除
	_, err = database.DB.Exec("DELETE FROM dictionary_items WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete dictionary item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dictionary item deleted successfully"})
}

// batchDeleteDictionaryItems 批量删除字典项
func batchDeleteDictionaryItems(c *gin.Context) {
	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No dictionary item IDs provided"})
		return
	}

	// 构建批量删除语句
	query := "DELETE FROM dictionary_items WHERE id IN ("
	args := []interface{}{}
	for i, id := range req.IDs {
		if i > 0 {
			query += ","
		}
		query += "?"
		args = append(args, id)
	}
	query += ")"

	// 执行批量删除
	result, err := database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete dictionary items"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Dictionary items deleted successfully",
		"rowsAffected": rowsAffected,
	})
}

// getDictionaryItemsByTypeCode 根据字典类型编码获取字典项
func getDictionaryItemsByTypeCode(c *gin.Context) {
	code := c.Param("code")

	rows, err := database.DB.Query("SELECT id, code, name, dict_type_code, status, created_at, updated_at FROM dictionary_items WHERE dict_type_code = ? AND status = 1 ORDER BY created_at DESC", code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dictionary items: " + err.Error()})
		return
	}
	defer rows.Close()

	var items []DictionaryItem
	for rows.Next() {
		var item DictionaryItem
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.DictTypeCode, &item.Status, &item.CreatedAt, &item.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan dictionary item: " + err.Error()})
			return
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}

// ========== 设置 API ==========

// getSettings 获取所有设置
func getSettings(c *gin.Context) {
	rows, err := database.DB.Query("SELECT id, `key`, value, description, created_at, updated_at FROM settings ORDER BY `key` ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings: " + err.Error()})
		return
	}
	defer rows.Close()

	var settings []Setting
	for rows.Next() {
		var s Setting
		if err := rows.Scan(&s.ID, &s.Key, &s.Value, &s.Description, &s.CreatedAt, &s.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan setting: " + err.Error()})
			return
		}
		settings = append(settings, s)
	}

	c.JSON(http.StatusOK, settings)
}

// updateSettings 更新设置
func updateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 开始事务
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction: " + err.Error()})
		return
	}
	defer tx.Rollback()

	// 更新或插入每个设置，使用INSERT ... ON DUPLICATE KEY UPDATE避免重复键冲突
	for _, setting := range req.Settings {
		_, err := tx.Exec(
			"INSERT INTO settings (`key`, value, description, created_at, updated_at) "+
				"VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "+
				"ON DUPLICATE KEY UPDATE "+
				"value = VALUES(value), description = VALUES(description), updated_at = CURRENT_TIMESTAMP",
			setting.Key, setting.Value, setting.Description,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update setting: " + err.Error()})
			return
		}
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	// 返回更新后的设置
	getSettings(c)
}

// ========== 客户管理 API ==========

// generateCustomerCode 生成客户编号（D+4位数字递增）
func generateCustomerCode(db *sql.DB) (string, error) {
	// 获取当前最大的客户编号
	var maxCode sql.NullString
	err := db.QueryRow("SELECT MAX(code) FROM customers WHERE code REGEXP '^C[0-9]+$'").Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 系统无客户时，生成C0001
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[1:]
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从C0001开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成新编号，始终使用C+4位数字格式
	newCode := fmt.Sprintf("C%04d", nextNum)
	return newCode, nil
}

// getCustomers 获取客户列表
func getCustomers(c *gin.Context) {
	// 检查数据库连接
	if database.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection is nil"})
		return
	}

	rows, err := database.DB.Query("SELECT id, code, name, phone, COALESCE(province, ''), COALESCE(city, ''), COALESCE(district, ''), COALESCE(address, ''), COALESCE(company, ''), status, COALESCE(remark, ''), created_at, updated_at FROM customers ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customers: " + err.Error()})
		return
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var customer Customer
		if err := rows.Scan(&customer.ID, &customer.Code, &customer.Name, &customer.Phone, &customer.Province, &customer.City, &customer.District, &customer.Address, &customer.Company, &customer.Status, &customer.Remark, &customer.CreatedAt, &customer.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan customer: " + err.Error()})
			return
		}
		customers = append(customers, customer)
	}

	c.JSON(http.StatusOK, customers)
}

// getCustomerByID 根据ID获取客户
func getCustomerByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer Customer
	err = database.DB.QueryRow("SELECT id, code, name, phone, province, city, district, address, company, status, remark, created_at, updated_at FROM customers WHERE id = ?", id).Scan(
		&customer.ID, &customer.Code, &customer.Name, &customer.Phone, &customer.Province, &customer.City, &customer.District, &customer.Address, &customer.Company, &customer.Status, &customer.Remark, &customer.CreatedAt, &customer.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customer"})
		return
	}

	c.JSON(http.StatusOK, customer)
}

// createCustomer 创建客户
func createCustomer(c *gin.Context) {
	var req CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成或使用提供的客户编号
	customerCode := req.Code
	if customerCode == "" {
		var err error
		customerCode, err = generateCustomerCode(database.DB)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate customer code"})
			return
		}
	} else {
		// 验证客户编号唯一性
		var exists bool
		err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE code = ?)", customerCode).Scan(&exists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查客户编号失败"})
			return
		}
		if exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "客户编号已存在"})
			return
		}
	}

	// 设置默认状态为1（启用）
	status := req.Status
	if status == 0 {
		status = 1
	}

	result, err := database.DB.Exec(
		"INSERT INTO customers (name, code, phone, province, city, district, address, company, status, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		req.Name, customerCode, req.Phone, req.Province, req.City, req.District, req.Address, req.Company, status, req.Remark,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
		return
	}

	// 获取创建的客户
	var customer Customer
	err = database.DB.QueryRow("SELECT id, code, name, phone, province, city, district, address, company, status, remark, created_at, updated_at FROM customers WHERE id = ?", id).Scan(
		&customer.ID, &customer.Code, &customer.Name, &customer.Phone, &customer.Province, &customer.City, &customer.District, &customer.Address, &customer.Company, &customer.Status, &customer.Remark, &customer.CreatedAt, &customer.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created customer"})
		return
	}

	c.JSON(http.StatusCreated, customer)
}

// updateCustomer 更新客户
func updateCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var req UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查客户是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// 构建更新语句
	query := "UPDATE customers SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if req.Name != "" {
		query += ", name = ?"
		args = append(args, req.Name)
	}
	if req.Code != "" {
		// 验证客户编号唯一性（排除当前客户）
		var codeExists bool
		err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE code = ? AND id != ?)", req.Code, id).Scan(&codeExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查客户编号失败"})
			return
		}
		if codeExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "客户编号已存在"})
			return
		}
		query += ", code = ?"
		args = append(args, req.Code)
	}
	if req.Phone != "" {
		query += ", phone = ?"
		args = append(args, req.Phone)
	}
	if req.Province != "" {
		query += ", province = ?"
		args = append(args, req.Province)
	}
	if req.City != "" {
		query += ", city = ?"
		args = append(args, req.City)
	}
	if req.District != "" {
		query += ", district = ?"
		args = append(args, req.District)
	}
	if req.Address != "" {
		query += ", address = ?"
		args = append(args, req.Address)
	}
	if req.Company != "" {
		query += ", company = ?"
		args = append(args, req.Company)
	}
	if req.Status == 0 || req.Status == 1 {
		query += ", status = ?"
		args = append(args, req.Status)
	}
	if req.Remark != "" {
		query += ", remark = ?"
		args = append(args, req.Remark)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	// 执行更新
	_, err = database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer"})
		return
	}

	// 获取更新后的客户
	var customer Customer
	err = database.DB.QueryRow("SELECT id, code, name, phone, province, city, district, address, company, status, remark, created_at, updated_at FROM customers WHERE id = ?", id).Scan(
		&customer.ID, &customer.Code, &customer.Name, &customer.Phone, &customer.Province, &customer.City, &customer.District, &customer.Address, &customer.Company, &customer.Status, &customer.Remark, &customer.CreatedAt, &customer.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated customer"})
		return
	}

	c.JSON(http.StatusOK, customer)
}

// deleteCustomer 删除客户
func deleteCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	// 检查客户是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// 执行删除
	_, err = database.DB.Exec("DELETE FROM customers WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
}

// batchDeleteCustomers 批量删除客户
func batchDeleteCustomers(c *gin.Context) {
	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No customer IDs provided"})
		return
	}

	// 构建批量删除语句
	query := "DELETE FROM customers WHERE id IN ("
	args := []interface{}{}
	for i, id := range req.IDs {
		if i > 0 {
			query += ","
		}
		query += "?"
		args = append(args, id)
	}
	query += ")"

	// 执行批量删除
	result, err := database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customers"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Customers deleted successfully",
		"rowsAffected": rowsAffected,
	})
}

// ========== 销售订单 API ==========

// generateSaleOrderCode 生成销售订单号（S+YYMMDD+4位递增数字）
func generateSaleOrderCode(db *sql.DB) (string, error) {
	// 获取当前日期，格式：YYMMDD
	currentDate := time.Now().Format("060102")
	prefix := "S" + currentDate

	// 获取当天最大的销售订单号
	var maxCode sql.NullString
	query := "SELECT MAX(code) FROM sale_orders WHERE code LIKE ?"
	err := db.QueryRow(query, prefix+"%").Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 当天无订单时，从0001开始
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[7:] // 跳过前缀 S+YYMMDD (7位)
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从0001开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成新编号，始终使用S+YYMMDD+4位数字格式
	newCode := fmt.Sprintf("%s%04d", prefix, nextNum)
	return newCode, nil
}

// generateSaleOrderCodeInTx 在事务内生成销售订单号（S+YYMMDD+4位递增数字）
func generateSaleOrderCodeInTx(tx *sql.Tx) (string, error) {
	// 获取当前日期，格式：YYMMDD
	currentDate := time.Now().Format("060102")
	prefix := "S" + currentDate

	// 获取当天最大的销售订单号
	var maxCode sql.NullString
	query := "SELECT MAX(code) FROM sale_orders WHERE code LIKE ?"
	err := tx.QueryRow(query, prefix+"%").Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 当天无订单时，从0001开始
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[7:] // 跳过前缀 S+YYMMDD (7位)
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从0001开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成新编号，始终使用S+YYMMDD+4位数字格式
	newCode := fmt.Sprintf("%s%04d", prefix, nextNum)
	return newCode, nil
}

// generateSaleOrderCodeAPI 生成销售订单号API
func generateSaleOrderCodeAPI(c *gin.Context) {
	code, err := generateSaleOrderCode(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate sale order code"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": code})
}

// getSaleOrders 获取销售订单列表
func getSaleOrders(c *gin.Context) {
	// 检查数据库连接
	if database.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection is nil"})
		return
	}

	// 获取销售订单列表
	rows, err := database.DB.Query("SELECT id, code, create_time, customer_id, customer_name, customer_phone, customer_city, total_amount, paid_amount, COALESCE(remark, ''), created_at, updated_at FROM sale_orders ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sale orders: " + err.Error()})
		return
	}
	defer rows.Close()

	var saleOrders []SaleOrder
	for rows.Next() {
		var so SaleOrder
		if err := rows.Scan(&so.ID, &so.Code, &so.CreateTime, &so.CustomerID, &so.CustomerName, &so.CustomerPhone, &so.CustomerCity, &so.OrderAmount, &so.PaymentAmount, &so.Remark, &so.CreatedAt, &so.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan sale order: " + err.Error()})
			return
		}

		// 获取销售订单商品
		itemRows, err := database.DB.Query("SELECT id, sale_order_id, product_id, product_code, product_name, quantity, unit, price, discount_amount, total, COALESCE(remark, '') FROM sale_order_items WHERE sale_order_id = ?", so.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sale order items: " + err.Error()})
			return
		}

		var items []SaleOrderItem
		for itemRows.Next() {
			var item SaleOrderItem
			if err := itemRows.Scan(&item.ID, &item.SaleOrderID, &item.ProductID, &item.ProductCode, &item.ProductName, &item.Quantity, &item.Unit, &item.Price, &item.DiscountAmount, &item.TotalAmount, &item.Remark); err != nil {
				itemRows.Close()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan sale order item: " + err.Error()})
				return
			}
			items = append(items, item)
		}
		itemRows.Close()

		so.Items = items
		saleOrders = append(saleOrders, so)
	}

	c.JSON(http.StatusOK, saleOrders)
}

// getSaleOrderByID 根据ID获取销售订单
func getSaleOrderByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sale order ID"})
		return
	}

	// 获取销售订单
	var so SaleOrder
	err = database.DB.QueryRow("SELECT id, code, create_time, customer_id, customer_name, customer_phone, customer_city, total_amount, paid_amount, COALESCE(remark, ''), created_at, updated_at FROM sale_orders WHERE id = ?", id).Scan(
		&so.ID, &so.Code, &so.CreateTime, &so.CustomerID, &so.CustomerName, &so.CustomerPhone, &so.CustomerCity, &so.OrderAmount, &so.PaymentAmount, &so.Remark, &so.CreatedAt, &so.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sale order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sale order: " + err.Error()})
		return
	}

	// 获取销售订单商品
	itemRows, err := database.DB.Query("SELECT id, sale_order_id, product_id, product_code, product_name, quantity, unit, price, discount_amount, total, COALESCE(remark, '') FROM sale_order_items WHERE sale_order_id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sale order items: " + err.Error()})
		return
	}
	defer itemRows.Close()

	var items []SaleOrderItem
	for itemRows.Next() {
		var item SaleOrderItem
		if err := itemRows.Scan(&item.ID, &item.SaleOrderID, &item.ProductID, &item.ProductCode, &item.ProductName, &item.Quantity, &item.Unit, &item.Price, &item.DiscountAmount, &item.TotalAmount, &item.Remark); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan sale order item: " + err.Error()})
			return
		}
		items = append(items, item)
	}

	so.Items = items

	// 异步同步该客户的对帐单
	go func(customerID int) {
		if err := syncCustomerStatements(customerID); err != nil {
			log.Printf("同步客户对帐单失败：%v\n", err)
		}
	}(so.CustomerID)

	c.JSON(http.StatusOK, so)
}

// createSaleOrder 创建销售订单
func createSaleOrder(c *gin.Context) {
	var req CreateSaleOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 开始事务
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction: " + err.Error()})
		return
	}
	defer tx.Rollback()

	// 获取客户信息
	var customer Customer
	err = tx.QueryRow("SELECT name, phone, city FROM customers WHERE id = ?", req.CustomerID).Scan(&customer.Name, &customer.Phone, &customer.City)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customer: " + err.Error()})
		return
	}

	// 计算订单总金额
	var orderAmount float64
	for _, item := range req.Items {
		orderAmount += item.TotalAmount
	}

	// 订单号处理：优先使用前端传递的code，如果为空则自动生成
	orderCode := req.Code
	if orderCode == "" {
		// 使用事务内的连接生成订单号，确保原子性
		orderCode, err = generateSaleOrderCodeInTx(tx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate sale order code: " + err.Error()})
			return
		}
	}

	// 创建销售订单
	result, err := tx.Exec(
		"INSERT INTO sale_orders (code, create_time, customer_id, customer_name, customer_phone, customer_city, total_amount, paid_amount, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		orderCode, req.CreateTime, req.CustomerID, customer.Name, customer.Phone, customer.City, orderAmount, 0, req.Remark,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sale order: " + err.Error()})
		return
	}

	saleOrderID, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
		return
	}

	// 创建销售订单商品
	for _, item := range req.Items {
		_, err := tx.Exec(
			"INSERT INTO sale_order_items (sale_order_id, product_id, product_code, product_name, quantity, unit, price, discount_amount, total, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			saleOrderID, item.ProductID, item.ProductCode, item.ProductName, item.Quantity, item.Unit, item.Price, item.DiscountAmount, item.TotalAmount, item.Remark,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sale order item: " + err.Error()})
			return
		}
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	// 直接查询并返回创建的销售订单
	// 切换回普通连接查询
	// 获取销售订单
	var so SaleOrder
	err = database.DB.QueryRow("SELECT id, code, create_time, customer_id, customer_name, customer_phone, customer_city, total_amount, paid_amount, COALESCE(remark, ''), created_at, updated_at FROM sale_orders WHERE id = ?", saleOrderID).Scan(
		&so.ID, &so.Code, &so.CreateTime, &so.CustomerID, &so.CustomerName, &so.CustomerPhone, &so.CustomerCity, &so.OrderAmount, &so.PaymentAmount, &so.Remark, &so.CreatedAt, &so.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sale order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sale order: " + err.Error()})
		return
	}

	// 获取销售订单商品
	itemRows, err := database.DB.Query("SELECT id, sale_order_id, product_id, product_code, product_name, quantity, unit, price, discount_amount, total, COALESCE(remark, '') FROM sale_order_items WHERE sale_order_id = ?", saleOrderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sale order items: " + err.Error()})
		return
	}
	defer itemRows.Close()

	var items []SaleOrderItem
	for itemRows.Next() {
		var item SaleOrderItem
		if err := itemRows.Scan(&item.ID, &item.SaleOrderID, &item.ProductID, &item.ProductCode, &item.ProductName, &item.Quantity, &item.Unit, &item.Price, &item.DiscountAmount, &item.TotalAmount, &item.Remark); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan sale order item: " + err.Error()})
			return
		}
		items = append(items, item)
	}

	so.Items = items

	// 异步同步该客户的对帐单
	go func(customerID int) {
		if err := syncCustomerStatements(customerID); err != nil {
			log.Printf("同步客户对帐单失败：%v\n", err)
		}
	}(req.CustomerID)

	c.JSON(http.StatusOK, so)
}

// updateSaleOrder 更新销售订单
func updateSaleOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sale order ID"})
		return
	}

	var req UpdateSaleOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查销售订单是否存在
	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM sale_orders WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sale order not found"})
		return
	}

	// 开始事务
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction: " + err.Error()})
		return
	}
	defer tx.Rollback()

	// 获取客户信息
	var customer Customer
	err = tx.QueryRow("SELECT name, phone, city FROM customers WHERE id = ?", req.CustomerID).Scan(&customer.Name, &customer.Phone, &customer.City)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customer: " + err.Error()})
		return
	}

	// 计算订单总金额
	var orderAmount float64
	for _, item := range req.Items {
		orderAmount += item.TotalAmount
	}

	// 更新销售订单
	_, err = tx.Exec(
		"UPDATE sale_orders SET code = ?, create_time = ?, customer_id = ?, customer_name = ?, customer_phone = ?, customer_city = ?, total_amount = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		req.Code, req.CreateTime, req.CustomerID, customer.Name, customer.Phone, customer.City, orderAmount, req.Remark, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update sale order: " + err.Error()})
		return
	}

	// 删除旧的销售订单商品
	_, err = tx.Exec("DELETE FROM sale_order_items WHERE sale_order_id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old sale order items: " + err.Error()})
		return
	}

	// 创建新的销售订单商品
	for _, item := range req.Items {
		_, err := tx.Exec(
			"INSERT INTO sale_order_items (sale_order_id, product_id, product_code, product_name, quantity, unit, price, discount_amount, total, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			id, item.ProductID, item.ProductCode, item.ProductName, item.Quantity, item.Unit, item.Price, item.DiscountAmount, item.TotalAmount, item.Remark,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sale order item: " + err.Error()})
			return
		}
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	// 获取更新后的销售订单
	getSaleOrderByID(c)
}

// deleteSaleOrder 删除销售订单
func deleteSaleOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sale order ID"})
		return
	}

	// 获取客户ID以便后续同步对帐单
	var customerID int
	err = database.DB.QueryRow("SELECT customer_id FROM sale_orders WHERE id = ?", id).Scan(&customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get customer ID"})
		return
	}

	// 开始事务
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction: " + err.Error()})
		return
	}
	defer tx.Rollback()

	// 删除销售订单商品
	_, err = tx.Exec("DELETE FROM sale_order_items WHERE sale_order_id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete sale order items: " + err.Error()})
		return
	}

	// 删除销售订单
	_, err = tx.Exec("DELETE FROM sale_orders WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete sale order: " + err.Error()})
		return
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	// 异步同步该客户的对帐单
	go func(customerID int) {
		if err := syncCustomerStatements(customerID); err != nil {
			log.Printf("同步客户对帐单失败：%v\n", err)
		}
	}(customerID)

	c.JSON(http.StatusOK, gin.H{"message": "Sale order deleted successfully"})
}

// ========== 发票管理 API ==========

// getCustomerInvoices 获取客户发票列表
func getCustomerInvoices(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	rows, err := database.DB.Query("SELECT id, customer_id, company, tax_number, bank, bank_account, COALESCE(branch_address, ''), status, created_at, updated_at FROM invoices WHERE customer_id = ? ORDER BY created_at DESC", customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoices: " + err.Error()})
		return
	}
	defer rows.Close()

	var invoices []Invoice
	for rows.Next() {
		var invoice Invoice
		if err := rows.Scan(&invoice.ID, &invoice.CustomerID, &invoice.Company, &invoice.TaxNumber, &invoice.Bank, &invoice.BankAccount, &invoice.BranchAddress, &invoice.Status, &invoice.CreatedAt, &invoice.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan invoice: " + err.Error()})
			return
		}
		invoices = append(invoices, invoice)
	}

	c.JSON(http.StatusOK, invoices)
}

// createInvoice 创建发票
func createInvoice(c *gin.Context) {
	var req CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查客户是否存在
	var customerExists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = ?)", req.CustomerID).Scan(&customerExists)
	if !customerExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
		return
	}

	// 检查税号是否唯一
	var taxNumberExists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM invoices WHERE tax_number = ?)", req.TaxNumber).Scan(&taxNumberExists)
	if taxNumberExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tax number already exists"})
		return
	}

	// 设置默认状态为1（启用）
	status := req.Status
	if status == 0 {
		status = 1
	}

	result, err := database.DB.Exec(
		"INSERT INTO invoices (customer_id, company, tax_number, bank, bank_account, branch_address, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
		req.CustomerID, req.Company, req.TaxNumber, req.Bank, req.BankAccount, req.BranchAddress, status,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
		return
	}

	// 获取创建的发票
	var invoice Invoice
	err = database.DB.QueryRow("SELECT id, customer_id, company, tax_number, bank, bank_account, branch_address, status, created_at, updated_at FROM invoices WHERE id = ?", id).Scan(
		&invoice.ID, &invoice.CustomerID, &invoice.Company, &invoice.TaxNumber, &invoice.Bank, &invoice.BankAccount, &invoice.BranchAddress, &invoice.Status, &invoice.CreatedAt, &invoice.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created invoice"})
		return
	}

	c.JSON(http.StatusCreated, invoice)
}

// updateInvoice 更新发票
func updateInvoice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var req UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查发票是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM invoices WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// 构建更新语句
	query := "UPDATE invoices SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if req.Company != "" {
		query += ", company = ?"
		args = append(args, req.Company)
	}
	if req.TaxNumber != "" {
		// 检查税号是否唯一（排除当前发票）
		var taxNumberExists bool
		err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM invoices WHERE tax_number = ? AND id != ?)", req.TaxNumber, id).Scan(&taxNumberExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查税号失败"})
			return
		}
		if taxNumberExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "税号已存在"})
			return
		}
		query += ", tax_number = ?"
		args = append(args, req.TaxNumber)
	}
	if req.Bank != "" {
		query += ", bank = ?"
		args = append(args, req.Bank)
	}
	if req.BankAccount != "" {
		query += ", bank_account = ?"
		args = append(args, req.BankAccount)
	}
	if req.BranchAddress != "" {
		query += ", branch_address = ?"
		args = append(args, req.BranchAddress)
	}
	if req.Status == 0 || req.Status == 1 {
		query += ", status = ?"
		args = append(args, req.Status)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	// 执行更新
	_, err = database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice"})
		return
	}

	// 获取更新后的发票
	var invoice Invoice
	err = database.DB.QueryRow("SELECT id, customer_id, company, tax_number, bank, bank_account, branch_address, status, created_at, updated_at FROM invoices WHERE id = ?", id).Scan(
		&invoice.ID, &invoice.CustomerID, &invoice.Company, &invoice.TaxNumber, &invoice.Bank, &invoice.BankAccount, &invoice.BranchAddress, &invoice.Status, &invoice.CreatedAt, &invoice.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated invoice"})
		return
	}

	c.JSON(http.StatusOK, invoice)
}

// deleteInvoice 删除发票
func deleteInvoice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	// 检查发票是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM invoices WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// 执行删除
	_, err = database.DB.Exec("DELETE FROM invoices WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted successfully"})
}

// ========== 收款管理 API ==========

// generatePaymentCode 生成收款编号（D+6位数字递增）
func generatePaymentCode(db *sql.DB) (string, error) {
	// 获取当前最大的收款编号
	var maxCode sql.NullString
	err := db.QueryRow("SELECT MAX(code) FROM payments WHERE code REGEXP '^D[0-9]+$'").Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 系统无收款记录时，生成D000001
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[1:]
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从D000001开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成新编号，始终使用D+6位数字格式
	newCode := fmt.Sprintf("D%06d", nextNum)
	return newCode, nil
}

// getPayments 获取收款记录列表
func getPayments(c *gin.Context) {
	// 检查数据库连接
	if database.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection is nil"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT p.id, p.code, p.payment_date, p.customer_id, c.name as customer_name, p.sale_order_ids, CAST(p.amount AS FLOAT) as amount, p.payment_method, p.account, COALESCE(p.payer_company, ''), COALESCE(p.remark, ''), p.created_at, p.updated_at 
		FROM payments p 
		LEFT JOIN customers c ON p.customer_id = c.id 
		ORDER BY p.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments: " + err.Error()})
		return
	}
	defer rows.Close()

	var payments []Payment
	for rows.Next() {
		var payment Payment
		var saleOrderIdsJSON []byte
		if err := rows.Scan(&payment.ID, &payment.Code, &payment.PaymentDate, &payment.CustomerID, &payment.CustomerName, &saleOrderIdsJSON, &payment.Amount, &payment.PaymentMethod, &payment.Account, &payment.PayerCompany, &payment.Remark, &payment.CreatedAt, &payment.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan payment: " + err.Error()})
			return
		}

		// 解析sale_order_ids JSON
		if saleOrderIdsJSON != nil && len(saleOrderIdsJSON) > 0 {
			// 处理空字符串情况
			saleOrderIdsStr := string(saleOrderIdsJSON)
			if saleOrderIdsStr != "" && saleOrderIdsStr != "null" {
				err = json.Unmarshal(saleOrderIdsJSON, &payment.SaleOrderIDs)
				if err != nil {
					// JSON解析失败时，设置为空数组，增强容错性
					payment.SaleOrderIDs = []int{}
				}
			} else {
				// 空字符串或null时，设置为空数组
				payment.SaleOrderIDs = []int{}
			}
		} else {
			// 未设置值时，设置为空数组
			payment.SaleOrderIDs = []int{}
		}

		payments = append(payments, payment)
	}

	c.JSON(http.StatusOK, payments)
}

// createPayment 创建收款记录
func createPayment(c *gin.Context) {
	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查客户是否存在
	var customerExists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = ?)", req.CustomerID).Scan(&customerExists)
	if !customerExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
		return
	}

	// 生成收款编号
	paymentCode, err := generatePaymentCode(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate payment code"})
		return
	}

	// 将saleOrderIDs转换为JSON字符串
	saleOrderIdsJSON, err := json.Marshal(req.SaleOrderIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal sale order IDs"})
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO payments (code, payment_date, customer_id, sale_order_ids, amount, payment_method, account, payer_company, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		paymentCode, req.PaymentDate, req.CustomerID, saleOrderIdsJSON, req.Amount, req.PaymentMethod, req.Account, req.PayerCompany, req.Remark,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
		return
	}

	// 获取创建的收款记录
	var payment Payment
	var fetchedSaleOrderIdsJSON []byte
	err = database.DB.QueryRow(`
		SELECT p.id, p.code, p.payment_date, p.customer_id, c.name as customer_name, p.sale_order_ids, CAST(p.amount AS FLOAT) as amount, p.payment_method, p.account, COALESCE(p.payer_company, ''), COALESCE(p.remark, ''), p.created_at, p.updated_at 
		FROM payments p 
		LEFT JOIN customers c ON p.customer_id = c.id 
		WHERE p.id = ?
	`, id).Scan(
		&payment.ID, &payment.Code, &payment.PaymentDate, &payment.CustomerID, &payment.CustomerName, &fetchedSaleOrderIdsJSON, &payment.Amount, &payment.PaymentMethod, &payment.Account, &payment.PayerCompany, &payment.Remark, &payment.CreatedAt, &payment.UpdatedAt,
	)

	// 解析sale_order_ids JSON
	if fetchedSaleOrderIdsJSON != nil && len(fetchedSaleOrderIdsJSON) > 0 {
		// 处理空字符串情况
		saleOrderIdsStr := string(fetchedSaleOrderIdsJSON)
		if saleOrderIdsStr != "" && saleOrderIdsStr != "null" {
			err = json.Unmarshal(fetchedSaleOrderIdsJSON, &payment.SaleOrderIDs)
			if err != nil {
				// JSON解析失败时，设置为空数组，增强容错性
				payment.SaleOrderIDs = []int{}
			}
		} else {
			// 空字符串或null时，设置为空数组
			payment.SaleOrderIDs = []int{}
		}
	} else {
		// 未设置值时，设置为空数组
		payment.SaleOrderIDs = []int{}
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created payment"})
		return
	}

	// 异步同步该客户的对帐单
	go func(customerID int) {
		if err := syncCustomerStatements(customerID); err != nil {
			log.Printf("同步客户对帐单失败：%v\n", err)
		}
	}(req.CustomerID)

	c.JSON(http.StatusCreated, payment)
}

// batchCreatePayments 批量创建收款记录
func batchCreatePayments(c *gin.Context) {
	var req BatchCreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Payments) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No payments provided"})
		return
	}

	// 开始事务
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction: " + err.Error()})
		return
	}
	defer tx.Rollback()

	// 预生成所有收款编号，确保唯一性
	var paymentCodes []string
	// 获取当前最大的收款编号
	var maxCode sql.NullString
	err = tx.QueryRow("SELECT MAX(code) FROM payments WHERE code REGEXP '^D[0-9]+$'").Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get max payment code"})
		return
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 系统无收款记录时，从D000001开始
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[1:]
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从D000001开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成所有需要的编号
	for i := 0; i < len(req.Payments); i++ {
		newCode := fmt.Sprintf("D%06d", nextNum+i)
		paymentCodes = append(paymentCodes, newCode)
	}

	// 批量插入收款记录
	var payments []Payment
	for i, paymentReq := range req.Payments {
		// 检查客户是否存在
		var customerExists bool
		err := tx.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = ?)", paymentReq.CustomerID).Scan(&customerExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check customer existence: " + err.Error()})
			return
		}
		if !customerExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found for payment"})
			return
		}

		// 使用预生成的编号
		paymentCode := paymentCodes[i]

		// 将saleOrderIDs转换为JSON字符串
		saleOrderIdsJSON, err := json.Marshal(paymentReq.SaleOrderIDs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal sale order IDs"})
			return
		}

		// 插入收款记录
		result, err := tx.Exec(
			"INSERT INTO payments (code, payment_date, customer_id, sale_order_ids, amount, payment_method, account, payer_company, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			paymentCode, paymentReq.PaymentDate, paymentReq.CustomerID, saleOrderIdsJSON, paymentReq.Amount, paymentReq.PaymentMethod, paymentReq.Account, paymentReq.PayerCompany, paymentReq.Remark,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment: " + err.Error()})
			return
		}

		// 获取创建的收款记录
		id, err := result.LastInsertId()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
			return
		}

		var payment Payment
		var fetchedSaleOrderIdsJSON []byte
		err = tx.QueryRow(`
			SELECT p.id, p.code, p.payment_date, p.customer_id, c.name as customer_name, p.sale_order_ids, CAST(p.amount AS FLOAT) as amount, p.payment_method, p.account, COALESCE(p.payer_company, ''), COALESCE(p.remark, ''), p.created_at, p.updated_at 
			FROM payments p 
			LEFT JOIN customers c ON p.customer_id = c.id 
			WHERE p.id = ?
		`, id).Scan(
			&payment.ID, &payment.Code, &payment.PaymentDate, &payment.CustomerID, &payment.CustomerName, &fetchedSaleOrderIdsJSON, &payment.Amount, &payment.PaymentMethod, &payment.Account, &payment.PayerCompany, &payment.Remark, &payment.CreatedAt, &payment.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created payment"})
			return
		}

		// 解析sale_order_ids JSON
		if fetchedSaleOrderIdsJSON != nil && len(fetchedSaleOrderIdsJSON) > 0 {
			// 处理空字符串情况
			saleOrderIdsStr := string(fetchedSaleOrderIdsJSON)
			if saleOrderIdsStr != "" && saleOrderIdsStr != "null" {
				err = json.Unmarshal(fetchedSaleOrderIdsJSON, &payment.SaleOrderIDs)
				if err != nil {
					// JSON解析失败时，设置为空数组，增强容错性
					payment.SaleOrderIDs = []int{}
				}
			} else {
				// 空字符串或null时，设置为空数组
				payment.SaleOrderIDs = []int{}
			}
		} else {
			// 未设置值时，设置为空数组
			payment.SaleOrderIDs = []int{}
		}

		payments = append(payments, payment)
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, payments)
}

// updatePayment 更新收款记录
func updatePayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var req UpdatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查收款记录是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM payments WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// 构建更新语句
	query := "UPDATE payments SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if req.PaymentDate != "" {
		query += ", payment_date = ?"
		args = append(args, req.PaymentDate)
	}
	if req.CustomerID > 0 {
		// 检查客户是否存在
		var customerExists bool
		database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = ?)", req.CustomerID).Scan(&customerExists)
		if !customerExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
			return
		}
		query += ", customer_id = ?"
		args = append(args, req.CustomerID)
	}
	// 处理销售订单ID列表
	if req.SaleOrderIDs != nil {
		saleOrderIdsJSON, err := json.Marshal(req.SaleOrderIDs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal sale order IDs"})
			return
		}
		query += ", sale_order_ids = ?"
		args = append(args, saleOrderIdsJSON)
	}
	if req.Amount > 0 {
		query += ", amount = ?"
		args = append(args, req.Amount)
	}
	if req.PaymentMethod != "" {
		query += ", payment_method = ?"
		args = append(args, req.PaymentMethod)
	}
	if req.Account != "" {
		query += ", account = ?"
		args = append(args, req.Account)
	}
	if req.PayerCompany != "" {
		query += ", payer_company = ?"
		args = append(args, req.PayerCompany)
	}
	if req.Remark != "" {
		query += ", remark = ?"
		args = append(args, req.Remark)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	// 执行更新
	_, err = database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
		return
	}

	// 获取更新后的收款记录
	var payment Payment
	var fetchedSaleOrderIdsJSON []byte
	err = database.DB.QueryRow(`
		SELECT p.id, p.code, p.payment_date, p.customer_id, c.name as customer_name, p.sale_order_ids, CAST(p.amount AS FLOAT) as amount, p.payment_method, p.account, COALESCE(p.payer_company, ''), COALESCE(p.remark, ''), p.created_at, p.updated_at 
		FROM payments p 
		LEFT JOIN customers c ON p.customer_id = c.id 
		WHERE p.id = ?
	`, id).Scan(
		&payment.ID, &payment.Code, &payment.PaymentDate, &payment.CustomerID, &payment.CustomerName, &fetchedSaleOrderIdsJSON, &payment.Amount, &payment.PaymentMethod, &payment.Account, &payment.PayerCompany, &payment.Remark, &payment.CreatedAt, &payment.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated payment"})
		return
	}

	// 解析sale_order_ids JSON
	if fetchedSaleOrderIdsJSON != nil && len(fetchedSaleOrderIdsJSON) > 0 {
		// 处理空字符串情况
		saleOrderIdsStr := string(fetchedSaleOrderIdsJSON)
		if saleOrderIdsStr != "" && saleOrderIdsStr != "null" {
			err = json.Unmarshal(fetchedSaleOrderIdsJSON, &payment.SaleOrderIDs)
			if err != nil {
				// JSON解析失败时，设置为空数组，增强容错性
				payment.SaleOrderIDs = []int{}
			}
		} else {
			// 空字符串或null时，设置为空数组
			payment.SaleOrderIDs = []int{}
		}
	} else {
		// 未设置值时，设置为空数组
		payment.SaleOrderIDs = []int{}
	}

	// 异步同步该客户的对帐单
	go func(customerID int) {
		if err := syncCustomerStatements(customerID); err != nil {
			log.Printf("同步客户对帐单失败：%v\n", err)
		}
	}(payment.CustomerID)

	c.JSON(http.StatusOK, payment)
}

// deletePayment 删除收款记录
func deletePayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	// 获取客户ID以便后续同步对帐单
	var customerID int
	err = database.DB.QueryRow("SELECT customer_id FROM payments WHERE id = ?", id).Scan(&customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get customer ID"})
		return
	}

	// 检查收款记录是否存在
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM payments WHERE id = ?)", id).Scan(&exists)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// 执行删除
	_, err = database.DB.Exec("DELETE FROM payments WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment"})
		return
	}

	// 异步同步该客户的对帐单
	go func(customerID int) {
		if err := syncCustomerStatements(customerID); err != nil {
			log.Printf("同步客户对帐单失败：%v\n", err)
		}
	}(customerID)

	c.JSON(http.StatusOK, gin.H{"message": "Payment deleted successfully"})
}
