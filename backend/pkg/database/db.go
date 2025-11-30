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
