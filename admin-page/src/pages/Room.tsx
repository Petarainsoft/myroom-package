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
  Switch,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import roomService, { RoomResource, CreateRoomResourceRequest, UpdateRoomResourceRequest, RoomResourceStats } from '../services/room.service';
import GLBViewer, { GLBViewerUrl } from '../components/GLBViewer';
// import GLBViewer from '../components/GLBViewer';

const Room: React.FC = () => {
  // Room Resources state
  const [resources, setResources] = useState<RoomResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterRoomType, setFilterRoomType] = useState<string>('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<RoomResource | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resourceName, setResourceName] = useState('');
  const [resourceRoomType, setResourceRoomType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [resourceIsPremium, setResourceIsPremium] = useState(false);
  const [resourceEditing, setResourceEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resourceTags, setResourceTags] = useState<string>('');
  const [resourceKeywords, setResourceKeywords] = useState<string>('');
  const [resourceVersion, setResourceVersion] = useState('1.0');
  const [resourceDescription, setResourceDescription] = useState('');
  const [stats, setStats] = useState<RoomResourceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Common state
  const [error, setError] = useState<string | null>(null);

  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string; label: string; resource_path: string }[]>([]);
  const roomTypeOptions = roomTypes.map(type => ({ value: type.id, label: type.label }));
  const maxFileSize = 100 * 1024 * 1024; // 100MB
  const [roomTypeDialogOpen, setRoomTypeDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<{ id: string; name: string; label: string; resource_path: string } | null>(null);
  const [newRoomTypeName, setNewRoomTypeName] = useState('');
  const [newRoomTypeLabel, setNewRoomTypeLabel] = useState('');
  const [newRoomTypeResourcePath, setNewRoomTypeResourcePath] = useState('');

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const types = await roomService.getRoomTypes();
        setRoomTypes(types);
        // Set default room type to the first one in the list if available
        if (types.length > 0) {
          setResourceRoomType(types[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch room types:', err);
        setError('Failed to load room types');
      }
    };
    fetchRoomTypes();
  }, []);

  const handleOpenRoomTypeDialog = (type?: { id: string; name: string; label: string; resource_path: string }) => {
    setEditingRoomType(type || null);
    setNewRoomTypeName(type ? type.name : '');
    setNewRoomTypeLabel(type ? type.label : '');
    setNewRoomTypeResourcePath(type ? type.resource_path : '');
    setRoomTypeDialogOpen(true);
  };

  const handleSaveRoomType = async () => {
    try {
      if (editingRoomType) {
        await roomService.updateRoomType(editingRoomType.id, { 
          name: newRoomTypeName, 
          label: newRoomTypeLabel,
          resource_path: newRoomTypeResourcePath 
        });
      } else {
        await roomService.createRoomType({ 
          name: newRoomTypeName, 
          label: newRoomTypeLabel,
          resource_path: newRoomTypeResourcePath 
        });
      }
      const types = await roomService.getRoomTypes();
      setRoomTypes(types);
      setRoomTypeDialogOpen(false);
    } catch (err) {
      console.error('Failed to save room type:', err);
      
      // Xử lý lỗi cụ thể từ API
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save room type');
      }
    }
  };

  const handleDeleteRoomType = async (id: string) => {
    if (!confirm('Delete this room type?')) return;
    try {
      await roomService.deleteRoomType(id);
      const types = await roomService.getRoomTypes();
      setRoomTypes(types);
    } catch (err) {
      console.error('Failed to delete room type:', err);
      setError('Failed to delete room type');
    }
  };

  // Room Resources functions
  const fetchResources = async () => {
    setResourcesLoading(true);
    try {
      const result = await roomService.getRoomResources({
        page: page + 1,
        limit: rowsPerPage,
        roomTypeId: filterRoomType || undefined,
      });
      setResources(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch room resources:', err);
      setError('Failed to load room resources');
    } finally {
      setResourcesLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const statsData = await roomService.getRoomResourceStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch room stats:', err);
      setError('Failed to load room statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${maxFileSize / 1024 / 1024}MB`;
    }
    const allowedExtensions = ['.glb'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return 'Only GLB files are supported for room items';
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
    const nameWithoutExtension = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
    setResourceName(nameWithoutExtension);
    setLocalPreviewUrl(URL.createObjectURL(selectedFile));
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
    if (!confirm('Delete this room item?')) return;
    
    try {
      await roomService.deleteRoomResource(id);
      fetchResources();
    } catch (err) {
      console.error('Failed to delete room resource:', err);
      setError('Failed to delete room item');
    }
  };

  const handleResourceEdit = (resource: RoomResource) => {
    setSelectedResource(resource);
    setResourceName(resource.name);
    setResourceDescription(resource.description || '');
    setResourceRoomType(resource.roomTypeId);
    setResourceIsPremium(resource.isPremium);
    setResourceTags(resource.tags.join(', '));
    setResourceKeywords(resource.keywords.join(', '));
    setResourceVersion(resource.version);
    setEditOpen(true);
  };

  const handleResourcePreview = async (resource: RoomResource) => {
    try {
      setSelectedResource(resource);
      if (!resource.s3Url) {
        throw new Error('No preview URL available for this resource');
      }
      console.log('Preview URL:', resource.s3Url);
      setPreviewUrl(resource.s3Url);
      setPreviewOpen(true);
    } catch (err) {
      console.error('Failed to get preview URL:', err);
      setError('Failed to load preview: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleResourceUpdate = async () => {
    if (!selectedResource) return;
    
    try {
      setResourceEditing(true);
      const updateData: UpdateRoomResourceRequest = {
        name: resourceName,
        description: resourceDescription || undefined,
        roomTypeId: resourceRoomType,
        isPremium: resourceIsPremium,
        tags: resourceTags.split(',').map(t => t.trim()).filter(t => t),
        keywords: resourceKeywords.split(',').map(k => k.trim()).filter(k => k),
        version: resourceVersion
      };
      await roomService.updateRoomResource(selectedResource.id, updateData);
      setEditOpen(false);
      fetchResources();
    } catch (err) {
      console.error('Failed to update room resource:', err);
      setError('Failed to update room item');
    } finally {
      setResourceEditing(false);
    }
  };

  const handleResourceUpload = async () => {
    if (!file) return;
    
    // Validate required fields
    if (!resourceRoomType) {
      setError('Please select a room type');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const createData: CreateRoomResourceRequest = {
        name: resourceName || file.name.substring(0, file.name.lastIndexOf('.')),
        description: resourceDescription || undefined,
        roomTypeId: resourceRoomType,
        isPremium: resourceIsPremium,
        isFree: !resourceIsPremium, // Ensure isFree is set correctly based on isPremium
        tags: resourceTags ? resourceTags.split(',').map(t => t.trim()).filter(t => t) : [],
        keywords: resourceKeywords ? resourceKeywords.split(',').map(k => k.trim()).filter(k => k) : [],
        version: resourceVersion || '1.0.0'
      };
      
      await roomService.createRoomResource(createData, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadOpen(false);
        setFile(null);
        setResourceName('');
        setResourceDescription('');
        setUploadProgress(0);
        setResourceIsPremium(false);
        setResourceTags('');
        setResourceKeywords('');
        setResourceVersion('1.0');
        setLocalPreviewUrl(null);
        fetchResources();
      }, 500);
    } catch (err) {
      console.error('Failed to upload room resource:', err);
      
      // Enhanced error logging
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        
        // Set more specific error message based on response
        if (err.response.data && err.response.data.message) {
          setError(`Upload failed: ${err.response.data.message}`);
        } else if (err.response.data && err.response.data.error) {
          setError(`Upload failed: ${err.response.data.error}`);
          
          // Display validation errors if available
          if (err.response.data.details && Array.isArray(err.response.data.details)) {
            const validationErrors = err.response.data.details.map((detail: any) => 
              `${detail.path}: ${detail.message}`
            ).join(', ');
            setError(`Validation errors: ${validationErrors}`);
          }
        } else {
          setError(`Upload failed with status ${err.response.status}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        setError('Upload failed: No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', err.message);
        setError(`Upload failed: ${err.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: string) => {
    const numBytes = parseInt(bytes);
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (numBytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(numBytes) / Math.log(1024));
    return Math.round(numBytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      Furniture: 'primary',
      Decoration: 'secondary',
      Lighting: 'warning',
      Electronics: 'info',
      Plants: 'success',
      Artwork: 'error',
      Textiles: 'default',
      Storage: 'primary',
      Appliances: 'info',
      Other: 'default',
    };
    return colors[category] || 'default';
  };

  const getRoomTypeColor = (roomType: string) => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      LIVING_ROOM: 'primary',
      BEDROOM: 'secondary',
      KITCHEN: 'warning',
      BATHROOM: 'info',
      OFFICE: 'success',
      OUTDOOR: 'error',
      OTHER: 'default',
    };
    return colors[roomType] || 'default';
  };

  const getRoomTypeLabel = (roomType: string) => {
    const option = roomTypeOptions.find(opt => opt.value === roomType);
    return option ? option.label : roomType;
  };

  // Effects
  useEffect(() => {
    fetchResources();
  }, [page, rowsPerPage, filterCategory, filterRoomType]);

  return (
    <Container maxWidth={false} sx={{ maxWidth: '2304px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Room Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Room Types Management */}
      <Paper sx={{ width: '100%', mb: 2, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Room Types</Typography>
          <Button variant="contained" onClick={() => handleOpenRoomTypeDialog()}>Add Room Type</Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Label</TableCell>
              <TableCell>Resource Path</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roomTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.name}</TableCell>
                <TableCell>{type.label}</TableCell>
                <TableCell>{type.resource_path}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenRoomTypeDialog(type)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDeleteRoomType(type.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Paper sx={{ width: '100%', mb: 2, p: 3 }}>
        {/* Header Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Room 3D Models</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<StatsIcon />}
              onClick={() => {
                setStatsOpen(true);
                fetchStats();
              }}
            >
              Statistics
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Room Item
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Room Type</InputLabel>
            <Select
              value={filterRoomType}
              label="Filter by Room Type"
              onChange={(e) => {
                setFilterRoomType(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Room Types</MenuItem>
              {roomTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {filterRoomType && (
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => {
                setFilterRoomType('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>


        {/* Resources Table */}
        {resourcesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Resource ID</TableCell>
                  <TableCell>Room Type</TableCell>
                  <TableCell>Access</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {resource.name}
                        </Typography>
                        {resource.description && (
                          <Typography variant="caption" color="text.secondary">
                            {resource.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {resource.resourceId || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={roomTypes.find(type => type.id === resource.roomTypeId)?.label || 'Unknown'} 
                        color={getRoomTypeColor(roomTypes.find(type => type.id === resource.roomTypeId)?.name || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={resource.isPremium ? 'Premium' : 'Free'} 
                        color={resource.isPremium ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(resource.fileSize)}</TableCell>
                    <TableCell>{resource.version}</TableCell>
                    <TableCell>{new Date(resource.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="Preview">
                        <IconButton onClick={() => handleResourcePreview(resource)} size="small">
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleResourceEdit(resource)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton 
                          onClick={async () => {
                            try {
                              const downloadInfo = await roomService.downloadRoomResource(resource.id);
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
                          size="small"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleResourceDelete(resource.id)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {resources.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No room items found. Upload your first room item to get started.
                </Typography>
              </Box>
            )}

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload New Room Item</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: dragOver ? 'action.hover' : 'background.paper',
                mb: 2,
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".glb"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    handleFileSelect(selectedFile);
                  }
                }}
              />
              <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1">
                Drop 3D model file here or click to select
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported format: GLB only | Maximum size: {maxFileSize / 1024 / 1024}MB
              </Typography>
              {file && (
                <>
                  <Typography variant="body2" sx={{ mt: 1, color: 'primary.main' }}>
                    Selected: {file.name}
                  </Typography>
                  {localPreviewUrl && file && (
                    <Box 
                      sx={{ mt: 2, height: 400 }}
                      onClick={(e) => {
                        // Ngăn chặn sự kiện click lan truyền lên parent (drop zone)
                        e.stopPropagation();
                      }}
                    >
                      <GLBViewerUrl url={localPreviewUrl} />
                    </Box>
                  )}
                </>
              )}
            </Box>

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Uploading...
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            <TextField
              fullWidth
              label="Room Item Name"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              margin="normal"
              placeholder="Enter room item name"
            />

            <TextField
              fullWidth
              label="Description"
              value={resourceDescription}
              onChange={(e) => setResourceDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              placeholder="Enter item description"
            />

            <FormControl fullWidth>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={resourceRoomType}
                    label="Room Type"
                    onChange={(e) => setResourceRoomType(e.target.value)}
                  >
                    {roomTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

            <TextField
              fullWidth
              label="Version"
              value={resourceVersion}
              onChange={(e) => setResourceVersion(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={resourceTags}
              onChange={(e) => setResourceTags(e.target.value)}
              margin="normal"
              placeholder="modern, wooden, comfortable"
            />

            <TextField
              fullWidth
              label="Keywords (comma separated)"
              value={resourceKeywords}
              onChange={(e) => setResourceKeywords(e.target.value)}
              margin="normal"
              placeholder="chair, furniture, seating"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={resourceIsPremium}
                  onChange={(e) => setResourceIsPremium(e.target.checked)}
                />
              }
              label="Premium Room Item"
              sx={{ mt: 2 }}
            />
    
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadOpen(false);
            setFile(null);
            setResourceName('');
            setResourceDescription('');
            setLocalPreviewUrl(null);
            setResourceIsPremium(false);
            setResourceTags('');
            setResourceKeywords('');
            setResourceVersion('1.0');
          }}>Cancel</Button>
          <Button
            onClick={handleResourceUpload}
            variant="contained"
            disabled={!file || uploading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Room Item</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Room Item Name"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Description"
            value={resourceDescription}
            onChange={(e) => setResourceDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />

          <FormControl fullWidth>
            <Box>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={resourceRoomType}
                  label="Room Type"
                  onChange={(e) => setResourceRoomType(e.target.value)}
                >
                  {roomTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              {/* </FormControl> */}
            </Box>

            <TextField
              fullWidth
              label="Version"
              value={resourceVersion}
              onChange={(e) => setResourceVersion(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={resourceTags}
              onChange={(e) => setResourceTags(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Keywords (comma separated)"
              value={resourceKeywords}
              onChange={(e) => setResourceKeywords(e.target.value)}
              margin="normal"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={resourceIsPremium}
                  onChange={(e) => setResourceIsPremium(e.target.checked)}
                />
              }
              label="Premium Room Item"
              sx={{ mt: 2 }}
            />
          </FormControl>
        </DialogContent>
    
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResourceUpdate}
            variant="contained"
            disabled={resourceEditing}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={statsOpen} onClose={() => setStatsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Room Resources Statistics</DialogTitle>
        <DialogContent>
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Resources: {stats.totalResources}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Premium Resources: {stats.premiumResources}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Free Resources: {stats.freeResources}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Usage: {stats.totalUsage}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      By Category
                    </Typography>
                    {Object.entries(stats.totalByCategory).map(([category, count]) => (
                      <Typography key={category} variant="body2" color="text.secondary">
                        {category}: {count}
                      </Typography>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      By Room Type
                    </Typography>
                    {Object.entries(stats.totalByRoomType).map(([roomType, count]) => (
                      <Typography key={roomType} variant="body2" color="text.secondary">
                        {getRoomTypeLabel(roomType)}: {count}
                      </Typography>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      By Status
                    </Typography>
                    {Object.entries(stats.totalByStatus).map(([status, count]) => (
                      <Typography key={status} variant="body2" color="text.secondary">
                        {status}: {count}
                      </Typography>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography>No statistics available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => {
        setPreviewOpen(false);
        setPreviewUrl(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>Preview</DialogTitle>
        <DialogContent>
          {previewUrl ? (
            <Box sx={{ height: 600 }}>
              <GLBViewerUrl url={previewUrl} />
            </Box>
          ) : (
            <Typography>Cannot preview this file type</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPreviewOpen(false);
            setPreviewUrl(null);
          }}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={roomTypeDialogOpen} onClose={() => setRoomTypeDialogOpen(false)}>
        <DialogTitle>{editingRoomType ? 'Edit Room Type' : 'Add Room Type'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={newRoomTypeName} onChange={(e) => setNewRoomTypeName(e.target.value)} fullWidth margin="normal" />
          <TextField label="Label" value={newRoomTypeLabel} onChange={(e) => setNewRoomTypeLabel(e.target.value)} fullWidth margin="normal" />
          <TextField label="Resource Path" value={newRoomTypeResourcePath} onChange={(e) => setNewRoomTypeResourcePath(e.target.value)} fullWidth margin="normal" helperText="Unique path to identify this room type's resources" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomTypeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRoomType}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Room;