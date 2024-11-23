CREATE TABLE currencies (
    id SERIAL PRIMARY KEY,
    currency_id INTEGER NOT NULL UNIQUE,
    currency_name VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO currencies (currency_id, currency_name)
VALUES
    (1, 'RUB'),
    (2, 'USD'),
    (3, 'EUR');

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, 
    account_number VARCHAR(20) NOT NULL UNIQUE,
    currency_id INTEGER NOT NULL,
    balance NUMERIC(15,2) DEFAULT 0.00,
    CONSTRAINT currency_key FOREIGN KEY (currency_id) REFERENCES currencies(currency_id)
);


INSERT INTO accounts (user_id, account_number, currency_id, balance)
VALUES
    (1, '1000000001', 1, 1500.75),
    (2, '1000000002', 2, 500.00),
    (3, '1000000003', 3, 25000.00),
    (4, '1000000004', 1, 0.00),
    (5, '1000000005', 3, 100.00);


CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

INSERT INTO users (username, password) VALUES 
('admin', '$2b$10$HyEzw4adxl0Q0J7utbKgIOH26GxKKHsPbi4JqMItpjq9o.6gVIwG2');
