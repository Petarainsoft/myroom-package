import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  FormatAlignLeft as FormatIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Preview as PreviewIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ManifestService } from '../services';
import { ManifestDetail as ManifestDetailType } from '../services/manifest.service';

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

const ManifestDetail: React.FC = () => {
  const { manifestId } = useParams<{ manifestId: string }>();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<ManifestDetailType | null>(null);
  const [manifestContent, setManifestContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editedManifest, setEditedManifest] = useState({
    name: '',
    description: '',
    content: '',
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!manifestId) return;
    fetchManifestData();
  }, [manifestId]);

  const fetchManifestData = async () => {
    if (!manifestId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get manifest with content
      const { manifest: manifestData, content } = await ManifestService.getManifestWithContent(manifestId);
      setManifest(manifestData);
      setManifestContent(content);
      
      // Initialize edit form with current data
      setEditedManifest({
        name: manifestData.name,
        description: manifestData.description || '',
        content: JSON.stringify(content || {}, null, 2),
      });
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch manifest data');
      console.error('Error fetching manifest data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
    setJsonError(null);
    setTabValue(0);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setJsonError(null);
    // Reset form to current manifest data
    if (manifest) {
      setEditedManifest({
        name: manifest.name,
        description: manifest.description || '',
        content: JSON.stringify(manifestContent || {}, null, 2),
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedManifest(prev => ({
      ...prev,
      [name]: value,
    }));

    // Real-time JSON validation for content field
    if (name === 'content') {
      validateJson(value);
    }
  };

  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      setJsonError('JSON content cannot be empty');
      return false;
    }

    try {
      JSON.parse(jsonString);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(`Invalid JSON: ${(e as Error).message}`);
      return false;
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(editedManifest.content);
      const formatted = JSON.stringify(parsed, null, 2);
      setEditedManifest(prev => ({
        ...prev,
        content: formatted,
      }));
      setJsonError(null);
    } catch (e) {
      setJsonError(`Cannot format invalid JSON: ${(e as Error).message}`);
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(editedManifest.content);
      const minified = JSON.stringify(parsed);
      setEditedManifest(prev => ({
        ...prev,
        content: minified,
      }));
      setJsonError(null);
    } catch (e) {
      setJsonError(`Cannot minify invalid JSON: ${(e as Error).message}`);
    }
  };

  const handleUpdateManifest = async () => {
    if (!manifestId || !editedManifest.name.trim()) return;
    
    if (!validateJson(editedManifest.content)) {
      return;
    }
    
    try {
      const contentObj = JSON.parse(editedManifest.content);
      
      const updatedManifest = await ManifestService.updateManifest(manifestId, {
        name: editedManifest.name.trim(),
        description: editedManifest.description.trim() || undefined,
        manifestData: contentObj,
      });
      
      setManifest(updatedManifest);
      setManifestContent(contentObj);
      setSuccess('Manifest updated successfully');
      handleCloseEditDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update manifest');
      console.error('Error updating manifest:', err);
    }
  };

  const handleDeleteManifest = async () => {
    if (!manifestId || !window.confirm('Are you sure you want to delete this manifest? This action cannot be undone.')) {
      return;
    }
    
    try {
      await ManifestService.deleteManifest(manifestId);
      navigate(`/projects/${manifest?.project?.id || manifest?.projectId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete manifest');
      console.error('Error deleting manifest:', err);
    }
  };

  const renderJsonContent = (content: any, editable = false) => {
    if (!content) {
      return (
        <Typography color="text.secondary">
          No content available or failed to load manifest content.
        </Typography>
      );
    }

    const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    if (editable) {
      return (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Tooltip title="Format JSON">
              <IconButton size="small" onClick={formatJson}>
                <FormatIcon />
              </IconButton>
            </Tooltip>
            <Button size="small" onClick={minifyJson} variant="outlined">
              Minify
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {jsonError ? (
                <>
                  <ErrorIcon color="error" fontSize="small" />
                  <Chip label="Invalid JSON" color="error" size="small" />
                </>
              ) : (
                <>
                  <ValidIcon color="success" fontSize="small" />
                  <Chip label="Valid JSON" color="success" size="small" />
                </>
              )}
            </Box>
          </Box>
          
          <TextField
            margin="dense"
            id="content"
            name="content"
            label="Manifest Content (JSON)"
            multiline
            minRows={15}
            maxRows={25}
            fullWidth
            variant="outlined"
            value={editedManifest.content}
            onChange={handleInputChange}
            required
            error={!!jsonError}
            helperText={jsonError}
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '14px',
              },
            }}
          />
        </Box>
      );
    }

    return (
      <Paper variant="outlined" sx={{ p: 2, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={previewMode}
                onChange={(e) => setPreviewMode(e.target.checked)}
              />
            }
            label="Preview Mode"
          />
          <Box>
            <Tooltip title={previewMode ? "Show Raw JSON" : "Show Formatted"}>
              <IconButton size="small">
                {previewMode ? <CodeIcon /> : <PreviewIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {previewMode ? (
          <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
            {renderContentPreview(content)}
          </Box>
        ) : (
          <pre style={{ 
            overflow: 'auto', 
            maxHeight: '500px',
            fontSize: '14px',
            lineHeight: '1.4',
            margin: 0,
          }}>
            {jsonString}
          </pre>
        )}
      </Paper>
    );
  };

  const renderContentPreview = (content: any) => {
    if (!content || typeof content !== 'object') {
      return <Typography>{JSON.stringify(content)}</Typography>;
    }

    return (
      <Box>
        {Object.entries(content).map(([key, value]) => (
          <Box key={key} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
              {key}:
            </Typography>
            <Typography component="div" sx={{ ml: 2, mt: 1 }}>
              {typeof value === 'object' ? (
                <pre style={{ fontSize: '13px', margin: 0 }}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                String(value)
              )}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!manifest) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">
            Manifest not found or you don't have access to it.
          </Alert>
          <Button variant="contained" onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
            Back to Projects
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Button 
          variant="outlined" 
          onClick={() => navigate(`/projects/${manifest.project?.id || manifest.projectId}`)} 
          sx={{ mb: 2 }}
        >
          Back to Project
        </Button>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {manifest.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {manifest.description || 'No description'}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Chip label={`Version ${manifest.version}`} size="small" />
                <Chip 
                  label={manifest.status} 
                  color={manifest.status === 'published' ? 'success' : 'default'}
                  size="small" 
                />
              </Box>
            </Box>
            <Box>
              <Button 
                variant="outlined" 
                onClick={() => manifest.downloadUrl && window.open(manifest.downloadUrl, '_blank')} 
                sx={{ mr: 1 }}
                disabled={!manifest.downloadUrl}
              >
                Download
              </Button>
              <Button variant="contained" onClick={handleOpenEditDialog} sx={{ mr: 1 }}>
                Edit
              </Button>
              <Button variant="outlined" color="error" onClick={handleDeleteManifest}>
                Delete
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Manifest Content
          </Typography>
          
          {renderJsonContent(manifestContent)}
        </Paper>
      </Box>

      {/* Enhanced Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Edit Manifest</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Basic Information" />
            <Tab label="Content Editor" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              name="name"
              label="Manifest Name"
              type="text"
              fullWidth
              variant="outlined"
              value={editedManifest.name}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              id="description"
              name="description"
              label="Description (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              value={editedManifest.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {renderJsonContent(editedManifest.content, true)}
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateManifest} 
            variant="contained"
            disabled={!editedManifest.name.trim() || !!jsonError}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManifestDetail;