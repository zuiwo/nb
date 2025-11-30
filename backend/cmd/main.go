package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

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
	Phone    string `json:"phone" binding:"required"`
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
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	PaymentMethod string  `json:"paymentMethod" binding:"required"`
	Account       string  `json:"account" binding:"required"`
	PayerCompany  string  `json:"payerCompany"`
	Remark        string  `json:"remark"`
}

// UpdatePaymentRequest 更新收款记录请求
type UpdatePaymentRequest struct {
	PaymentDate   string  `json:"paymentDate"`
	CustomerID    int     `json:"customerId"`
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

func main() {
	// 加载配置
	cfg := config.LoadConfig()

	// 初始化数据库连接
	if err := database.InitDB(&cfg.Database); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

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
		customers.GET("", getCustomers)
		customers.GET("/:id", getCustomerByID)
		customers.POST("", createCustomer)
		customers.PUT("/:id", updateCustomer)
		customers.DELETE("/:id", deleteCustomer)
		customers.DELETE("/batch", batchDeleteCustomers)
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
	err := db.QueryRow("SELECT MAX(code) FROM dictionary_items WHERE dict_type_code = ? AND code REGEXP '^" + dictTypeCode + "[0-9]+$'", dictTypeCode).Scan(&maxCode)
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

	// 更新每个设置
	for _, setting := range req.Settings {
		_, err := tx.Exec(
			"UPDATE settings SET value = ?, description = ? WHERE `key` = ?",
			setting.Value, setting.Description, setting.Key,
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
	err := db.QueryRow("SELECT MAX(code) FROM customers WHERE code REGEXP '^D[0-9]+$'").Scan(&maxCode)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}

	var nextNum int
	if !maxCode.Valid || maxCode.String == "" {
		// 系统无客户时，生成D0001
		nextNum = 1
	} else {
		// 提取数字部分并递增
		numPart := maxCode.String[1:]
		currentNum, err := strconv.Atoi(numPart)
		if err != nil {
			// 格式错误时，从D0001开始
			nextNum = 1
		} else {
			nextNum = currentNum + 1
		}
	}

	// 生成新编号，始终使用D+4位数字格式
	newCode := fmt.Sprintf("D%04d", nextNum)
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
		SELECT p.id, p.code, p.payment_date, p.customer_id, c.name as customer_name, CAST(p.amount AS FLOAT) as amount, p.payment_method, p.account, COALESCE(p.payer_company, ''), COALESCE(p.remark, ''), p.created_at, p.updated_at 
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
		if err := rows.Scan(&payment.ID, &payment.Code, &payment.PaymentDate, &payment.CustomerID, &payment.CustomerName, &payment.Amount, &payment.PaymentMethod, &payment.Account, &payment.PayerCompany, &payment.Remark, &payment.CreatedAt, &payment.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan payment: " + err.Error()})
			return
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

	result, err := database.DB.Exec(
		"INSERT INTO payments (code, payment_date, customer_id, amount, payment_method, account, payer_company, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		paymentCode, req.PaymentDate, req.CustomerID, req.Amount, req.PaymentMethod, req.Account, req.PayerCompany, req.Remark,
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
	err = database.DB.QueryRow(`
		SELECT p.id, p.code, p.payment_date, p.customer_id, c.name as customer_name, CAST(p.amount AS FLOAT) as amount, p.payment_method, p.account, COALESCE(p.payer_company, ''), COALESCE(p.remark, ''), p.created_at, p.updated_at 
		FROM payments p 
		LEFT JOIN customers c ON p.customer_id = c.id 
		WHERE p.id = ?
	`, id).Scan(
		&payment.ID, &payment.Code, &payment.PaymentDate, &payment.CustomerID, &payment.CustomerName, &payment.Amount, &payment.PaymentMethod, &payment.Account, &payment.PayerCompany, &payment.Remark, &payment.CreatedAt, &payment.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created payment"})
		return
	}

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

	// 批量插入收款记录
	var payments []Payment
	for _, paymentReq := range req.Payments {
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

		// 生成收款编号
		paymentCode, err := generatePaymentCode(database.DB)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate payment code"})
			return
		}

		// 插入收款记录
		result, err := tx.Exec(
			"INSERT INTO payments (code, payment_date, customer_id, amount, payment_method, account, payer_company, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			paymentCode, paymentReq.PaymentDate, paymentReq.CustomerID, paymentReq.Amount, paymentReq.PaymentMethod, paymentReq.Account, paymentReq.PayerCompany, paymentReq.Remark,
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
		err = tx.QueryRow(`
			SELECT p.id, p.code, p.payment_date, p.customer_id, c.name as customer_name, CAST(p.amount AS FLOAT) as amount, p.payment_method, p.account, COALESCE(p.payer_company, ''), COALESCE(p.remark, ''), p.created_at, p.updated_at 
			FROM payments p 
			LEFT JOIN customers c ON p.customer_id = c.id 
			WHERE p.id = ?
		`, id).Scan(
			&payment.ID, &payment.Code, &payment.PaymentDate, &payment.CustomerID, &payment.CustomerName, &payment.Amount, &payment.PaymentMethod, &payment.Account, &payment.PayerCompany, &payment.Remark, &payment.CreatedAt, &payment.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created payment"})
			return
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
	err = database.DB.QueryRow(`
		SELECT p.id, p.code, p.payment_date, p.customer_id, c.name as customer_name, CAST(p.amount AS FLOAT) as amount, p.payment_method, p.account, COALESCE(p.payer_company, ''), COALESCE(p.remark, ''), p.created_at, p.updated_at 
		FROM payments p 
		LEFT JOIN customers c ON p.customer_id = c.id 
		WHERE p.id = ?
	`, id).Scan(
		&payment.ID, &payment.Code, &payment.PaymentDate, &payment.CustomerID, &payment.CustomerName, &payment.Amount, &payment.PaymentMethod, &payment.Account, &payment.PayerCompany, &payment.Remark, &payment.CreatedAt, &payment.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated payment"})
		return
	}

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

	c.JSON(http.StatusOK, gin.H{"message": "Payment deleted successfully"})
}
