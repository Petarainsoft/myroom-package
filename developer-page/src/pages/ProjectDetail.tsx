import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectService } from '../services';
import { Project } from '../services/project.service';
import { ManifestService, ResourceService } from '../services';
import { Manifest } from '../services/manifest.service';
import { Resource } from '../services/resource.service';
import { ApiKeySelector } from '../components';

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedProject, setEditedProject] = useState<{ name: string; description: string }>({ 
    name: '', 
    description: '' 
  });
  const [openManifestDialog, setOpenManifestDialog] = useState(false);
  const [newManifest, setNewManifest] = useState({
    name: '',
    description: '',
    content: '{}',
  });

  useEffect(() => {
    if (!projectId) return;
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch project details
      const projectData = await ProjectService.getProject(projectId);
      setProject(projectData);
      setEditedProject({
        name: projectData.name,
        description: projectData.description,
      });
      
      // TODO: Fetch resources accessible to this project 
      // This endpoint requires different authentication - will be implemented later
      // const resourcesData = await ResourceService.getAccessibleResources(projectId);
      // setResources(resourcesData);
      setResources([]); // Temporary: Set empty resources array
      
      // Fetch manifests for this project
      const manifestsResponse = await ManifestService.getManifests(projectId);
      setManifests(manifestsResponse.manifests);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project data');
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (editMode && project) {
      // Reset form when canceling edit
      setEditedProject({
        name: project.name,
        description: project.description,
      });
    }
    setEditMode(!editMode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProject(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProject = async () => {
    if (!projectId || !editedProject.name.trim()) return;
    
    try {
      const updatedProject = await ProjectService.updateProject(projectId, {
        name: editedProject.name.trim(),
        description: editedProject.description.trim(),
      });
      
      setProject(updatedProject);
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update project');
      console.error('Error updating project:', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || !window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      await ProjectService.deleteProject(projectId);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project');
      console.error('Error deleting project:', err);
    }
  };

  const handleOpenManifestDialog = () => {
    setOpenManifestDialog(true);
  };

  const handleCloseManifestDialog = () => {
    setOpenManifestDialog(false);
    setNewManifest({
      name: '',
      description: '',
      content: '{}',
    });
  };

  const handleManifestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewManifest(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateManifest = async () => {
    if (!projectId || !newManifest.name.trim()) return;
    
    try {
      let contentObj = {};
      try {
        contentObj = JSON.parse(newManifest.content);
      } catch (e) {
        setError('Invalid JSON format for manifest content');
        return;
      }
      
      const createdManifest = await ManifestService.createManifest(projectId, {
        name: newManifest.name.trim(),
        description: newManifest.description.trim() || undefined,
        manifestData: contentObj,
      });
      
      setManifests([...manifests, createdManifest]);
      handleCloseManifestDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create manifest');
      console.error('Error creating manifest:', err);
    }
  };

  const handleViewManifest = (manifestId: string) => {
    navigate(`/manifests/${manifestId}`);
  };

  const handleViewResource = (resourceId: string) => {
    navigate(`/resources/${resourceId}`);
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

  if (!project) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">
            Project not found or you don't have access to it.
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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          {editMode ? (
            <Box>
              <Typography variant="h5" gutterBottom>
                Edit Project
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                label="Project Name"
                name="name"
                value={editedProject.name}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Description"
                name="description"
                value={editedProject.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handleSaveProject}>
                  Save Changes
                </Button>
                <Button variant="outlined" onClick={handleEditToggle}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h4" component="h1">
                    {project.name}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                    {project.description || 'No description'}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Last Updated: {new Date(project.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Button variant="outlined" onClick={handleEditToggle} sx={{ mr: 1 }}>
                    Edit
                  </Button>
                  <Button variant="outlined" color="error" onClick={handleDeleteProject}>
                    Delete
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>

        {projectId && <ApiKeySelector projectId={projectId} />}

        <Paper elevation={3} sx={{ mt: 4 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
            <Tab label="Resources" id="project-tab-0" aria-controls="project-tabpanel-0" />
            <Tab label="Manifests" id="project-tab-1" aria-controls="project-tabpanel-1" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Accessible Resources</Typography>
            </Box>
            
            {resources.length === 0 ? (
              <Typography>No resources available for this project.</Typography>
            ) : (
              <Box>
                {resources.map(resource => (
                  <Paper key={resource.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">{resource.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {resource.type}
                    </Typography>
                    <Button 
                      size="small" 
                      sx={{ mt: 1 }} 
                      onClick={() => handleViewResource(resource.id)}
                    >
                      View Details
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Manifests</Typography>
              <Button variant="contained" size="small" onClick={handleOpenManifestDialog}>
                Create Manifest
              </Button>
            </Box>
            
            {manifests.length === 0 ? (
              <Typography>No manifests created for this project yet.</Typography>
            ) : (
              <Box>
                {manifests.map(manifest => (
                  <Paper key={manifest.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">{manifest.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {manifest.description || 'No description'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Version: {manifest.version}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Created: {new Date(manifest.createdAt).toLocaleDateString()}
                    </Typography>
                    <Button 
                      size="small" 
                      sx={{ mt: 1 }} 
                      onClick={() => handleViewManifest(manifest.id)}
                    >
                      View Manifest
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Box>

      <Dialog open={openManifestDialog} onClose={handleCloseManifestDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Manifest</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Manifest Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newManifest.name}
            onChange={handleManifestInputChange}
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
            value={newManifest.description}
            onChange={handleManifestInputChange}
          />
          <TextField
            margin="dense"
            id="content"
            name="content"
            label="Manifest Content (JSON)"
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={newManifest.content}
            onChange={handleManifestInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManifestDialog}>Cancel</Button>
          <Button onClick={handleCreateManifest} color="primary" disabled={!newManifest.name.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetail;