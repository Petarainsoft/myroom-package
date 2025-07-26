import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { AdminService, AdminUser, CreateAdminUser, UpdateAdminUser } from '../services/admin.service';

const Admins: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateAdminUser>({
    email: '',
    name: '',
    password: '',
    role: 'ADMIN',
  });

  const [editFormData, setEditFormData] = useState<UpdateAdminUser>({});

  const fetchData = () => {
    setLoading(true);
    AdminService.getAdmins(page + 1, rowsPerPage, search)
      .then((res) => {
        // Ensure data is an array
        if (Array.isArray(res.data)) {
          setAdmins(res.data);
          setTotal(res.total || 0);
        } else {
          console.warn('Admins response data is not an array:', res);
          setAdmins([]);
          setTotal(0);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch admins', err);
        setError('Failed to load admin users');
        setAdmins([]); // Ensure admins is always an array
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchData();
    }
  };

  const handleCreateAdmin = async () => {
    try {
      await AdminService.createAdmin(formData);
      setCreateModalOpen(false);
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'ADMIN',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create admin:', err);
      setError('Failed to create admin user');
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;
    
    try {
      await AdminService.updateAdmin(selectedAdmin.id, editFormData);
      setEditModalOpen(false);
      setSelectedAdmin(null);
      setEditFormData({});
      fetchData();
    } catch (err) {
      console.error('Failed to update admin:', err);
      setError('Failed to update admin user');
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (!confirm(`Are you sure you want to delete admin user "${admin.name}"?`)) {
      return;
    }
    
    try {
      await AdminService.deleteAdmin(admin.id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete admin:', err);
      setError('Failed to delete admin user');
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    try {
      if (admin.isActive) {
        await AdminService.deactivateAdmin(admin.id);
      } else {
        await AdminService.activateAdmin(admin.id);
      }
      fetchData();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update admin status');
    }
  };

  const handleResetPassword = async (admin: AdminUser) => {
    if (!confirm(`Reset password for admin user "${admin.name}"?`)) {
      return;
    }
    
    try {
      const result = await AdminService.resetPassword(admin.id);
      setResetPasswordResult(result.temporaryPassword);
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError('Failed to reset password');
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditFormData({
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
    });
    setEditModalOpen(true);
  };

  return (
    <Container sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Admin Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Admin
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {resetPasswordResult && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setResetPasswordResult(null)}>
              Close
            </Button>
          }
        >
          New temporary password: <strong>{resetPasswordResult}</strong>
        </Alert>
      )}

      <TextField
        placeholder="Search by email or name"
        variant="outlined"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleSearchKey}
        fullWidth
        sx={{ mb: 2 }}
      />

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id} hover>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={admin.role.replace('_', ' ')}
                      color={admin.role === 'SUPER_ADMIN' ? 'error' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={admin.isActive ? 'Active' : 'Inactive'}
                      color={admin.isActive ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditModal(admin)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Password">
                      <IconButton size="small" onClick={() => handleResetPassword(admin)}>
                        <LockResetIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={admin.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton size="small" onClick={() => handleToggleStatus(admin)}>
                        {admin.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteAdmin(admin)}
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

      {/* Create Admin Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Admin User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'SUPER_ADMIN' })}
                label="Role"
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateAdmin}
            variant="contained"
            disabled={!formData.email || !formData.name || !formData.password}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Admin Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Admin User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={editFormData.email || ''}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Name"
              value={editFormData.name || ''}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editFormData.role || 'ADMIN'}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'ADMIN' | 'SUPER_ADMIN' })}
                label="Role"
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editFormData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'active' })}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button onClick={handleEditAdmin} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Admins;