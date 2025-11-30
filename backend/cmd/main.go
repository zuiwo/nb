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
