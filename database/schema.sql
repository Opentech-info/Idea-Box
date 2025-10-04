-- School Project Platform Database Schema
-- Created by AZsubay.dev

-- Create database
CREATE DATABASE IF NOT EXISTS school_project_platform;
USE school_project_platform;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2FA fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tech_stack TEXT NOT NULL,
    description TEXT NOT NULL,
    folder_structure TEXT,
    github_link VARCHAR(255),
    preview_media VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cart/Wishlist table
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_project (user_id, project_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    project_id INT NOT NULL,
    project_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method ENUM('credit_card', 'paypal', 'bank_transfer', 'mobile_money') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add price column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_purchasable BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS download_link VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS license_type ENUM('personal', 'commercial', 'educational') DEFAULT 'personal';

-- Ads table for video slider
CREATE TABLE IF NOT EXISTS ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@azsubay.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample projects with pricing
INSERT INTO projects (name, tech_stack, description, folder_structure, github_link, preview_media, price, is_purchasable, download_link, license_type) VALUES 
('Student Management System', 'Node.js, Express, MySQL, Bootstrap', 'A complete student management system with authentication, dashboard, and admin panel.', '/src\n  /controllers\n  /models\n  /views\n  /public\n  /routes', 'https://github.com/AZsubay/student-management', 'pict/1.jpg', 49.99, true, 'https://drive.google.com/student-management.zip', 'commercial'),
('E-commerce Platform', 'React, Node.js, MongoDB, Stripe', 'Full-stack e-commerce platform with payment integration and admin dashboard.', '/client\n  /src\n    /components\n    /pages\n    /services\n  /server\n    /models\n    /routes\n    /middleware', 'https://github.com/AZsubay/ecommerce', 'pict/2.jpg', 79.99, true, 'https://drive.google.com/ecommerce.zip', 'commercial'),
('Weather App', 'JavaScript, API Integration, CSS3', 'Real-time weather application with geolocation and 5-day forecast.', '/index.html\n  /css\n    /style.css\n  /js\n    /app.js\n  /assets\n    /images', 'https://github.com/AZsubay/weather-app', 'pict/3.jpg', 19.99, true, 'https://drive.google.com/weather-app.zip', 'personal'),
('Task Management App', 'Vue.js, Firebase, Vuetify', 'Collaborative task management application with real-time updates.', '/public\n  /src\n    /components\n    /views\n    /store\n    /router\n  /firebase', 'https://github.com/AZsubay/task-manager', 'pict/4.jpg', 39.99, true, 'https://drive.google.com/task-manager.zip', 'educational'),
('Portfolio Website', 'HTML5, CSS3, JavaScript, GSAP', 'Responsive portfolio website with animations and modern design.', '/index.html\n  /css\n    /main.css\n    /animations.css\n  /js\n    /main.js\n    /animations.js\n  /assets\n    /images\n    /icons', 'https://github.com/AZsubay/portfolio', 'pict/5.jpg', 29.99, true, 'https://drive.google.com/portfolio.zip', 'personal'),
('Chat Application', 'Socket.io, Node.js, Express, MongoDB', 'Real-time chat application with private messaging and group chats.', '/client\n  /src\n    /components\n    /services\n  /server\n    /models\n    /routes\n    /socket', 'https://github.com/AZsubay/chat-app', 'pict/6.jpg', 59.99, true, 'https://drive.google.com/chat-app.zip', 'commercial')
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample ads for video slider
INSERT INTO ads (title, video_url, status) VALUES 
('Welcome to AZsubay.dev Projects', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 'active'),
('Featured Student Projects', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4', 'active'),
('New Project Releases', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4', 'active')
ON DUPLICATE KEY UPDATE title = title;
