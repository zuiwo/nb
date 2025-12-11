package database

import (
	"database/sql"
	"fmt"
	"log"

	"nb2/internal/config"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func InitDB(config *config.DatabaseConfig) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=True&loc=Local",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		config.DBName,
		config.Charset,
	)

	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// 测试数据库连接
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection established successfully")

	// 创建products表（如果不存在）
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS products (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50) UNIQUE,
		category VARCHAR(100),
		brand VARCHAR(100),
		unit VARCHAR(50),
		price DECIMAL(10, 2) NOT NULL,
		status TINYINT DEFAULT 1,
		remark TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`

	if _, err := DB.Exec(createTableSQL); err != nil {
		return fmt.Errorf("failed to create products table: %w", err)
	}

	log.Println("Products table created successfully")

	// 创建dictionary_types表（如果不存在）
	createDictTypesTableSQL := `
	CREATE TABLE IF NOT EXISTS dictionary_types (
		id INT AUTO_INCREMENT PRIMARY KEY,
		code VARCHAR(20) NOT NULL UNIQUE,
		name VARCHAR(50) NOT NULL,
		status TINYINT DEFAULT 1,
		sort INT DEFAULT 0,
		remark TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`

	if _, err := DB.Exec(createDictTypesTableSQL); err != nil {
		return fmt.Errorf("failed to create dictionary_types table: %w", err)
	}

	log.Println("Dictionary_types table created successfully")

	// 创建dictionary_items表（如果不存在）
	createDictItemsTableSQL := `
  CREATE TABLE IF NOT EXISTS dictionary_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    dict_type_code VARCHAR(20) NOT NULL,
    status TINYINT DEFAULT 1,
    sort INT DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dict_type_code) REFERENCES dictionary_types(code) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `

	if _, err := DB.Exec(createDictItemsTableSQL); err != nil {
		return fmt.Errorf("failed to create dictionary_items table: %w", err)
	}

	log.Println("Dictionary_items table created successfully")

	// 创建settings表（如果不存在）
	createSettingsTableSQL := "CREATE TABLE IF NOT EXISTS settings (" +
		"id INT AUTO_INCREMENT PRIMARY KEY," +
		"`key` VARCHAR(50) NOT NULL UNIQUE," +
		"value VARCHAR(255) NOT NULL," +
		"description TEXT," +
		"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
		"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"

	if _, err := DB.Exec(createSettingsTableSQL); err != nil {
		return fmt.Errorf("failed to create settings table: %w", err)
	}

	log.Println("Settings table created successfully")

	// 插入字典类型数据
	insertDictTypesSQL := "INSERT INTO dictionary_types (code, name) VALUES " +
		"('D01', '产品分类'), " +
		"('D02', '产品品牌'), " +
		"('D03', '产品单位'), " +
		"('D04', '付款方式'), " +
		"('D05', '收款账户') " +
		"ON DUPLICATE KEY UPDATE name = VALUES(name);"

	if _, err := DB.Exec(insertDictTypesSQL); err != nil {
		return fmt.Errorf("failed to insert dictionary types: %w", err)
	}

	log.Println("Dictionary types inserted successfully")

	// 先清空现有的字典项数据
	if _, err := DB.Exec("DELETE FROM dictionary_items"); err != nil {
		return fmt.Errorf("failed to delete existing dictionary items: %w", err)
	}

	// 插入字典项数据 - 每个字典类型只保留一个默认值
	insertDictItemsSQL := "INSERT INTO dictionary_items (code, name, dict_type_code, status) VALUES " +
		"('D01001', '字典默认值', 'D01', 1), " +
		"('D02001', '字典默认值', 'D02', 1), " +
		"('D03001', '字典默认值', 'D03', 1), " +
		"('D04001', '字典默认值', 'D04', 1), " +
		"('D05001', '字典默认值', 'D05', 1) " +
		"ON DUPLICATE KEY UPDATE name = VALUES(name), dict_type_code = VALUES(dict_type_code), status = VALUES(status);"

	if _, err := DB.Exec(insertDictItemsSQL); err != nil {
		return fmt.Errorf("failed to insert dictionary items: %w", err)
	}

	log.Println("Dictionary items inserted successfully")

	// 插入初始设置数据
	insertSettingsSQL := "INSERT INTO settings (`key`, value, description) VALUES " +
		"('product_category_dict', 'D01', '产品分类字典'), " +
		"('product_brand_dict', 'D02', '品牌字典'), " +
		"('product_unit_dict', 'D03', '单位字典'), " +
		"('payment_method_dict', 'D04', '付款方式字典'), " +
		"('payment_account_dict', 'D05', '收款账户字典') " +
		"ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);"

	if _, err := DB.Exec(insertSettingsSQL); err != nil {
		return fmt.Errorf("failed to insert initial settings: %w", err)
	}

	log.Println("Initial settings inserted successfully")

	// 创建customers表（如果不存在）
	createCustomersTableSQL := `
  CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    province VARCHAR(50),
    city VARCHAR(50),
    district VARCHAR(50),
    address VARCHAR(200),
    company VARCHAR(100),
    status TINYINT DEFAULT 1,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `

	if _, err := DB.Exec(createCustomersTableSQL); err != nil {
		return fmt.Errorf("failed to create customers table: %w", err)
	}

	log.Println("Customers table created successfully")

	// 创建invoices表（如果不存在）
	createInvoicesTableSQL := `
  CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    company VARCHAR(100) NOT NULL,
    tax_number VARCHAR(20) NOT NULL UNIQUE,
    bank VARCHAR(100) NOT NULL,
    bank_account VARCHAR(30) NOT NULL,
    branch_address VARCHAR(200),
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `

	if _, err := DB.Exec(createInvoicesTableSQL); err != nil {
		return fmt.Errorf("failed to create invoices table: %w", err)
	}

	log.Println("Invoices table created successfully")

	// 创建payments表（如果不存在）
	createPaymentsTableSQL := `
  CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    payment_date DATE NOT NULL,
    customer_id INT NOT NULL,
    sale_order_ids JSON,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    account VARCHAR(50),
    payer_company VARCHAR(100),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `

	if _, err := DB.Exec(createPaymentsTableSQL); err != nil {
		return fmt.Errorf("failed to create payments table: %w", err)
	}

	log.Println("Payments table created successfully")

	// 创建sale_orders表（如果不存在）
	createSaleOrdersTableSQL := `
	CREATE TABLE IF NOT EXISTS sale_orders (
		id INT AUTO_INCREMENT PRIMARY KEY,
		code VARCHAR(20) UNIQUE,
		total_amount DECIMAL(12, 2) NOT NULL,
		paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
		create_time TIMESTAMP NOT NULL,
		customer_id INT NOT NULL,
		customer_name VARCHAR(100) NOT NULL,
		customer_phone VARCHAR(20) NOT NULL,
		customer_city VARCHAR(50),
		remark TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`

	if _, err := DB.Exec(createSaleOrdersTableSQL); err != nil {
		return fmt.Errorf("failed to create sale_orders table: %w", err)
	}

	log.Println("Sale_orders table created successfully")

	// 创建sale_order_items表（如果不存在）
	createSaleOrderItemsTableSQL := `
	CREATE TABLE IF NOT EXISTS sale_order_items (
		id INT AUTO_INCREMENT PRIMARY KEY,
		sale_order_id INT NOT NULL,
		product_id INT NOT NULL,
		product_code VARCHAR(50),
		product_name VARCHAR(255) NOT NULL,
		quantity DECIMAL(10, 2) NOT NULL,
		unit VARCHAR(50) NOT NULL,
		price DECIMAL(10, 2) NOT NULL,
		total DECIMAL(12, 2) NOT NULL,
		discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
		remark TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id) ON DELETE CASCADE
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`

	if _, err := DB.Exec(createSaleOrderItemsTableSQL); err != nil {
		return fmt.Errorf("failed to create sale_order_items table: %w", err)
	}

	log.Println("Sale_order_items table created successfully")

	// 创建statement_records表（如果不存在）
	createStatementRecordsTableSQL := `
	CREATE TABLE IF NOT EXISTS statement_records (
		id INT AUTO_INCREMENT PRIMARY KEY,
		customer_id INT NOT NULL,
		customer_code VARCHAR(20) NOT NULL,
		customer_name VARCHAR(100) NOT NULL,
		date DATE NOT NULL,
		sale_amount DECIMAL(12, 2) DEFAULT 0,
		payment_amount DECIMAL(12, 2) DEFAULT 0,
		balance DECIMAL(12, 2) NOT NULL,
		remark TEXT,
		source_type VARCHAR(20) NOT NULL,
		source_id INT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
		UNIQUE KEY unique_source (source_type, source_id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`

	if _, err := DB.Exec(createStatementRecordsTableSQL); err != nil {
		return fmt.Errorf("failed to create statement_records table: %w", err)
	}

	log.Println("Statement_records table created successfully")

	// 设置连接池参数
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)

	return nil
}

func CloseDB() {
	if DB != nil {
		DB.Close()
		log.Println("Database connection closed")
	}
}
