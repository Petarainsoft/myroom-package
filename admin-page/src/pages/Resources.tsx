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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { ResourceService, Resource } from '../services/resource.service';
import { CategoryService, Category } from '../services/category.service';
import GLBViewer, { GLBViewerUrl } from '../components/GLBViewer';

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filter state
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('model');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resourceTypes = ['model', 'texture', 'animation', 'scene', 'audio', 'video', 'document', 'other'];
  const maxFileSize = 100 * 1024 * 1024; // 100MB

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
    
    setLoading(true);
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
      .finally(() => setLoading(false));
  };

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
          firstFewCategories: (data || []).slice(0, 5).map(c => ({
            id: c.id,
            name: c.name,
            isPremium: c.isPremium
          }))
        });
        
        // Ensure data is an array (should be guaranteed by service now)
        if (Array.isArray(data)) {
          setCategories(data);
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
    setName(selectedFile.name);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    
    try {
      await ResourceService.deleteResource(id);
      fetchResources();
    } catch (err) {
      console.error('Failed to delete resource:', err);
      setError('Failed to delete resource');
    }
  };

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setName(resource.name);
    setType(resource.fileType);
    setCategoryId(resource.categoryId);
    setIsPremium(resource.isPremium);
    setEditOpen(true);
  };

  const handlePreview = async (resource: Resource) => {
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

  const handleUpdate = async () => {
    if (!selectedResource) return;
    
    try {
      setEditing(true);
      await ResourceService.updateResource(selectedResource.id, {
        name,
        fileType: type,
        categoryId,
        isPremium
      });
      setEditOpen(false);
      fetchResources();
    } catch (err) {
      console.error('Failed to update resource:', err);
      setError('Failed to update resource');
    } finally {
      setEditing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      await ResourceService.uploadResource(file, name || file.name, type, categoryId, isPremium);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadOpen(false);
        setFile(null);
        setName('');
        setCategoryId(undefined);
        setUploadProgress(0);
        setIsPremium(false);
        fetchResources();
      }, 500);
    } catch (err) {
      console.error('Failed to upload resource:', err);
      setError('Failed to upload resource');
    } finally {
      setUploading(false);
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

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">
            Resources
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
              {categories.map((c) => (
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
              title="Clear filter"
            >
              <ClearIcon />
            </IconButton>
          )}
          
          <Button 
            variant="contained" 
            startIcon={<UploadIcon />} 
            onClick={() => setUploadOpen(true)}
          >
            Upload Resource
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Free</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((r) => (
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
                        onClick={() => handlePreview(r)}
                      >
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(r)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton 
                        size="small" 
                        onClick={() => window.open(r.s3Url, '_blank')}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(r.id)}
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

      {/* Enhanced Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Resource</DialogTitle>
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
                {file ? file.name : 'Drop file here or click to browse'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum file size: {maxFileSize / 1024 / 1024}MB
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
            label="Resource Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter resource name"
          />
          
          <TextField
            label="Type"
            select
            fullWidth
            margin="normal"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {resourceTypes.map((t) => (
              <MenuItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Category (Optional)"
            select
            fullWidth
            margin="normal"
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value || undefined)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} {c.isPremium && '(Premium)'}
              </MenuItem>
            ))}
          </TextField>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                color="warning"
              />
            }
            label="Premium Resource"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpload} 
            disabled={!file || uploading || !name.trim()}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Resource</DialogTitle>
        <DialogContent>
          <TextField
            label="Resource Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter resource name"
          />
          
          <TextField
            label="Type"
            select
            fullWidth
            margin="normal"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {resourceTypes.map((t) => (
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
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value || undefined)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} {c.isPremium && '(Premium)'}
              </MenuItem>
            ))}
          </TextField>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                color="warning"
              />
            }
            label="Premium Resource"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editing}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdate} 
            disabled={editing || !name.trim()}
          >
            {editing ? 'Updating...' : 'Update'}
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
                Preview not available for this file type
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

export default Resources;