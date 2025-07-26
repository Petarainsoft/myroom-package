import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  CloudDownload as CloudDownloadIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts';
import { UsageService, UsageStatsResponse, ActivityEntry } from '../services';

const UsageStats: React.FC = () => {
  const { customer } = useAuth();
  const [stats, setStats] = useState<UsageStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d'>('30d');
  const [activityPage, setActivityPage] = useState(0);
  const [activityRowsPerPage, setActivityRowsPerPage] = useState(10);

  useEffect(() => {
    fetchUsageStats();
  }, [timeFilter]);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await UsageService.getUsageStats({
        period: timeFilter,
        page: activityPage + 1,
        limit: activityRowsPerPage
      });
      
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch usage statistics');
      console.error('Error fetching usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'download':
        return <CloudDownloadIcon fontSize="small" />;
      case 'upload':
        return <StorageIcon fontSize="small" />;
      case 'api_call':
        return <TimelineIcon fontSize="small" />;
      default:
        return <AccessTimeIcon fontSize="small" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'download':
        return 'success';
      case 'upload':
        return 'info';
      case 'api_call':
        return 'primary';
      default:
        return 'default';
    }
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

  if (!stats) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">
            Failed to load usage statistics.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Usage Statistics
          </Typography>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as '7d' | '30d' | '90d')}
              label="Time Period"
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimelineIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">API Calls</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {formatNumber(stats.summary.apiCalls)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label={`${stats.summary.apiCallsChange}%`}
                    color={stats.summary.apiCallsChange >= 0 ? 'success' : 'error'}
                    size="small"
                    icon={<TrendingUpIcon />}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DownloadIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Downloads</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {formatNumber(stats.summary.downloads)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label={`${stats.summary.downloadsChange}%`}
                    color={stats.summary.downloadsChange >= 0 ? 'success' : 'error'}
                    size="small"
                    icon={<TrendingUpIcon />}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Storage Used</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {formatFileSize(stats.summary.storageUsed)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label="N/A"
                    color="default"
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    storage tracking
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Projects</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {stats.summary.activeProjects}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total projects in your account
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Paper elevation={3} sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Resource/Endpoint</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentActivity
                  .slice(activityPage * activityRowsPerPage, activityPage * activityRowsPerPage + activityRowsPerPage)
                  .map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getActivityIcon(entry.type)}
                          <Chip
                            label={entry.type.replace('_', ' ').toUpperCase()}
                            color={getActivityColor(entry.type) as any}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {entry.description || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(entry.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            
            <TablePagination
              component="div"
              count={stats.recentActivity.length}
              page={activityPage}
              onPageChange={(_, newPage) => setActivityPage(newPage)}
              rowsPerPage={activityRowsPerPage}
              onRowsPerPageChange={(e) => {
                setActivityRowsPerPage(parseInt(e.target.value, 10));
                setActivityPage(0);
              }}
            />
          </Box>
        </Paper>

        {/* Daily Trends */}
        <Paper elevation={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Daily Activity Trends
            </Typography>
            
            <Grid container spacing={2}>
              {stats.dailyStats.slice(0, 8).map((dayData) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={dayData.date}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {new Date(dayData.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          API Calls
                        </Typography>
                        <Typography variant="h6">
                          {formatNumber(dayData.apiCalls)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Downloads
                        </Typography>
                        <Typography variant="h6">
                          {formatNumber(dayData.downloads)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Data Transfer
                        </Typography>
                        <Typography variant="h6">
                          {formatFileSize(dayData.dataTransferred)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default UsageStats; 