-- Add maintenance_rate_per_sqft column to mmz_settings
ALTER TABLE mmz_settings
ADD COLUMN IF NOT EXISTS maintenance_rate_per_sqft DECIMAL(10,2) DEFAULT 3.68;
