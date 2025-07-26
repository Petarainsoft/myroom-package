-- Add hierarchy columns to resource_categories table
ALTER TABLE resource_categories 
ADD COLUMN parent_id VARCHAR,
ADD COLUMN level INTEGER DEFAULT 0,
ADD COLUMN path VARCHAR,
ADD COLUMN sort_order INTEGER DEFAULT 0,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Add foreign key constraint for parent_id
ALTER TABLE resource_categories 
ADD CONSTRAINT fk_resource_categories_parent 
FOREIGN KEY (parent_id) REFERENCES resource_categories(id);

-- Drop the unique constraint on name alone
ALTER TABLE resource_categories DROP CONSTRAINT IF EXISTS resource_categories_name_key;

-- Add unique constraint on name + parent_id combination
ALTER TABLE resource_categories 
ADD CONSTRAINT unique_name_parent UNIQUE (name, parent_id);

-- Update existing categories to have level 0 and generate paths
UPDATE resource_categories 
SET level = 0, path = name, sort_order = 0, is_active = TRUE
WHERE parent_id IS NULL; 