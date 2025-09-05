-- FIX AFFILIATE NUMBER SORTING IN DATABASE
-- This converts affiliate numbers to proper integers for correct sorting
-- SAFE: Only affects sorting, doesn't change any data

-- First, let's see what we're working with
SELECT affiliate_num, COUNT(*) 
FROM affiliates 
WHERE affiliate_num IS NOT NULL 
GROUP BY affiliate_num 
ORDER BY CAST(affiliate_num AS INTEGER) 
LIMIT 10;

-- Add a new integer column for proper sorting (SAFE - doesn't affect existing data)
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS affiliate_num_int INTEGER;

-- Update the integer column with converted values (SAFE - only adds data)
UPDATE affiliates 
SET affiliate_num_int = CASE 
    WHEN affiliate_num ~ '^[0-9]+$' THEN CAST(affiliate_num AS INTEGER)
    ELSE NULL 
END
WHERE affiliate_num IS NOT NULL;

-- Add index for fast sorting (SAFE - only improves performance)
CREATE INDEX IF NOT EXISTS idx_affiliates_num_int ON affiliates(affiliate_num_int);

-- Verify the fix worked
SELECT affiliate_num, affiliate_num_int 
FROM affiliates 
WHERE affiliate_num IS NOT NULL 
ORDER BY affiliate_num_int 
LIMIT 10;
