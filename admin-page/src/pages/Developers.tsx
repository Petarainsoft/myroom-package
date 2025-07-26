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
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import { DeveloperService, Developer } from '../services/developer.service';
import DeveloperPermissionsModal from '../components/DeveloperPermissionsModal';

const Developers: React.FC = () => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Permission modal state
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);

  const fetchData = () => {
    setLoading(true);
    DeveloperService.getDevelopers(page + 1, rowsPerPage, search)
      .then((res) => {
        setDevelopers(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        console.error('Failed to fetch developers', err);
        setError('Failed to load developers');
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

  const handleSuspendToggle = async (developer: Developer) => {
    try {
      if (developer.status === 'active') {
        await DeveloperService.suspendDeveloper(developer.id);
      } else {
        await DeveloperService.activateDeveloper(developer.id);
      }
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  const handleOpenPermissions = (developer: Developer) => {
    setSelectedDeveloper(developer);
    setPermissionsModalOpen(true);
  };

  const handleClosePermissions = () => {
    setPermissionsModalOpen(false);
    setSelectedDeveloper(null);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Developers
      </Typography>

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
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {developers.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.email}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={d.status}
                      color={d.status === 'active' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Manage Permissions">
                      <IconButton size="small" onClick={() => handleOpenPermissions(d)}>
                        <SecurityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={d.status === 'active' ? 'Suspend' : 'Activate'}>
                      <IconButton size="small" onClick={() => handleSuspendToggle(d)}>
                        {d.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
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

      <DeveloperPermissionsModal
        open={permissionsModalOpen}
        onClose={handleClosePermissions}
        developer={selectedDeveloper}
      />
    </Container>
  );
};

export default Developers;