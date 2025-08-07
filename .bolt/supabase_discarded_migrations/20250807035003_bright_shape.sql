/*
  # Create Daily Sales Tracking System

  1. New Tables
    - `daily_sales`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key to stock_items)
      - `quantity_sold` (integer)
      - `selling_price_per_unit` (numeric)
      - `total_revenue` (numeric)
      - `cost_price_per_unit` (numeric)
      - `total_cost` (numeric)
      - `profit` (numeric)
      - `sale_date` (date)
      - `notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `daily_sales` table
    - Add policy for authenticated users to manage daily sales

  3. Indexes
    - Add indexes for performance on item_id, sale_date
*/

CREATE TABLE IF NOT EXISTS daily_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity_sold integer NOT NULL CHECK (quantity_sold > 0),
  selling_price_per_unit numeric(10,2) NOT NULL CHECK (selling_price_per_unit >= 0),
  total_revenue numeric(10,2) NOT NULL CHECK (total_revenue >= 0),
  cost_price_per_unit numeric(10,2) NOT NULL CHECK (cost_price_per_unit >= 0),
  total_cost numeric(10,2) NOT NULL CHECK (total_cost >= 0),
  profit numeric(10,2) NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage daily sales"
  ON daily_sales
  FOR ALL
  TO authenticated
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_sales_item_id ON daily_sales(item_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_sales_item_date ON daily_sales(item_id, sale_date DESC);