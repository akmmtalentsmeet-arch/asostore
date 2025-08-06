/*
  # Update transaction type enum from 'expense' to 'spend'

  1. Changes
    - Update transaction_type enum to use 'spend' instead of 'expense'
    - Update existing data to use new terminology
    - Maintain all existing functionality with new naming

  2. Security
    - Maintain existing RLS policies
    - No changes to permissions or access control
*/

-- Update the enum type to use 'spend' instead of 'expense'
DO $$
BEGIN
  -- First, add the new 'spend' value to the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'spend' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'spend';
  END IF;
END $$;

-- Update existing records from 'expense' to 'spend'
UPDATE transactions 
SET type = 'spend' 
WHERE type = 'expense';

-- Remove the old 'expense' value from the enum
-- Note: PostgreSQL doesn't allow direct removal of enum values
-- So we'll create a new enum and replace it
DO $$
BEGIN
  -- Create new enum type
  CREATE TYPE transaction_type_new AS ENUM ('deposit', 'spend');
  
  -- Update the column to use the new type
  ALTER TABLE transactions 
  ALTER COLUMN type TYPE transaction_type_new 
  USING type::text::transaction_type_new;
  
  -- Drop the old type and rename the new one
  DROP TYPE transaction_type;
  ALTER TYPE transaction_type_new RENAME TO transaction_type;
END $$;