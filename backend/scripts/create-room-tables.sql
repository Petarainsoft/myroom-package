-- Create Room Management Tables
-- This script creates tables for room resource management system

-- Room Types table
CREATE TABLE IF NOT EXISTS room_types (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Room Resources table
CREATE TABLE IF NOT EXISTS room_resources (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- File information
    s3_url TEXT NOT NULL,
    s3_key TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) DEFAULT 'model/gltf-binary' NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'model/gltf-binary',
    checksum VARCHAR(255),
    
    -- Room specific fields
    room_type_id VARCHAR(30) NOT NULL, -- FK to room_types.id
    
    -- Versioning and identification
    version VARCHAR(20) DEFAULT '1.0.0' NOT NULL,
    unique_path VARCHAR(255) UNIQUE, -- e.g., 'bedroom/modern_bedroom_001'
    resource_id VARCHAR(255), -- Legacy compatibility
    
    -- Pricing and access
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    is_free BOOLEAN DEFAULT TRUE NOT NULL,
    price DECIMAL(10, 2),
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    
    -- Audit fields
    uploaded_by_admin_id VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraints
    CONSTRAINT fk_room_resources_uploaded_by_admin 
        FOREIGN KEY (uploaded_by_admin_id) REFERENCES admins(id),
    CONSTRAINT fk_room_resources_room_type 
        FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

-- Room Usage tracking table
CREATE TABLE IF NOT EXISTS room_usage (
    id VARCHAR(30) PRIMARY KEY,
    room_resource_id VARCHAR(30),
    developer_id VARCHAR(30),
    project_id VARCHAR(30),
    action VARCHAR(50) NOT NULL, -- LOAD, DOWNLOAD, VIEW, CUSTOMIZE, PURCHASE
    user_agent TEXT,
    ip_address VARCHAR(45),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_room_usage_room_resource 
        FOREIGN KEY (room_resource_id) REFERENCES room_resources(id) ON DELETE CASCADE,
    CONSTRAINT fk_room_usage_developer
    FOREIGN KEY (developer_id) REFERENCES developers(id),
    CONSTRAINT fk_room_usage_project 
        FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Developer Room Permissions table (for premium content)
CREATE TABLE IF NOT EXISTS developer_room_permissions (
    id VARCHAR(30) PRIMARY KEY,
    developer_id VARCHAR(30) NOT NULL,
    room_resource_id VARCHAR(30),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_paid BOOLEAN DEFAULT FALSE NOT NULL,
    paid_amount DECIMAL(10, 2),
    granted_by VARCHAR(30),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_developer_room_permissions_developer
    FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE,
    CONSTRAINT fk_developer_room_permissions_room_resource 
        FOREIGN KEY (room_resource_id) REFERENCES room_resources(id) ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT uk_developer_room_permissions
    UNIQUE (developer_id, room_resource_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_resources_room_type_id ON room_resources(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_resources_status ON room_resources(status);
CREATE INDEX IF NOT EXISTS idx_room_resources_is_premium ON room_resources(is_premium);
CREATE INDEX IF NOT EXISTS idx_room_resources_is_free ON room_resources(is_free);
CREATE INDEX IF NOT EXISTS idx_room_resources_created_at ON room_resources(created_at);
CREATE INDEX IF NOT EXISTS idx_room_resources_unique_path ON room_resources(unique_path);

CREATE INDEX IF NOT EXISTS idx_room_usage_room_resource_id ON room_usage(room_resource_id);
CREATE INDEX IF NOT EXISTS idx_room_usage_developer_id ON room_usage(developer_id);
CREATE INDEX IF NOT EXISTS idx_room_usage_project_id ON room_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_room_usage_action ON room_usage(action);
CREATE INDEX IF NOT EXISTS idx_room_usage_created_at ON room_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_developer_room_permissions_developer_id ON developer_room_permissions(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_room_permissions_room_resource_id ON developer_room_permissions(room_resource_id);
CREATE INDEX IF NOT EXISTS idx_developer_room_permissions_granted_at ON developer_room_permissions(granted_at);
CREATE INDEX IF NOT EXISTS idx_developer_room_permissions_expires_at ON developer_room_permissions(expires_at);

-- Add comments for documentation
COMMENT ON TABLE room_resources IS 'Stores room 3D model resources (GLB files) with categorization and metadata';
COMMENT ON TABLE room_usage IS 'Tracks usage of room resources by developers and projects';
COMMENT ON TABLE developer_room_permissions IS 'Manages developer permissions for premium room resources';

COMMENT ON COLUMN room_resources.room_type_id IS 'FK to room_types.id';
COMMENT ON COLUMN room_resources.unique_path IS 'Unique identifier path like bedroom/modern_bedroom_001';
COMMENT ON COLUMN room_resources.resource_id IS 'Legacy compatibility field for frontend integration';