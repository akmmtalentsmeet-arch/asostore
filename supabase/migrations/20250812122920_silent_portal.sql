/*
  # Fix transaction type enum

  1. Changes
    - Update transaction_type enum to use 'expense' instead of 'spend'
    - This aligns with the frontend expectations and fixes transaction errors

  2. Security
    - No changes to existing RLS policies
*/

-- Update the enum type to use 'expense' instead of 'spend'
ALTER TYPE transaction_type RENAME TO transaction_type_old;
CREATE TYPE transaction_type AS ENUM ('deposit', 'expense');

-- Update the transactions table to use the new enum
ALTER TABLE transactions 
  ALTER COLUMN type TYPE transaction_type 
  USING (CASE WHEN type::text = 'spend' THEN 'expense'::transaction_type ELSE type::text::transaction_type END);

-- Drop the old enum type
DROP TYPE transaction_type_old;