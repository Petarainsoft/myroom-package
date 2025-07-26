import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { ProjectService } from '../services';
import { ApiKey } from '../services/project.service';
import { useApiKey } from '../contexts';

interface ApiKeySelectorProps {
  projectId: string;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ projectId }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  
  const { activeApiKey, setActiveApiKey } = useApiKey();

  useEffect(() => {
    fetchApiKeys();
  }, [projectId]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const keys = await ProjectService.getApiKeys(projectId);
      setApiKeys(keys);

      // If there's no active API key but we have keys, set the first active one
      if (!activeApiKey && keys.length > 0) {
        const activeKey = keys.find(key => key.status === 'ACTIVE');
        if (activeKey) {
          setActiveApiKey(activeKey.key);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch API keys');
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: SelectChangeEvent) => {
    setActiveApiKey(event.target.value);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewKeyLabel('');
  };

  const handleCreateKey = async () => {
    if (!newKeyLabel.trim()) {
      return;
    }

    try {
      const newKey = await ProjectService.createApiKey(projectId, {
        name: newKeyLabel.trim(),
      });

      setApiKeys([...apiKeys, newKey]);
      setActiveApiKey(newKey.key);
      setSuccess('API key created successfully');
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create API key');
      console.error('Error creating API key:', err);
    }
  };

  const handleRevokeKey = async (apiKeyId: string) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await ProjectService.revokeApiKey(projectId, apiKeyId);
      setSuccess('API key revoked successfully');
      fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke API key');
      console.error('Error revoking API key:', err);
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

  if (loading) {
    return <Typography>Loading API keys...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        API Keys
      </Typography>

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

      {apiKeys.length === 0 ? (
        <Typography sx={{ mb: 2 }}>
          No API keys found for this project. Create one to get started.
        </Typography>
      ) : (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="api-key-select-label">Active API Key</InputLabel>
          <Select
            labelId="api-key-select-label"
            id="api-key-select"
            value={activeApiKey || ''}
            label="Active API Key"
            onChange={handleChange}
          >
            {apiKeys
              .filter(key => key.status === 'ACTIVE')
              .map(key => (
                <MenuItem key={key.id} value={key.key}>
                  {key.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          Create New API Key
        </Button>

        {apiKeys.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              All API Keys:
            </Typography>
            {apiKeys.map(key => {
              const isVisible = visibleKeys.has(key.id);
              return (
                <Paper key={key.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        {key.name}
                      </Typography>
                      <Chip
                        label={key.status}
                        color={key.status === 'ACTIVE' ? 'success' : key.status === 'REVOKED' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="small"
                          value={formatKey(key.key, isVisible)}
                          InputProps={{
                            readOnly: true,
                            style: { fontFamily: 'monospace', fontSize: '0.875rem' },
                          }}
                        />
                        <Tooltip title={isVisible ? 'Hide key' : 'Show key'}>
                          <IconButton
                            onClick={() => toggleKeyVisibility(key.id)}
                            size="small"
                          >
                            {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            onClick={() => copyToClipboard(key.key)}
                            size="small"
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" display="block">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                      </Typography>
                      {key.status === 'ACTIVE' && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRevokeKey(key.id)}
                          sx={{ mt: 1 }}
                        >
                          Revoke
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="label"
            label="Key Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newKeyLabel}
            onChange={e => setNewKeyLabel(e.target.value)}
            required
            helperText="Enter a name to identify this API key"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateKey} color="primary" disabled={!newKeyLabel.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ApiKeySelector;