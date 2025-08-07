/*
  # Create Stock Purchases System

  1. New Tables
    - `stock_purchases`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key to stock_items)
      - `quantity` (integer, quantity purchased)
      - `cost_per_unit` (numeric, cost price per unit)
      - `total_cost` (numeric, total purchase cost)
      - `supplier_name` (text, supplier information)
      - `purchase_date` (date, when items were purchased)
      - `notes` (text, optional notes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `stock_purchases` table
    - Add policy for authenticated users to manage stock purchases

  3. Changes
    - This table will track daily stock purchases from suppliers
    - Will be used to calculate profit margins and track inventory costs
*/

CREATE TABLE IF NOT EXISTS stock_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  cost_per_unit numeric(10,2) NOT NULL CHECK (cost_per_unit >= 0),
  total_cost numeric(10,2) NOT NULL CHECK (total_cost >= 0),
  supplier_name text NOT NULL CHECK (length(TRIM(BOTH FROM supplier_name)) > 0),
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage stock purchases"
  ON stock_purchases
  FOR ALL
  TO authenticated
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_purchases_item_id ON stock_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_purchases_date ON stock_purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_purchases_supplier ON stock_purchases(supplier_name);