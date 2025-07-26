import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  Switch,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
} from '@mui/icons-material';
import { ResourceService, Resource } from '../services/resource.service';
import { CategoryService, Category, CreateCategoryData, UpdateCategoryData } from '../services/category.service';
import GLBViewer, { GLBViewerUrl } from '../components/GLBViewer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ResourcesAndCategories: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resourceName, setResourceName] = useState('');
  const [resourceType, setResourceType] = useState('model');
  const [resourceCategoryId, setResourceCategoryId] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [resourceIsPremium, setResourceIsPremium] = useState(false);
  const [resourceEditing, setResourceEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [level2Categories, setLevel2Categories] = useState<Category[]>([]);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryIsPremium, setCategoryIsPremium] = useState(false);
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null);
  const [categorySortOrder, setCategorySortOrder] = useState(0);
const [categoryPath, setCategoryPath] = useState('');
  const [categoryView, setCategoryView] = useState<'flat' | 'tree'>('tree');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);

  // Common state
  const [error, setError] = useState<string | null>(null);

  const resourceTypes = ['model', 'texture', 'animation', 'scene', 'audio', 'video', 'document', 'other'];
  const maxFileSize = 100 * 1024 * 1024; // 100MB

  // Resources functions
  const fetchResources = () => {
    console.group('📋 Resources.fetchResources');
    console.log('🔍 Current component state:', {
      page: page + 1,
      rowsPerPage,
      filterCategoryId,
      filterCategoryIdType: typeof filterCategoryId,
      filterCategoryIdEmpty: !filterCategoryId,
      categoriesLoaded: categories.length,
      selectedCategoryName: filterCategoryId ? categories.find(c => c.id === filterCategoryId)?.name : 'None'
    });
    
    setResourcesLoading(true);
    ResourceService.getResources(page + 1, rowsPerPage, '', filterCategoryId || undefined)
      .then((res) => {
        console.log('✅ Resources fetched successfully:', {
          resourcesCount: res.data.length,
          total: res.total,
          page: res.page,
          appliedFilter: filterCategoryId,
          resourcesWithCategories: res.data.slice(0, 5).map(r => ({
            id: r.id,
            name: r.name,
            categoryId: r.categoryId,
            categoryName: r.category?.name
          }))
        });
        setResources(res.data);
        setTotal(res.total);
        console.groupEnd();
      })
      .catch((err) => {
        console.error('❌ Failed to fetch resources:', err);
        setError('Failed to load resources');
        console.groupEnd();
      })
      .finally(() => setResourcesLoading(false));
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${maxFileSize / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFile(selectedFile);
    if (validation) {
      setError(validation);
      return;
    }
    
    setFile(selectedFile);
    setResourceName(selectedFile.name);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleResourceDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    
    try {
      await ResourceService.deleteResource(id);
      fetchResources();
    } catch (err) {
      console.error('Failed to delete resource:', err);
      setError('Failed to delete resource');
    }
  };

  const handleResourceEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceName(resource.name);
    setResourceType(resource.fileType);
    setResourceCategoryId(resource.categoryId);
    setResourceIsPremium(resource.isPremium);
    setEditOpen(true);
  };

  const handleResourcePreview = async (resource: Resource) => {
    try {
      setSelectedResource(resource);
      const previewData = await ResourceService.getPreviewUrl(resource.id);
      setPreviewUrl(previewData.downloadUrl);
      setPreviewOpen(true);
    } catch (err) {
      console.error('Failed to get preview URL:', err);
      setError('Failed to load preview');
    }
  };

  const handleResourceUpdate = async () => {
    if (!selectedResource) return;
    
    try {
      console.group('📝 Resource Update');
      console.log('Current resource state:', {
        id: selectedResource.id,
        name: resourceName,
        fileType: {
          current: resourceType,
          original: selectedResource.fileType
        },
        categoryId: {
          current: resourceCategoryId,
          original: selectedResource.categoryId
        },
        isPremium: {
          current: resourceIsPremium,
          original: selectedResource.isPremium
        },
        uniquePath: {
          current: selectedResource.uniquePath || '',
          original: selectedResource.uniquePath
        }
      });

      setResourceEditing(true);
      
      if (!resourceType) {
        console.warn('⚠️ Missing fileType:', {
          resourceType,
          selectedResource
        });
        throw new Error('File type is required');
      }

      const updateData = {
        name: resourceName,
        fileType: resourceType,
        categoryId: resourceCategoryId,
        isPremium: resourceIsPremium,
        uniquePath: selectedResource.uniquePath || ''
      };

      console.log('Updating with data:', updateData);
      
      await ResourceService.updateResource(selectedResource.id, updateData);
      console.log('✅ Resource updated successfully');
      
      setEditOpen(false);
      fetchResources();
      console.groupEnd();
    } catch (err) {
      console.error('❌ Failed to update resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to update resource');
      console.groupEnd();
    } finally {
      setResourceEditing(false);
    }
  };

  const handleResourceUpload = async () => {
    console.group('📤 Resource Upload');
    console.log('Initial upload state:', {
      file: file?.name,
      fileSize: file?.size,
      resourceName,
      resourceType,
      resourceCategoryId,
      resourceIsPremium
    });

    if (!file) {
      console.warn('❌ No file selected');
      console.groupEnd();
      return;
    }

    if (!resourceCategoryId) {
      console.warn('❌ No category selected');
      setError('Category is required');
      console.groupEnd();
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      console.log('🔄 Starting upload process');
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev >= 90 ? 90 : prev + 10;
          console.log(`📊 Upload progress: ${newProgress}%`);
          if (newProgress >= 90) clearInterval(progressInterval);
          return newProgress;
        });
      }, 200);
      
      console.log('📝 Uploading with params:', {
        fileName: resourceName || file.name,
        fileType: file.type,
        categoryId: resourceCategoryId,
        isPremium: resourceIsPremium
      });

      await ResourceService.uploadResource(
        file, 
        resourceName || file.name, 
        resourceType, 
        resourceCategoryId, 
        resourceIsPremium
      );
      
      console.log('✅ Upload completed successfully');
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        console.log('🧹 Cleaning up upload state');
        setUploadOpen(false);
        setFile(null);
        setResourceName('');
        setResourceCategoryId(undefined);
        setUploadProgress(0);
        setResourceIsPremium(false);
        fetchResources();
      }, 500);

      console.log('✨ Upload process completed');
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError('Failed to upload resource');
    } finally {
      setUploading(false);
      console.groupEnd();
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      model: 'primary',
      texture: 'secondary',
      animation: 'info',
      scene: 'success',
      audio: 'warning',
      video: 'error',
      document: 'default',
      other: 'default',
    };
    return colors[type] || 'default';
  };

  const handleCategoryFilterChange = (newCategoryId: string) => {
    console.group('🔄 Category Filter Change');
    console.log('📝 Filter change details:', {
      from: filterCategoryId,
      to: newCategoryId,
      fromType: typeof filterCategoryId,
      toType: typeof newCategoryId,
      fromEmpty: !filterCategoryId,
      toEmpty: !newCategoryId,
      fromCategoryName: filterCategoryId ? categories.find(c => c.id === filterCategoryId)?.name : 'None',
      toCategoryName: newCategoryId ? categories.find(c => c.id === newCategoryId)?.name : 'None',
      pageBeforeReset: page,
      willResetToPage: 0
    });
    
    setFilterCategoryId(newCategoryId);
    setPage(0); // Reset to first page when filter changes
    
    console.log('✅ State updated, will trigger useEffect');
    console.groupEnd();
  };

  const handleClearFilter = () => {
    console.group('🗑️ Clear Filter');
    console.log('📝 Clearing filter:', {
      currentFilter: filterCategoryId,
      currentFilterName: filterCategoryId ? categories.find(c => c.id === filterCategoryId)?.name : 'None',
      currentPage: page
    });
    
    setFilterCategoryId('');
    setPage(0); // Reset to first page when clearing filter
    
    console.log('✅ Filter cleared, will trigger useEffect');
    console.groupEnd();
  };

  // Categories functions
  const fetchCategories = async () => {
    if (categoryView === 'tree') {
      const treeData = await CategoryService.getCategoryTree();
      setCategories(treeData);
    } else {
      const flatData = await CategoryService.getCategories({ isActive: true });
      setFlatCategories(flatData);
    }
  };

  const fetchFlatCategories = async () => {
    const data = await CategoryService.getCategories({ isActive: true });
    setFlatCategories(data);
  };

  const handleCategorySave = async () => {
    try {
      // Process path - replace spaces with underscores if path exists
      const processedPath = categoryPath ? categoryPath.replace(/\s+/g, '_') : undefined;
      
      if (categoryEditing) {
        // For updates, only send changed fields
        const updateData: UpdateCategoryData = {
          name: categoryName,
          description: categoryDescription || undefined,
          isPremium: categoryIsPremium,
          parentId: categoryParentId,
          sortOrder: categorySortOrder,
          path: processedPath,
          isActive: true
        };
        console.log('Updating category:', categoryEditing.id, 'with data:', updateData);
        await CategoryService.updateCategory(categoryEditing.id, updateData);
        console.log('Category updated successfully');
      } else {
        // For creates, send all required fields
        const createData: CreateCategoryData = {
          name: categoryName,
          description: categoryDescription || undefined,
          isPremium: categoryIsPremium,
          parentId: categoryParentId,
          sortOrder: categorySortOrder,
          path: processedPath,
          isActive: true
        };
        console.log('Creating category with data:', createData);
        await CategoryService.createCategory(createData);
        console.log('Category created successfully');
      }
      
      resetCategoryForm();
      fetchCategories();
      fetchFlatCategories();
      // Also refresh resources to update category filter
      fetchResources();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert('Error saving category: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetCategoryForm = () => {
    setCategoryDialogOpen(false);
    setCategoryEditing(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategoryIsPremium(false);
    setCategoryParentId(null);
    setCategorySortOrder(0);
  };

  const handleCategoryEdit = (cat: Category) => {
    setCategoryEditing(cat);
    setCategoryName(cat.name);
    setCategoryDescription(cat.description || '');
    setCategoryIsPremium(cat.isPremium);
    setCategoryParentId(cat.parentId || null);
    setCategorySortOrder(cat.sortOrder || 0);
    setCategoryDialogOpen(true);
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Delete category? This will also delete all subcategories.')) return;
    await CategoryService.deleteCategory(id);
    fetchCategories();
    fetchFlatCategories();
    // Also refresh resources to update category filter
    fetchResources();
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryRow = (category: Category, level: number = 0): React.ReactNode => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const indent = level * 24;

    return (
      <React.Fragment key={category.id}>
        <TableRow hover>
          <TableCell>
            <Box display="flex" alignItems="center" style={{ paddingLeft: indent }}>
              {hasChildren && (
                <IconButton 
                  size="small" 
                  onClick={() => toggleExpanded(category.id)}
                  sx={{ mr: 1 }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
              {level > 0 && !hasChildren && (
                <SubdirectoryArrowRightIcon 
                  sx={{ mr: 1, color: 'grey.500' }} 
                />
              )}
              <Box>
                <Typography variant="body2" fontWeight={level === 0 ? 'bold' : 'normal'}>
                  {category.name}
                </Typography>
              </Box>
            </Box>
          </TableCell>
          <TableCell>{category.path}</TableCell>
          <TableCell>
            {category.parent ? (
              <Box>
                <Typography variant="body2">
                  {category.parent.name}
                </Typography>
                {category.parent.path && (
                  <Typography variant="caption" color="text.secondary">
                    {category.parent.path}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                Root Category
              </Typography>
            )}
          </TableCell>
          <TableCell>{category.description}</TableCell>
          <TableCell>
            <Chip 
              label={category.isPremium ? 'Premium' : 'Free'} 
              color={category.isPremium ? 'warning' : 'default'}
              size="small"
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2">
              Level {category.level || 0}
            </Typography>
            {category._count && (
              <Typography variant="caption" color="text.secondary">
                {category._count.children} children, {category._count.resources} resources
              </Typography>
            )}
          </TableCell>
          <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
          <TableCell align="right">
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleCategoryEdit(category)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleCategoryDelete(category.id)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && category.children!.map(child => 
          renderCategoryRow(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  // Function to fetch level 2 categories (final level categories)
  const fetchLevel2Categories = async () => {
    try {
      // Get all categories
      const allCategories = await CategoryService.getCategories({ isActive: true });
      
      // Filter to get only level 2 categories
      const level2Cats = allCategories.filter((cat: Category) => cat.level === 2);
      setLevel2Categories(level2Cats);
      console.log('Level 2 categories loaded:', level2Cats.length);
    } catch (err) {
      console.error('Failed to fetch level 2 categories:', err);
      setLevel2Categories([]);
    }
  };

  // Effects
  useEffect(() => {
    console.group('🎯 Filter Effect Triggered');
    console.log('📊 Effect dependencies changed:', {
      page: page + 1,
      rowsPerPage,
      filterCategoryId,
      effectTrigger: 'page, rowsPerPage, or filterCategoryId changed'
    });
    
    fetchResources();
    console.groupEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filterCategoryId]);

  useEffect(() => {
    console.group('📂 Categories Loading');
    console.log('🔄 Starting categories fetch...');
    
    CategoryService.getCategories()
      .then((data) => {
        console.log('✅ Categories loaded:', {
          isArray: Array.isArray(data),
          count: data?.length || 0,
          firstFewCategories: (data || []).slice(0, 5).map((c: Category) => ({
            id: c.id,
            name: c.name,
            isPremium: c.isPremium
          }))
        });
        
        // Ensure data is an array (should be guaranteed by service now)
        if (Array.isArray(data)) {
          setCategories(data);
          // Also fetch level 2 categories
          fetchLevel2Categories();
        } else {
          console.warn('Categories response is not an array:', data);
          setCategories([]);
        }
        console.groupEnd();
      })
      .catch((err) => {
        console.error('❌ Failed to fetch categories:', err);
        setCategories([]); // Ensure categories is always an array
        console.groupEnd();
      });
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchFlatCategories(); // Always fetch flat for parent selection
  }, [categoryView]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth={false} sx={{ maxWidth: '2304px', margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Item Categories & Items Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
          <Tab label="Categories" />
          <Tab label="Items" />
        </Tabs>
      </Box>

      {/* Categories Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            Category Management
          </Typography>
          <Box display="flex" gap={2}>
            <ToggleButtonGroup
              value={categoryView}
              exclusive
              onChange={(_, newView) => newView && setCategoryView(newView)}
              size="small"
            >
              <ToggleButton value="tree">Tree View</ToggleButton>
              <ToggleButton value="flat">Flat View</ToggleButton>
            </ToggleButtonGroup>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setCategoryDialogOpen(true)}
            >
              Add Category
            </Button>
          </Box>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Path</TableCell>
              <TableCell>Parent Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Info</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categoryView === 'tree' 
              ? categories.map((category: Category) => renderCategoryRow(category))
              : flatCategories.map((category: Category) => renderCategoryRow(category, category.level || 0))
            }
            {(categoryView === 'tree' ? categories : flatCategories).length === 0 && (
              <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No categories found. Create your first category to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TabPanel>

      {/* Resources Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5">
              Item Management
            </Typography>
            {filterCategoryId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Filtered by: {categories.find(c => c.id === filterCategoryId)?.name || 'Unknown Category'}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={filterCategoryId}
                label="Filter by Category"
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map((c: Category) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} {c.isPremium && '(Premium)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Clear Filter Button */}
            {filterCategoryId && (
              <IconButton 
                onClick={handleClearFilter}
                size="small"
                title="Clear Filter"
              >
                <ClearIcon />
              </IconButton>
            )}
            
            <Button 
              variant="contained" 
              startIcon={<UploadIcon />} 
              onClick={() => setUploadOpen(true)}
            >
              Upload Item
            </Button>
          </Box>
        </Box>

        {/* Active Filter Indicator */}
        {filterCategoryId && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Showing: ${categories.find(c => c.id === filterCategoryId)?.name || 'Unknown'}`}
              onDelete={handleClearFilter}
              deleteIcon={<ClearIcon />}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        {resourcesLoading ? (
          <CircularProgress />
        ) : (
          <>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Unique Path</TableCell>
                  <TableCell>Access</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                    {resources.map((r: Resource) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachFileIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            {r.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={r.fileType} 
                            color={getTypeColor(r.fileType)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {r.categoryId ? (
                            r.category?.name || categories.find(c => c.id === r.categoryId)?.name || 'Unknown'
                          ) : (
                            <Chip label="Uncategorized" variant="outlined" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={r.resourceId || ''}
                            onChange={(e) => {
                              const newPath = e.target.value;
                              setResources((prev) => prev.map(res => res.id === r.id ? {...res, resourceId: newPath} : res));
                            }}
                            variant="standard"
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={r.isPremium ? 'Premium' : 'Free'} 
                            color={r.isPremium ? 'warning' : 'success'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{formatFileSize(r.fileSize)}</TableCell>
                        <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Preview">
                            <IconButton 
                              size="small" 
                              onClick={() => handleResourcePreview(r)}
                            >
                              <PreviewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleResourceEdit(r)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton 
                              size="small" 
                              onClick={async () => {
                                try {
                                  const downloadInfo = await ResourceService.downloadResource(r.id);
                                  const a = document.createElement('a');
                                  a.href = downloadInfo.downloadUrl;
                                  a.download = downloadInfo.filename;
                                  a.target = '_blank';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                } catch (err) {
                                  setError('Failed to download file');
                                }
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleResourceDelete(r.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </TabPanel>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={resetCategoryForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {categoryEditing ? 'Edit Category' : 'Add New Category'}
          {categoryEditing && categoryEditing.path && (
            <Typography variant="caption" display="block" color="text.secondary">
              Path: {categoryEditing.path}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Category Name"
              fullWidth
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
            <TextField
              label="Path"
              fullWidth
              value={categoryPath}
              onChange={(e) => setCategoryPath(e.target.value)}
              placeholder="Enter unique path for category"
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={categoryParentId || ''}
                label="Parent Category"
                onChange={(e) => setCategoryParentId(e.target.value || null)}
              >
                <MenuItem value="">
                  <em>None (Root Category)</em>
                </MenuItem>
                {flatCategories
                  .filter(cat => !categoryEditing || cat.id !== categoryEditing.id) // Prevent self-selection
                  .map((cat: Category) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {'  '.repeat(cat.level || 0)}{cat.name}
                      {cat.path && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({cat.path})
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Sort Order"
              type="number"
              fullWidth
              value={categorySortOrder}
              onChange={(e) => setCategorySortOrder(parseInt(e.target.value) || 0)}
              helperText="Lower numbers appear first"
            />

            <FormControlLabel
              control={
                <Switch 
                  checked={categoryIsPremium} 
                  onChange={(e) => setCategoryIsPremium(e.target.checked)} 
                />
              }
              label="Premium Category"
            />

            {categoryParentId && (
              <Box sx={{ p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> This category will be created under "
                  {flatCategories.find(c => c.id === categoryParentId)?.name || 'Unknown'}"
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetCategoryForm}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCategorySave} 
            disabled={!categoryName.trim()}
          >
            {categoryEditing ? 'Update' : 'Create'} Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Item</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            {/* Drag & Drop Area */}
            <Paper
              sx={{
                p: 3,
                border: `2px dashed ${dragOver ? 'primary.main' : 'grey.300'}`,
                bgcolor: dragOver ? 'action.hover' : 'background.paper',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {file ? file.name : 'Drop file here or click to select'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum size: {maxFileSize / 1024 / 1024}MB
              </Typography>
              {file && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`${formatFileSize(file.size)} - ${file.type}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}
              {file && file.name.toLowerCase().endsWith('.glb') && (
                <Box sx={{ mt: 2 }}>
                  <GLBViewer file={file} />
                </Box>
              )}
            </Paper>
            
            <input 
              id="file-upload"
              type="file" 
              style={{ display: 'none' }}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
            />
          </Box>

          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          <TextField
            label="Item Name"
            fullWidth
            margin="normal"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="Enter item name"
          />
          
          <TextField
            label="Type"
            select
            fullWidth
            margin="normal"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
          >
            {resourceTypes.map((t: string) => (
              <MenuItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Category *"
            select
            fullWidth
            margin="normal"
            value={resourceCategoryId || ''}
            onChange={(e) => setResourceCategoryId(e.target.value || undefined)}
            required
            error={!resourceCategoryId}
            helperText={!resourceCategoryId ? 'Category is required' : ''}
          >
            {level2Categories.map((c: Category) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} {c.isPremium && '(Premium)'}
              </MenuItem>
            ))}
          </TextField>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={resourceIsPremium}
                onChange={(e) => setResourceIsPremium(e.target.checked)}
                color="warning"
              />
            }
            label="Premium Item"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleResourceUpload} 
            disabled={!file || uploading || !resourceName.trim() || !resourceCategoryId}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <TextField
            label="Item Name"
            fullWidth
            margin="normal"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="Enter item name"
          />
          
          <TextField
            label="Type"
            select
            fullWidth
            margin="normal"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
          >
            {resourceTypes.map((t: string) => (
              <MenuItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Category"
            select
            fullWidth
            margin="normal"
            value={resourceCategoryId || ''}
            onChange={(e) => setResourceCategoryId(e.target.value || undefined)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {categories.map((c: Category) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} {c.isPremium && '(Premium)'}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Unique Path"
            fullWidth
            margin="normal"
            value={selectedResource?.uniquePath || ''}
            onChange={(e) => {
              const newPath = e.target.value;
              setSelectedResource(prev => prev ? {...prev, uniquePath: newPath} : prev);
            }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={resourceIsPremium}
                onChange={(e) => setResourceIsPremium(e.target.checked)}
                color="warning"
              />
            }
            label="Premium Item"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={resourceEditing}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleResourceUpdate} 
            disabled={resourceEditing || !resourceName.trim()}
          >
            {resourceEditing ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Preview: {selectedResource?.name}
        </DialogTitle>
        <DialogContent>
          {previewUrl && selectedResource?.fileType === '.glb' ? (
            <Box sx={{ width: '100%', height: 500 }}>
              <GLBViewerUrl url={previewUrl} />
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Cannot preview this file type
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ResourcesAndCategories;