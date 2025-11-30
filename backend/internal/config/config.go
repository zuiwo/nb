package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
}

type ServerConfig struct {
	Port string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	Charset  string
}

func LoadConfig() *Config {
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("../")
	viper.AddConfigPath("../../")
	viper.AutomaticEnv()

	// 设置默认值
	viper.SetDefault("SERVER_PORT", "8080")
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "3306")
	viper.SetDefault("DB_USER", "root")
	viper.SetDefault("DB_PASSWORD", "123456")
	viper.SetDefault("DB_NAME", "nb2")
	viper.SetDefault("DB_CHARSET", "utf8mb4")

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Could not find config file: %v", err)
	}

	config := &Config{
		Server: ServerConfig{
			Port: viper.GetString("SERVER_PORT"),
		},
		Database: DatabaseConfig{
			Host:     viper.GetString("DB_HOST"),
			Port:     viper.GetString("DB_PORT"),
			User:     viper.GetString("DB_USER"),
			Password: viper.GetString("DB_PASSWORD"),
			DBName:   viper.GetString("DB_NAME"),
			Charset:  viper.GetString("DB_CHARSET"),
		},
	}

	return config
}
