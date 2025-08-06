/*
  # ASOSTORE Database Schema

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `admission_no` (text, unique, required)
      - `class_code` (text, required)
      - `balance` (float, default 0)
      - `total_paid` (float, default 0)
      - `total_spent` (float, default 0)
      - `last_payment` (timestamp)
      - `created_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `amount` (float, required)
      - `type` (enum: deposit, expense)
      - `method` (enum: online, bycash, credit)
      - `note` (text, optional)
      - `timestamp` (timestamp, default now)
    
    - `stock_items`
      - `id` (uuid, primary key)
      - `item_name` (text, required)
      - `quantity` (integer, default 0)
      - `cost_price` (float, required)
      - `selling_price` (float, required)
      - `last_updated` (timestamp, default now)
    
    - `purchases`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `item_id` (uuid, foreign key)
      - `quantity` (integer, required)
      - `total_price` (float, required)
      - `timestamp` (timestamp, default now)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users only (admin access)
    - Public access for balance checking
*/

-- Create enum types
CREATE TYPE transaction_type AS ENUM ('deposit', 'expense');
CREATE TYPE payment_method AS ENUM ('online', 'bycash', 'credit');

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admission_no text UNIQUE NOT NULL,
  class_code text NOT NULL,
  balance float DEFAULT 0,
  total_paid float DEFAULT 0,
  total_spent float DEFAULT 0,
  last_payment timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  amount float NOT NULL,
  type transaction_type NOT NULL,
  method payment_method NOT NULL,
  note text,
  timestamp timestamptz DEFAULT now()
);

-- Stock items table
CREATE TABLE IF NOT EXISTS stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  quantity integer DEFAULT 0,
  cost_price float NOT NULL,
  selling_price float NOT NULL,
  last_updated timestamptz DEFAULT now()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  item_id uuid REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  total_price float NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policies for students table (public read for balance check, admin write)
CREATE POLICY "Public can read students for balance check"
  ON students
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for transactions table (admin only)
CREATE POLICY "Authenticated users can manage transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for stock_items table (admin only)
CREATE POLICY "Authenticated users can manage stock items"
  ON stock_items
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for purchases table (admin only)
CREATE POLICY "Authenticated users can manage purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_class_code ON students(class_code);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_purchases_student_id ON purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_purchases_item_id ON purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_purchases_timestamp ON purchases(timestamp);