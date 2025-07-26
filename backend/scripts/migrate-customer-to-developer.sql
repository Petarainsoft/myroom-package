-- Migration script to convert Customer tables to Developer tables
-- This script handles the database migration from Customer-based system to Developer-based system

-- Step 1: Check if customers table exists and rename to developers if needed
DO $$
BEGIN
    -- Check if customers table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        -- Rename customers table to developers
        ALTER TABLE customers RENAME TO developers;
        RAISE NOTICE 'Renamed customers table to developers';
    ELSE
        RAISE NOTICE 'customers table does not exist, skipping rename';
    END IF;
END $$;

-- Step 2: Update column names in developers table (if it was renamed from customers)
DO $$
BEGIN
    -- Check if the table has old customer-related columns and rename them
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developers' AND column_name = 'customer_id') THEN
        ALTER TABLE developers RENAME COLUMN customer_id TO developer_id;
        RAISE NOTICE 'Renamed customer_id to developer_id in developers table';
    END IF;
END $$;

-- Step 3: Update foreign key references in other tables

-- Update projects table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'customer_id') THEN
        -- Drop existing foreign key constraint
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_customer;
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_customer_id_fkey;
        
        -- Rename column
        ALTER TABLE projects RENAME COLUMN customer_id TO developer_id;
        
        -- Add new foreign key constraint
        ALTER TABLE projects ADD CONSTRAINT fk_projects_developer 
            FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated projects table: customer_id -> developer_id';
    END IF;
END $$;

-- Step 4: Update avatar_usage table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatar_usage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_usage' AND column_name = 'customer_id') THEN
            -- Drop existing foreign key constraint
            ALTER TABLE avatar_usage DROP CONSTRAINT IF EXISTS fk_avatar_usage_customer;
            ALTER TABLE avatar_usage DROP CONSTRAINT IF EXISTS avatar_usage_customer_id_fkey;
            
            -- Rename column
            ALTER TABLE avatar_usage RENAME COLUMN customer_id TO developer_id;
            
            -- Add new foreign key constraint
            ALTER TABLE avatar_usage ADD CONSTRAINT fk_avatar_usage_developer 
                FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Updated avatar_usage table: customer_id -> developer_id';
        END IF;
    END IF;
END $$;

-- Step 5: Update customer_avatar_permissions table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_avatar_permissions') THEN
        -- Rename table
        ALTER TABLE customer_avatar_permissions RENAME TO developer_avatar_permissions;
        
        -- Rename column
        ALTER TABLE developer_avatar_permissions RENAME COLUMN customer_id TO developer_id;
        
        -- Drop and recreate foreign key constraints
        ALTER TABLE developer_avatar_permissions DROP CONSTRAINT IF EXISTS fk_customer_avatar_permissions_customer;
        ALTER TABLE developer_avatar_permissions DROP CONSTRAINT IF EXISTS customer_avatar_permissions_customer_id_fkey;
        
        ALTER TABLE developer_avatar_permissions ADD CONSTRAINT fk_developer_avatar_permissions_developer 
            FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE;
        
        -- Update unique constraint name
        ALTER TABLE developer_avatar_permissions DROP CONSTRAINT IF EXISTS uk_customer_avatar_permissions;
        ALTER TABLE developer_avatar_permissions DROP CONSTRAINT IF EXISTS customer_avatar_permissions_customer_id_avatar_resource_id_key;
        ALTER TABLE developer_avatar_permissions ADD CONSTRAINT uk_developer_avatar_permissions 
            UNIQUE (developer_id, avatar_resource_id);
        
        RAISE NOTICE 'Updated customer_avatar_permissions -> developer_avatar_permissions';
    END IF;
END $$;

-- Step 6: Update room_usage table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_usage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'room_usage' AND column_name = 'customer_id') THEN
            -- Drop existing foreign key constraint
            ALTER TABLE room_usage DROP CONSTRAINT IF EXISTS fk_room_usage_customer;
            ALTER TABLE room_usage DROP CONSTRAINT IF EXISTS room_usage_customer_id_fkey;
            
            -- Rename column
            ALTER TABLE room_usage RENAME COLUMN customer_id TO developer_id;
            
            -- Add new foreign key constraint
            ALTER TABLE room_usage ADD CONSTRAINT fk_room_usage_developer 
                FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Updated room_usage table: customer_id -> developer_id';
        END IF;
    END IF;
END $$;

-- Step 7: Update customer_room_permissions table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_room_permissions') THEN
        -- Rename table
        ALTER TABLE customer_room_permissions RENAME TO developer_room_permissions;
        
        -- Rename column
        ALTER TABLE developer_room_permissions RENAME COLUMN customer_id TO developer_id;
        
        -- Drop and recreate foreign key constraints
        ALTER TABLE developer_room_permissions DROP CONSTRAINT IF EXISTS fk_customer_room_permissions_customer;
        ALTER TABLE developer_room_permissions DROP CONSTRAINT IF EXISTS customer_room_permissions_customer_id_fkey;
        
        ALTER TABLE developer_room_permissions ADD CONSTRAINT fk_developer_room_permissions_developer 
            FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE;
        
        -- Update unique constraint name
        ALTER TABLE developer_room_permissions DROP CONSTRAINT IF EXISTS uk_customer_room_permissions;
        ALTER TABLE developer_room_permissions DROP CONSTRAINT IF EXISTS customer_room_permissions_customer_id_room_resource_id_key;
        ALTER TABLE developer_room_permissions ADD CONSTRAINT uk_developer_room_permissions 
            UNIQUE (developer_id, room_resource_id);
        
        RAISE NOTICE 'Updated customer_room_permissions -> developer_room_permissions';
    END IF;
END $$;

-- Step 8: Update any other tables that might reference customer_id

-- Update resource_usage table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_usage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resource_usage' AND column_name = 'customer_id') THEN
            ALTER TABLE resource_usage RENAME COLUMN customer_id TO developer_id;
            RAISE NOTICE 'Updated resource_usage table: customer_id -> developer_id';
        END IF;
    END IF;
END $$;

-- Update api_key_usage table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_key_usage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_key_usage' AND column_name = 'customer_id') THEN
            ALTER TABLE api_key_usage RENAME COLUMN customer_id TO developer_id;
            RAISE NOTICE 'Updated api_key_usage table: customer_id -> developer_id';
        END IF;
    END IF;
END $$;

-- Step 9: Update indexes
DO $$
BEGIN
    -- Drop old indexes and create new ones for avatar_usage
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_avatar_usage_customer_id') THEN
        DROP INDEX idx_avatar_usage_customer_id;
        CREATE INDEX idx_avatar_usage_developer_id ON avatar_usage(developer_id);
        RAISE NOTICE 'Updated avatar_usage indexes';
    END IF;
    
    -- Drop old indexes and create new ones for room_usage
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_usage_customer_id') THEN
        DROP INDEX idx_room_usage_customer_id;
        CREATE INDEX idx_room_usage_developer_id ON room_usage(developer_id);
        RAISE NOTICE 'Updated room_usage indexes';
    END IF;
    
    -- Update developer_avatar_permissions indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customer_avatar_permissions_customer_id') THEN
        DROP INDEX idx_customer_avatar_permissions_customer_id;
        CREATE INDEX idx_developer_avatar_permissions_developer_id ON developer_avatar_permissions(developer_id);
        RAISE NOTICE 'Updated developer_avatar_permissions indexes';
    END IF;
    
    -- Update developer_room_permissions indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customer_room_permissions_customer_id') THEN
        DROP INDEX idx_customer_room_permissions_customer_id;
        CREATE INDEX idx_developer_room_permissions_developer_id ON developer_room_permissions(developer_id);
        RAISE NOTICE 'Updated developer_room_permissions indexes';
    END IF;
END $$;

-- Step 10: Update any enum values if needed
-- (This step is for future use if there are any enums that reference customer)

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Please verify the following:';
    RAISE NOTICE '1. All customer tables have been renamed to developer';
    RAISE NOTICE '2. All customer_id columns have been renamed to developer_id';
    RAISE NOTICE '3. All foreign key constraints have been updated';
    RAISE NOTICE '4. All indexes have been updated';
    RAISE NOTICE '5. Update your Prisma schema and regenerate the client';
END $$;