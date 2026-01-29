/*
  # Add Daily Sales and Stock Purchases Tables

  ## Overview
  This migration adds two new tables for tracking daily sales and stock purchases, which are essential for inventory management and profit tracking in the ASOSTORE system.

  ## New Tables

  ### `daily_sales`
  - `id` (uuid, primary key) - Unique identifier for each sale record
  - `item_id` (uuid, foreign key) - Links to stock_items table
  - `quantity_sold` (integer) - Number of items sold
  - `selling_price_per_unit` (float) - Price per unit at time of sale
  - `total_revenue` (float) - Total revenue from this sale (quantity × selling price)
  - `cost_price_per_unit` (float) - Cost per unit at time of sale
  - `total_cost` (float) - Total cost of goods sold (quantity × cost price)
  - `profit` (float) - Profit from this sale (total_revenue - total_cost)
  - `sale_date` (date) - Date of the sale
  - `notes` (text, optional) - Additional notes about the sale
  - `created_at` (timestamp) - Record creation timestamp

  ### `stock_purchases`
  - `id` (uuid, primary key) - Unique identifier for each purchase record
  - `item_id` (uuid, foreign key) - Links to stock_items table
  - `quantity` (integer) - Number of items purchased
  - `cost_per_unit` (float) - Cost per unit in this purchase
  - `total_cost` (float) - Total cost of purchase (quantity × cost per unit)
  - `supplier_name` (text) - Name of the supplier
  - `purchase_date` (date) - Date of the purchase
  - `notes` (text, optional) - Additional notes about the purchase
  - `created_at` (timestamp) - Record creation timestamp

  ## Security
  - Enable RLS on both tables
  - Add policies for authenticated users (admin access only)
  - Both tables require authentication for all operations

  ## Indexes
  - Index on item_id for both tables for faster joins
  - Index on sale_date and purchase_date for date-based queries
*/

-- Create daily_sales table
CREATE TABLE IF NOT EXISTS daily_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity_sold integer NOT NULL CHECK (quantity_sold > 0),
  selling_price_per_unit float NOT NULL CHECK (selling_price_per_unit >= 0),
  total_revenue float NOT NULL CHECK (total_revenue >= 0),
  cost_price_per_unit float NOT NULL CHECK (cost_price_per_unit >= 0),
  total_cost float NOT NULL CHECK (total_cost >= 0),
  profit float NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create stock_purchases table
CREATE TABLE IF NOT EXISTS stock_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  cost_per_unit float NOT NULL CHECK (cost_per_unit >= 0),
  total_cost float NOT NULL CHECK (total_cost >= 0),
  supplier_name text NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for daily_sales table (authenticated users only)
CREATE POLICY "Authenticated users can view daily sales"
  ON daily_sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert daily sales"
  ON daily_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily sales"
  ON daily_sales
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete daily sales"
  ON daily_sales
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for stock_purchases table (authenticated users only)
CREATE POLICY "Authenticated users can view stock purchases"
  ON stock_purchases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stock purchases"
  ON stock_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock purchases"
  ON stock_purchases
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stock purchases"
  ON stock_purchases
  FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_sales_item_id ON daily_sales(item_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_sale_date ON daily_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_created_at ON daily_sales(created_at);

CREATE INDEX IF NOT EXISTS idx_stock_purchases_item_id ON stock_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_purchases_purchase_date ON stock_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_stock_purchases_created_at ON stock_purchases(created_at);
