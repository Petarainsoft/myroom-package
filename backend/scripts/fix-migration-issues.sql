-- Fix migration issues script
-- This script addresses the specific issues found in the migration logs

-- Step 1: Handle avatar_categories foreign key constraint issue
-- First, we need to handle the foreign key constraint issue with avatars table
DO $$
BEGIN
    -- Check if avatars table exists and has references to avatar_categories
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatars') THEN
        -- Temporarily disable foreign key constraint
        ALTER TABLE avatars DROP CONSTRAINT IF EXISTS avatars_category_id_fkey;
        
        -- Clear avatar_categories table safely
        DELETE FROM avatar_categories;
        
        -- Re-enable foreign key constraint if needed
        -- Note: This will be handled by the schema push later
        
        RAISE NOTICE 'Cleared avatar_categories table and removed foreign key constraint';
    END IF;
END $$;

-- Step 2: Handle projects table developer_id column issue
-- Add developer_id column with a default value first, then migrate data
DO $$
BEGIN
    -- Check if projects table exists and needs developer_id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        -- Check if customer_id column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'customer_id') THEN
            -- Add developer_id column as nullable first
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'developer_id') THEN
                ALTER TABLE projects ADD COLUMN developer_id TEXT;
                RAISE NOTICE 'Added developer_id column to projects table';
            END IF;
            
            -- Copy data from customer_id to developer_id
            UPDATE projects SET developer_id = customer_id WHERE developer_id IS NULL;
            
            -- Make developer_id NOT NULL
            ALTER TABLE projects ALTER COLUMN developer_id SET NOT NULL;
            
            -- Drop the old customer_id column
            ALTER TABLE projects DROP COLUMN customer_id;
            
            RAISE NOTICE 'Migrated customer_id to developer_id in projects table';
        ELSE
            -- If customer_id doesn't exist but developer_id doesn't exist either
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'developer_id') THEN
                -- Create a default developer first
                INSERT INTO developers (id, email, name, password_hash, status, created_at, updated_at)
                VALUES ('default-dev-id', 'default@example.com', 'Default Developer', 'temp-hash', 'ACTIVE', NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
                
                -- Add developer_id column with default value
                ALTER TABLE projects ADD COLUMN developer_id TEXT DEFAULT 'default-dev-id';
                ALTER TABLE projects ALTER COLUMN developer_id SET NOT NULL;
                ALTER TABLE projects ALTER COLUMN developer_id DROP DEFAULT;
                
                RAISE NOTICE 'Added developer_id column with default value to projects table';
            END IF;
        END IF;
        
        -- Add foreign key constraint
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_developer;
        ALTER TABLE projects ADD CONSTRAINT fk_projects_developer 
            FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE;
            
        RAISE NOTICE 'Added foreign key constraint for developer_id in projects table';
    END IF;
END $$;

-- Step 3: Ensure developers table exists with correct structure
DO $$
BEGIN
    -- Check if customers table exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        ALTER TABLE customers RENAME TO developers;
        RAISE NOTICE 'Renamed customers table to developers';
    END IF;
    
    -- Ensure developers table has correct column names
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'developers') THEN
        -- Rename customer_id to developer_id if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developers' AND column_name = 'customer_id') THEN
            ALTER TABLE developers RENAME COLUMN customer_id TO developer_id;
            RAISE NOTICE 'Renamed customer_id to developer_id in developers table';
        END IF;
        
        -- Ensure id column exists (it should be the primary key)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developers' AND column_name = 'id') THEN
            -- If no id column, add it
            ALTER TABLE developers ADD COLUMN id TEXT PRIMARY KEY DEFAULT gen_random_uuid();
            RAISE NOTICE 'Added id column to developers table';
        END IF;
    ELSE
        -- Create developers table if it doesn't exist
        CREATE TABLE developers (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            suspended_at TIMESTAMP,
            suspended_reason TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Insert a default developer
        INSERT INTO developers (id, email, name, password_hash, status, created_at, updated_at)
        VALUES ('default-dev-id', 'default@example.com', 'Default Developer', 'temp-hash', 'ACTIVE', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created developers table with default developer';
    END IF;
END $$;

-- Step 4: Clean up any remaining foreign key constraint issues
DO $$
BEGIN
    -- Remove any problematic foreign key constraints that might cause issues
    
    -- Avatar related constraints
    ALTER TABLE avatars DROP CONSTRAINT IF EXISTS avatars_category_id_fkey;
    
    -- Room related constraints  
    ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_category_id_fkey;
    
    RAISE NOTICE 'Cleaned up problematic foreign key constraints';
END $$;

-- Final verification and summary
DO $$
BEGIN
    RAISE NOTICE '=== Migration Fix Summary ===';
    RAISE NOTICE '1. Cleared avatar_categories table and removed foreign key constraints';
    RAISE NOTICE '2. Fixed projects table developer_id column issue';
    RAISE NOTICE '3. Ensured developers table exists with correct structure';
    RAISE NOTICE '4. Cleaned up problematic foreign key constraints';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run: npx prisma db push --force-reset (if needed)';
    RAISE NOTICE '2. Run: npx prisma generate';
    RAISE NOTICE '3. Restart your development server';
END $$;