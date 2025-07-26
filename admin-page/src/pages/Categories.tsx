import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import { CategoryService, Category, CreateCategoryData, UpdateCategoryData } from '../services/category.service';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [view, setView] = useState<'flat' | 'tree'>('tree');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);

  const fetchCategories = async () => {
    if (view === 'tree') {
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

  useEffect(() => {
    fetchCategories();
    fetchFlatCategories(); // Always fetch flat for parent selection
  }, [view]);

  const handleSave = async () => {
    try {
      if (editing) {
        // For updates, only send changed fields
        const updateData: UpdateCategoryData = {
          name,
          description: description || undefined,
          isPremium,
          parentId,
          sortOrder,
          isActive: true
        };
        console.log('Updating category:', editing.id, 'with data:', updateData);
        await CategoryService.updateCategory(editing.id, updateData);
        console.log('Category updated successfully');
      } else {
        // For creates, send all required fields
        const createData: CreateCategoryData = {
          name,
          description: description || undefined,
          isPremium,
          parentId,
          sortOrder,
          isActive: true
        };
        console.log('Creating category with data:', createData);
        await CategoryService.createCategory(createData);
        console.log('Category created successfully');
      }
      
      resetForm();
      fetchCategories();
      fetchFlatCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert('Error saving category: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditing(null);
    setName('');
    setDescription('');
    setIsPremium(false);
    setParentId(null);
    setSortOrder(0);
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsPremium(cat.isPremium);
    setParentId(cat.parentId || null);
    setSortOrder(cat.sortOrder || 0);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete category? This will also delete all subcategories.')) return;
    await CategoryService.deleteCategory(id);
    fetchCategories();
    fetchFlatCategories();
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
                {category.path && (
                  <Typography variant="caption" color="text.secondary">
                    {category.path}
                  </Typography>
                )}
              </Box>
            </Box>
          </TableCell>
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
              <IconButton size="small" onClick={() => handleEdit(category)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDelete(category.id)}>
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

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Categories Management
        </Typography>
        <Box display="flex" gap={2}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => newView && setView(newView)}
            size="small"
          >
            <ToggleButton value="tree">Tree View</ToggleButton>
            <ToggleButton value="flat">Flat View</ToggleButton>
          </ToggleButtonGroup>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setDialogOpen(true)}
          >
            New Category
          </Button>
        </Box>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Parent Category</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Info</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {view === 'tree' 
            ? categories.map((category) => renderCategoryRow(category))
            : flatCategories.map((category) => renderCategoryRow(category, category.level || 0))
          }
          {(view === 'tree' ? categories : flatCategories).length === 0 && (
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

      <Dialog open={dialogOpen} onClose={resetForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {editing ? 'Edit Category' : 'New Category'}
          {editing && editing.path && (
            <Typography variant="caption" display="block" color="text.secondary">
              Path: {editing.path}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Category Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={parentId || ''}
                label="Parent Category"
                onChange={(e) => setParentId(e.target.value || null)}
              >
                <MenuItem value="">
                  <em>None (Root Category)</em>
                </MenuItem>
                {flatCategories
                  .filter(cat => !editing || cat.id !== editing.id) // Prevent self-selection
                  .map((cat) => (
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
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              helperText="Lower numbers appear first"
            />

            <FormControlLabel
              control={
                <Switch 
                  checked={isPremium} 
                  onChange={(e) => setIsPremium(e.target.checked)} 
                />
              }
              label="Premium Category"
            />

            {parentId && (
              <Box sx={{ p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> This category will be created under "
                  {flatCategories.find(c => c.id === parentId)?.name || 'Unknown'}"
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={!name.trim()}
          >
            {editing ? 'Update' : 'Create'} Category
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Categories; 