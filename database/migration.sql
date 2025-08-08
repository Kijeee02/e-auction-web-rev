-- Migration to update database schema for multiple images and invoice fields
-- This will convert existing image_url to image_urls JSON array and add invoice fields

-- Add new image_urls column
ALTER TABLE auctions ADD COLUMN image_urls_temp TEXT;

-- Migrate existing data: convert single image_url to JSON array
UPDATE auctions 
SET image_urls_temp = CASE 
    WHEN image_url IS NOT NULL AND image_url != '' THEN '["' || image_url || '"]'
    ELSE NULL
END;

-- Drop old image_url column
ALTER TABLE auctions DROP COLUMN image_url;

-- Rename new column to image_urls
ALTER TABLE auctions RENAME COLUMN image_urls_temp TO image_urls;

-- Add invoice fields for winner invoice display
ALTER TABLE auctions ADD COLUMN invoice_document TEXT;
ALTER TABLE auctions ADD COLUMN invoice_number TEXT;
