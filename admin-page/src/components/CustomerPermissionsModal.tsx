import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Box,
  Alert,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DeveloperService, Developer, DeveloperPermission, Category } from '../services/developer.service';

interface Props {
  open: boolean;
  onClose: () => void;
  developer: Developer | null;
}

const DeveloperPermissionsModal: React.FC<Props> = ({ open, onClose, developer }) => {
  const [permissions, setPermissions] = useState<DeveloperPermission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for adding new permission
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (developer && open) {
      fetchData();
    }
  }, [developer, open]);

  const fetchData = async () => {
    if (!developer) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [permissionsData, categoriesData] = await Promise.all([
        DeveloperService.getDeveloperPermissions(developer.id),
        DeveloperService.getAvailableCategories(),
      ]);
      
      setPermissions(permissionsData.permissions);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load permissions data');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPermission = async () => {
    if (!developer || !selectedCategory) return;
    
    setAdding(true);
    try {
      const data = {
        categoryId: selectedCategory,
        isPaid,
        paidAmount: isPaid && paidAmount ? parseFloat(paidAmount) : undefined,
        expiredAt: expiredAt || undefined,
      };
      
      await DeveloperService.grantPermission(developer.id, data);
      
      // Reset form
      setSelectedCategory('');
      setIsPaid(false);
      setPaidAmount('');
      setExpiredAt('');
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Failed to grant permission:', err);
      setError('Failed to grant permission');
    } finally {
      setAdding(false);
    }
  };

  const handleRevokePermission = async (permission: DeveloperPermission) => {
    if (!developer) return;
    
    try {
      await DeveloperService.revokePermission(developer.id, permission.categoryId);
      fetchData();
    } catch (err) {
      console.error('Failed to revoke permission:', err);
      setError('Failed to revoke permission');
    }
  };

  const getAvailableCategories = () => {
    const grantedCategoryIds = permissions.map(p => p.categoryId);
    return categories.filter(c => !grantedCategoryIds.includes(c.id));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Developer Permissions: {developer?.name} ({developer?.email})
      </DialogTitle>
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {/* Current permissions */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Current Permissions
            </Typography>
            
            {permissions.length === 0 ? (
              <Typography color="textSecondary" sx={{ mb: 3 }}>
                No permissions granted yet
              </Typography>
            ) : (
              <Table size="small" sx={{ mb: 3 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Granted</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>{permission.category.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={permission.category.isPremium ? 'Premium' : 'Free'} 
                          color={permission.category.isPremium ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {permission.isPaid ? (
                          <Chip 
                            label={`$${permission.paidAmount}`} 
                            color="success" 
                            size="small"
                          />
                        ) : (
                          <Chip label="Free" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(permission.grantedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {permission.expiredAt 
                          ? new Date(permission.expiredAt).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Revoke permission">
                          <IconButton 
                            size="small" 
                            onClick={() => handleRevokePermission(permission)}
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
            
            {/* Add new permission */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Grant New Permission
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  {getAvailableCategories().map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name} {category.isPremium && '(Premium)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={isPaid ? 'paid' : 'free'}
                  onChange={(e) => setIsPaid(e.target.value === 'paid')}
                  label="Payment Status"
                >
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
              
              {isPaid && (
                <TextField
                  label="Paid Amount"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                />
              )}
              
              <TextField
                label="Expiration Date (optional)"
                type="date"
                value={expiredAt}
                onChange={(e) => setExpiredAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              
              <Button
                variant="contained"
                startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}
                onClick={handleGrantPermission}
                disabled={!selectedCategory || adding}
              >
                {adding ? 'Granting...' : 'Grant Permission'}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeveloperPermissionsModal;