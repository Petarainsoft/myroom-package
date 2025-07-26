-- Rollback script for Customer to Developer migration
-- This script reverts the database back to Customer-based system
-- WARNING: This will lose any data created after migration

-- Step 1: Rename developers table back to customers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'developers') THEN
        -- Drop foreign key constraints first
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_developer;
        ALTER TABLE avatar_usage DROP CONSTRAINT IF EXISTS fk_avatar_usage_developer;
        ALTER TABLE room_usage DROP CONSTRAINT IF EXISTS fk_room_usage_developer;
        
        -- Rename table
        ALTER TABLE developers RENAME TO customers;
        
        -- Rename column if it was changed
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'developer_id') THEN
            ALTER TABLE customers RENAME COLUMN developer_id TO customer_id;
        END IF;
        
        RAISE NOTICE 'Renamed developers table back to customers';
    END IF;
END $$;

-- Step 2: Update projects table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'developer_id') THEN
            -- Rename column
            ALTER TABLE projects RENAME COLUMN developer_id TO customer_id;
            
            -- Add foreign key constraint back
            ALTER TABLE projects ADD CONSTRAINT fk_projects_customer 
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Reverted projects table: developer_id -> customer_id';
        END IF;
    END IF;
END $$;

-- Step 3: Update avatar_usage table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatar_usage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_usage' AND column_name = 'developer_id') THEN
            -- Rename column
            ALTER TABLE avatar_usage RENAME COLUMN developer_id TO customer_id;
            
            -- Add foreign key constraint back
            ALTER TABLE avatar_usage ADD CONSTRAINT fk_avatar_usage_customer 
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Reverted avatar_usage table: developer_id -> customer_id';
        END IF;
    END IF;
END $$;

-- Step 4: Update developer_avatar_permissions table back to customer_avatar_permissions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'developer_avatar_permissions') THEN
        -- Drop constraints
        ALTER TABLE developer_avatar_permissions DROP CONSTRAINT IF EXISTS fk_developer_avatar_permissions_developer;
        ALTER TABLE developer_avatar_permissions DROP CONSTRAINT IF EXISTS uk_developer_avatar_permissions;
        
        -- Rename column
        ALTER TABLE developer_avatar_permissions RENAME COLUMN developer_id TO customer_id;
        
        -- Rename table
        ALTER TABLE developer_avatar_permissions RENAME TO customer_avatar_permissions;
        
        -- Add constraints back
        ALTER TABLE customer_avatar_permissions ADD CONSTRAINT fk_customer_avatar_permissions_customer 
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        
        ALTER TABLE customer_avatar_permissions ADD CONSTRAINT uk_customer_avatar_permissions 
            UNIQUE (customer_id, avatar_resource_id);
        
        RAISE NOTICE 'Reverted developer_avatar_permissions -> customer_avatar_permissions';
    END IF;
END $$;

-- Step 5: Update room_usage table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_usage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'room_usage' AND column_name = 'developer_id') THEN
            -- Rename column
            ALTER TABLE room_usage RENAME COLUMN developer_id TO customer_id;
            
            -- Add foreign key constraint back
            ALTER TABLE room_usage ADD CONSTRAINT fk_room_usage_customer 
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Reverted room_usage table: developer_id -> customer_id';
        END IF;
    END IF;
END $$;

-- Step 6: Update developer_room_permissions table back to customer_room_permissions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'developer_room_permissions') THEN
        -- Drop constraints
        ALTER TABLE developer_room_permissions DROP CONSTRAINT IF EXISTS fk_developer_room_permissions_developer;
        ALTER TABLE developer_room_permissions DROP CONSTRAINT IF EXISTS uk_developer_room_permissions;
        
        -- Rename column
        ALTER TABLE developer_room_permissions RENAME COLUMN developer_id TO customer_id;
        
        -- Rename table
        ALTER TABLE developer_room_permissions RENAME TO customer_room_permissions;
        
        -- Add constraints back
        ALTER TABLE customer_room_permissions ADD CONSTRAINT fk_customer_room_permissions_customer 
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        
        ALTER TABLE customer_room_permissions ADD CONSTRAINT uk_customer_room_permissions 
            UNIQUE (customer_id, room_resource_id);
        
        RAISE NOTICE 'Reverted developer_room_permissions -> customer_room_permissions';
    END IF;
END $$;

-- Step 7: Update other tables that might have developer_id
DO $$
BEGIN
    -- Update resource_usage table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_usage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resource_usage' AND column_name = 'developer_id') THEN
            ALTER TABLE resource_usage RENAME COLUMN developer_id TO customer_id;
            RAISE NOTICE 'Reverted resource_usage table: developer_id -> customer_id';
        END IF;
    END IF;
    
    -- Update api_key_usage table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_key_usage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_key_usage' AND column_name = 'developer_id') THEN
            ALTER TABLE api_key_usage RENAME COLUMN developer_id TO customer_id;
            RAISE NOTICE 'Reverted api_key_usage table: developer_id -> customer_id';
        END IF;
    END IF;
END $$;

-- Step 8: Update indexes back to customer-based names
DO $$
BEGIN
    -- Update avatar_usage indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_avatar_usage_developer_id') THEN
        DROP INDEX idx_avatar_usage_developer_id;
        CREATE INDEX idx_avatar_usage_customer_id ON avatar_usage(customer_id);
        RAISE NOTICE 'Reverted avatar_usage indexes';
    END IF;
    
    -- Update room_usage indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_usage_developer_id') THEN
        DROP INDEX idx_room_usage_developer_id;
        CREATE INDEX idx_room_usage_customer_id ON room_usage(customer_id);
        RAISE NOTICE 'Reverted room_usage indexes';
    END IF;
    
    -- Update customer_avatar_permissions indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_developer_avatar_permissions_developer_id') THEN
        DROP INDEX idx_developer_avatar_permissions_developer_id;
        CREATE INDEX idx_customer_avatar_permissions_customer_id ON customer_avatar_permissions(customer_id);
        RAISE NOTICE 'Reverted customer_avatar_permissions indexes';
    END IF;
    
    -- Update customer_room_permissions indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_developer_room_permissions_developer_id') THEN
        DROP INDEX idx_developer_room_permissions_developer_id;
        CREATE INDEX idx_customer_room_permissions_customer_id ON customer_room_permissions(customer_id);
        RAISE NOTICE 'Reverted customer_room_permissions indexes';
    END IF;
END $$;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE '=== ROLLBACK COMPLETED ==='; 
    RAISE NOTICE 'Database has been reverted to Customer-based system';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: You must now:';
    RAISE NOTICE '1. Update your Prisma schema back to Customer model';
    RAISE NOTICE '2. Run: npx prisma generate';
    RAISE NOTICE '3. Update all API code to use Customer instead of Developer';
    RAISE NOTICE '4. Update middleware and authentication logic';
    RAISE NOTICE '5. Update Swagger documentation';
    RAISE NOTICE '6. Restart your application';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: Any data created after migration may be lost!';
END $$;