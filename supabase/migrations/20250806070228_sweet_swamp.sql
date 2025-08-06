/*
  # Complete ASOSTORE Database Schema Migration

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text, required) - Full name of the student
      - `admission_no` (text, unique, required) - Unique admission number
      - `class_code` (text, required) - Class identifier (e.g., ND1A, HND2B)
      - `balance` (numeric, default 0) - Current wallet balance
      - `total_paid` (numeric, default 0) - Total amount deposited
      - `total_spent` (numeric, default 0) - Total amount spent
      - `last_payment` (timestamptz) - Last payment timestamp
      - `created_at` (timestamptz, default now) - Account creation date

    - `transactions`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `amount` (numeric, required) - Transaction amount
      - `type` (enum: deposit, spend) - Transaction type
      - `method` (enum: online, bycash, credit) - Payment method
      - `note` (text, optional) - Transaction description
      - `timestamp` (timestamptz, default now) - Transaction timestamp

    - `stock_items`
      - `id` (uuid, primary key)
      - `item_name` (text, required) - Name of the stock item
      - `quantity` (integer, default 0) - Available quantity
      - `cost_price` (numeric, required) - Purchase cost per item
      - `selling_price` (numeric, required) - Selling price per item
      - `last_updated` (timestamptz, default now) - Last update timestamp

    - `purchases`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `item_id` (uuid, foreign key to stock_items)
      - `quantity` (integer, required) - Number of items purchased
      - `total_price` (numeric, required) - Total purchase amount
      - `timestamp` (timestamptz, default now) - Purchase timestamp

  2. Security
    - Enable RLS on all tables
    - Public read access for students table (balance checking)
    - Authenticated access for all admin operations
    - Cascade deletes for referential integrity

  3. Performance
    - Indexes on frequently queried columns
    - Optimized for balance checks and transaction history
*/

-- Create enum types for transaction categorization
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('deposit', 'spend');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('online', 'bycash', 'credit');
  END IF;
END $$;

-- Students table - Core user accounts
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  admission_no text UNIQUE NOT NULL CHECK (length(trim(admission_no)) > 0),
  class_code text NOT NULL CHECK (length(trim(class_code)) > 0),
  balance numeric(10,2) DEFAULT 0 CHECK (balance >= 0),
  total_paid numeric(10,2) DEFAULT 0 CHECK (total_paid >= 0),
  total_spent numeric(10,2) DEFAULT 0 CHECK (total_spent >= 0),
  last_payment timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Transactions table - All financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  type transaction_type NOT NULL,
  method payment_method NOT NULL,
  note text,
  timestamp timestamptz DEFAULT now()
);

-- Stock items table - Inventory management
CREATE TABLE IF NOT EXISTS stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL CHECK (length(trim(item_name)) > 0),
  quantity integer DEFAULT 0 CHECK (quantity >= 0),
  cost_price numeric(10,2) NOT NULL CHECK (cost_price >= 0),
  selling_price numeric(10,2) NOT NULL CHECK (selling_price >= 0),
  last_updated timestamptz DEFAULT now()
);

-- Purchases table - Student purchase history
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  total_price numeric(10,2) NOT NULL CHECK (total_price > 0),
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Security policies for students table
-- Public read access for balance checking (no login required)
CREATE POLICY "Public can read students for balance check"
  ON students
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin can manage all student records
CREATE POLICY "Authenticated users can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (true);

-- Security policies for transactions table (admin only)
CREATE POLICY "Authenticated users can manage transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (true);

-- Security policies for stock_items table (admin only)
CREATE POLICY "Authenticated users can manage stock items"
  ON stock_items
  FOR ALL
  TO authenticated
  USING (true);

-- Security policies for purchases table (admin only)
CREATE POLICY "Authenticated users can manage purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (true);

-- Performance indexes for optimized queries
-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_class_code ON students(class_code);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_balance ON students(balance);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_method ON transactions(method);

-- Stock items table indexes
CREATE INDEX IF NOT EXISTS idx_stock_items_name ON stock_items(item_name);
CREATE INDEX IF NOT EXISTS idx_stock_items_quantity ON stock_items(quantity);

-- Purchases table indexes
CREATE INDEX IF NOT EXISTS idx_purchases_student_id ON purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_purchases_item_id ON purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_purchases_timestamp ON purchases(timestamp DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_student_type ON transactions(student_id, type);
CREATE INDEX IF NOT EXISTS idx_purchases_student_timestamp ON purchases(student_id, timestamp DESC);

-- Comments for documentation
COMMENT ON TABLE students IS 'Student accounts with wallet balances and transaction history';
COMMENT ON TABLE transactions IS 'All financial transactions (deposits and spending)';
COMMENT ON TABLE stock_items IS 'Inventory items available for purchase';
COMMENT ON TABLE purchases IS 'Student purchase records from stock items';

COMMENT ON COLUMN students.balance IS 'Current available balance in student wallet';
COMMENT ON COLUMN students.total_paid IS 'Cumulative amount deposited by student';
COMMENT ON COLUMN students.total_spent IS 'Cumulative amount spent by student';
COMMENT ON COLUMN transactions.type IS 'deposit: money added to wallet, spend: money deducted from wallet';
COMMENT ON COLUMN transactions.method IS 'online: digital payment, bycash: cash payment, credit: purchase on credit';
COMMENT ON COLUMN stock_items.cost_price IS 'Purchase cost per item for profit calculation';
COMMENT ON COLUMN stock_items.selling_price IS 'Price charged to students per item';