import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as CopyIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ApiKeyService, ApiKey, CreateApiKey } from '../services/apikey.service';

const ApiKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateApiKey>({
    name: '',
    expiresAt: '',
  });
  
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [regeneratedKey, setRegeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiKeyService.getApiKeys();
      setApiKeys(response.data);
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const data: CreateApiKey = {
        name: formData.name.trim(),
        expiresAt: formData.expiresAt || undefined,
      };
      
      await ApiKeyService.createApiKey(data);
      
      setCreateModalOpen(false);
      setFormData({ name: '', expiresAt: '' });
      setSuccess('API key created successfully');
      fetchApiKeys();
    } catch (err) {
      console.error('Failed to create API key:', err);
      setError('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!keyToDelete) return;

    try {
      await ApiKeyService.deleteApiKey(keyToDelete.id);
      setConfirmDeleteOpen(false);
      setKeyToDelete(null);
      setSuccess('API key deleted successfully');
      fetchApiKeys();
    } catch (err) {
      console.error('Failed to delete API key:', err);
      setError('Failed to delete API key');
    }
  };

  const handleToggleStatus = async (apiKey: ApiKey) => {
    try {
      if (apiKey.isActive) {
        await ApiKeyService.deactivateApiKey(apiKey.id);
      } else {
        await ApiKeyService.activateApiKey(apiKey.id);
      }
      setSuccess(`API key ${apiKey.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchApiKeys();
    } catch (err) {
      console.error('Failed to update API key status:', err);
      setError('Failed to update API key status');
    }
  };

  const handleRegenerateKey = async (apiKey: ApiKey) => {
    if (!confirm('Are you sure you want to regenerate this API key? The old key will no longer work.')) {
      return;
    }

    try {
      const result = await ApiKeyService.regenerateApiKey(apiKey.id);
      setRegeneratedKey(result.key);
      setSuccess('API key regenerated successfully');
      fetchApiKeys();
    } catch (err) {
      console.error('Failed to regenerate API key:', err);
      setError('Failed to regenerate API key');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('API key copied to clipboard');
  };

  const formatKey = (key: string, isVisible: boolean) => {
    if (isVisible) return key;
    return key.substring(0, 8) + '••••••••••••••••••••••••••••••••';
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          API Key Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create API Key
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {regeneratedKey && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setRegeneratedKey(null)}>
              Close
            </Button>
          }
        >
          <strong>New API Key:</strong> {regeneratedKey}
          <Button 
            size="small" 
            onClick={() => copyToClipboard(regeneratedKey)}
            sx={{ ml: 1 }}
          >
            Copy
          </Button>
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : apiKeys.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No API keys found. Create your first API key to get started.
          </Typography>
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>API Key</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Usage Count</TableCell>
              <TableCell>Last Used</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id} hover>
                <TableCell>{apiKey.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace' }}>
                      {formatKey(apiKey.key, visibleKeys.has(apiKey.id))}
                    </Typography>
                    <Tooltip title={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}>
                      <IconButton size="small" onClick={() => toggleKeyVisibility(apiKey.id)}>
                        {visibleKeys.has(apiKey.id) ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy to clipboard">
                      <IconButton size="small" onClick={() => copyToClipboard(apiKey.key)}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={apiKey.isActive ? 'Active' : 'Inactive'}
                    color={apiKey.isActive ? 'success' : 'default'}
                    size="small"
                  />
                  {isExpired(apiKey.expiresAt) && (
                    <Chip
                      label="Expired"
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell>{apiKey.usageCount}</TableCell>
                <TableCell>
                  {apiKey.lastUsedAt 
                    ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                    : 'Never'
                  }
                </TableCell>
                <TableCell>{new Date(apiKey.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {apiKey.expiresAt 
                    ? new Date(apiKey.expiresAt).toLocaleDateString()
                    : 'Never'
                  }
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Regenerate key">
                    <IconButton size="small" onClick={() => handleRegenerateKey(apiKey)}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={apiKey.isActive ? 'Deactivate' : 'Activate'}>
                    <IconButton size="small" onClick={() => handleToggleStatus(apiKey)}>
                      {apiKey.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setKeyToDelete(apiKey);
                        setConfirmDeleteOpen(true);
                      }}
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
      )}

      {/* Create API Key Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            label="API Key Name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Production API Key"
            required
          />
          <TextField
            label="Expiration Date (Optional)"
            type="date"
            fullWidth
            margin="normal"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            InputLabelProps={{ shrink: true }}
            helperText="Leave empty for no expiration"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateApiKey} 
            variant="contained"
            disabled={creating || !formData.name.trim()}
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete API Key</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the API key "{keyToDelete?.name}"? 
            This action cannot be undone and all applications using this key will stop working.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteApiKey} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ApiKeyManagement; 