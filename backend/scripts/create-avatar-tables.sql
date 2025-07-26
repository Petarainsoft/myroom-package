-- Avatar Management Tables
-- Separate from the main resource system for better organization

-- Avatar Categories (Gender and Part Types)
CREATE TABLE avatar_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_type VARCHAR(50) NOT NULL, -- 'gender' or 'part_type'
    parent_id UUID REFERENCES avatar_categories(id),
    level INTEGER DEFAULT 0,
    path VARCHAR(500), -- Full path like 'male/hair' or 'female/accessories'
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_avatar_category_name_parent UNIQUE(name, parent_id),
    CONSTRAINT valid_category_type CHECK (category_type IN ('gender', 'part_type'))
);

-- Avatar Resources (GLB Files)
CREATE TABLE avatar_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- File information
    s3_url TEXT NOT NULL,
    s3_key TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) DEFAULT 'model/gltf-binary',
    mime_type VARCHAR(100) DEFAULT 'model/gltf-binary',
    checksum VARCHAR(64),
    
    -- Avatar specific fields
    gender VARCHAR(20) NOT NULL, -- 'male', 'female', 'unisex'
    part_type VARCHAR(50) NOT NULL, -- 'hair', 'top', 'bottom', 'shoes', 'accessory', 'fullset', 'body'
    category_id UUID NOT NULL REFERENCES avatar_categories(id),
    
    -- Versioning and identification
    version VARCHAR(20) DEFAULT '1.0.0',
    unique_path VARCHAR(500) UNIQUE, -- e.g., 'male/hair/male_hair_001'
    resource_id VARCHAR(100), -- Legacy compatibility with frontend
    
    -- Pricing and access
    is_premium BOOLEAN DEFAULT false,
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10, 2),
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'ACTIVE',
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    
    -- Audit fields
    uploaded_by_admin_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'unisex')),
    CONSTRAINT valid_part_type CHECK (part_type IN ('hair', 'top', 'bottom', 'shoes', 'accessory', 'fullset', 'body')),
    CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))
);



-- Avatar Usage Tracking
CREATE TABLE avatar_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    avatar_resource_id UUID REFERENCES avatar_resources(id) ON DELETE CASCADE,
    developer_id VARCHAR(50),
    project_id VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- 'load', 'customize', 'save', 'export'
    user_agent TEXT,
    ip_address INET,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_usage_action CHECK (action IN ('load', 'customize', 'save', 'export'))
);

-- Developer Avatar Permissions (for premium content)
CREATE TABLE developer_avatar_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id VARCHAR(50) NOT NULL,
    avatar_resource_id UUID REFERENCES avatar_resources(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_paid BOOLEAN DEFAULT false,
    paid_amount DECIMAL(10, 2),
    granted_by VARCHAR(50),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_avatar_categories_parent_id ON avatar_categories(parent_id);
CREATE INDEX idx_avatar_categories_type ON avatar_categories(category_type);
CREATE INDEX idx_avatar_categories_path ON avatar_categories(path);

CREATE INDEX idx_avatar_resources_gender ON avatar_resources(gender);
CREATE INDEX idx_avatar_resources_part_type ON avatar_resources(part_type);
CREATE INDEX idx_avatar_resources_category_id ON avatar_resources(category_id);
CREATE INDEX idx_avatar_resources_status ON avatar_resources(status);
CREATE INDEX idx_avatar_resources_unique_path ON avatar_resources(unique_path);
CREATE INDEX idx_avatar_resources_tags ON avatar_resources USING GIN(tags);
CREATE INDEX idx_avatar_resources_keywords ON avatar_resources USING GIN(keywords);



CREATE INDEX idx_avatar_usage_resource_id ON avatar_usage(avatar_resource_id);

CREATE INDEX idx_avatar_usage_developer_id ON avatar_usage(developer_id);
CREATE INDEX idx_avatar_usage_created_at ON avatar_usage(created_at);

CREATE INDEX idx_developer_avatar_permissions_developer_id ON developer_avatar_permissions(developer_id);
CREATE INDEX idx_developer_avatar_permissions_resource_id ON developer_avatar_permissions(avatar_resource_id);


-- Comments for documentation
COMMENT ON TABLE avatar_categories IS 'Hierarchical categories for avatar parts (gender -> part_type)';
COMMENT ON TABLE avatar_resources IS 'Individual avatar GLB files with metadata';

COMMENT ON TABLE avatar_usage IS 'Tracking usage of avatar resources';
COMMENT ON TABLE developer_avatar_permissions IS 'Premium avatar content access permissions for developers';

COMMENT ON COLUMN avatar_resources.unique_path IS 'Unique identifier derived from file path, e.g., "male/hair/male_hair_001"';
COMMENT ON COLUMN avatar_resources.resource_id IS 'Legacy compatibility field for frontend integration';