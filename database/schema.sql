CREATE DATABASE IF NOT EXISTS scrap_management;
USE scrap_management;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    permissions VARCHAR(255) NOT NULL DEFAULT 'all',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS scrap_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255),
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    scheduled_at DATETIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_order_category FOREIGN KEY (category_id) REFERENCES scrap_categories(id)
);

CREATE TABLE IF NOT EXISTS scrap_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_image_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

INSERT INTO scrap_categories (name, description, base_price, image_url) VALUES
('Aluminum Scrap', 'Cans, frames, and industrial aluminum waste.', 120, 'https://images.unsplash.com/photo-1605600659908-0ef719419d41'),
('Copper Scrap', 'Copper wires, tubing, and electrical scrap.', 550, 'https://images.unsplash.com/photo-1581092446327-9f89f3f0d4d4'),
('Metal Scrap', 'Mixed ferrous and non-ferrous metal scrap.', 90, 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b'),
('Plastic Scrap', 'PET, HDPE, and mixed plastic recyclables.', 35, 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9'),
('E-Waste', 'Electronic waste including components and boards.', 180, 'https://images.unsplash.com/photo-1581092160607-ee22731f9c46'),
('Computer Scrap', 'CPUs, monitors, keyboards, and accessories.', 140, 'https://images.unsplash.com/photo-1518770660439-4636190af475'),
('Mobile Scrap', 'Damaged phones, batteries, and chargers.', 165, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'),
('Paper Scrap', 'Newspaper, books, cardboard, and paper bundles.', 18, 'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9')
ON DUPLICATE KEY UPDATE name=VALUES(name);
