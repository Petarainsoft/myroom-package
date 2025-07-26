import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
// No specific icons needed
import { useParams, useNavigate } from 'react-router-dom';
import { ResourceService } from '../services';
import { Resource } from '../services/resource.service';
import BabylonViewer from '../components/BabylonViewer';

const ResourceDetail: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceId) return;
    fetchResourceData();
  }, [resourceId]);

  const fetchResourceData = async () => {
    if (!resourceId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const resourceData = await ResourceService.getResource(resourceId);
      setResource(resourceData);
      // Fetch presigned URL to load model (view-only)
      try {
        const downloadInfo = await ResourceService.getPreviewUrl(resourceId);
        setModelUrl(downloadInfo.downloadUrl);
      } catch (err) {
        console.error('Failed to get download url', err);
      }
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch resource data');
      console.error('Error fetching resource data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download functionality removed

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAccessPolicyColor = (policy: string) => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      public: 'success',
      'project-only': 'info',
      'customers-only': 'warning',
      private: 'error',
    };
    return colors[policy] || 'default';
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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!resource) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">
            Resource not found or you don't have access to it.
          </Alert>
          <Button variant="contained" onClick={() => navigate('/resources')} sx={{ mt: 2 }}>
            Back to Resources
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

        <Button variant="outlined" onClick={() => navigate('/resources')} sx={{ mb: 2 }}>
          Back to Resources
        </Button>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {resource.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={resource.type} 
                  color={getTypeColor(resource.type)}
                  variant="outlined" 
                />
                <Chip 
                  label={resource.accessPolicy} 
                  color={getAccessPolicyColor(resource.accessPolicy)}
                  variant="outlined"
                />
                {resource.metadata?.fileSize && (
                  <Chip 
                    label={formatFileSize(resource.metadata.fileSize)}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
              
              <Typography variant="body1" color="text.secondary">
                {resource.metadata?.description || 'No description available'}
              </Typography>
            </Box>
            
            {/** empty right side **/}
          </Box>
          
          <Divider sx={{ my: 3 }} />

          {/* 3D Viewer */}
          {modelUrl ? (
            <Box sx={{ width: '100%', height: 500, mb: 4 }}>
              <BabylonViewer url={modelUrl} autoRotate />
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 4 }}>
              Unable to load 3D preview for this resource.
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <pre style={{ 
                  overflow: 'auto', 
                  maxHeight: '300px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  margin: 0,
                }}>
                  {JSON.stringify(resource.metadata, null, 2)}
                </pre>
              </Paper>
            </Grid>
          </Grid>
          
          {resource.metadata && Object.keys(resource.metadata).length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Additional Metadata
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2 }}>
                <pre style={{ 
                  overflow: 'auto', 
                  maxHeight: '300px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  margin: 0,
                }}>
                  {JSON.stringify(resource.metadata, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Remove snackbar related to download */}
    </Container>
  );
};

export default ResourceDetail;