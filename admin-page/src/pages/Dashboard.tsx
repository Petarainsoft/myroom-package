import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as ProjectIcon,
  CloudUpload as ResourceIcon,
  Category as CategoryIcon,
  Key as ApiKeyIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface DashboardStats {
  developers: {
    total: number;
    active: number;
    suspended: number;
  };
  projects: {
    total: number;
    active: number;
  };
  resources: {
    total: number;
  };
  categories: {
    total: number;
  };
  apiKeys: {
    total: number;
  };
  apiCalls: {
    today: number;
  };
}

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value.toLocaleString()}
          </Typography>
          {subtitle && (
            <Typography color="textSecondary" variant="body2">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color, opacity: 0.7 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        No dashboard data available
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Developers"
            value={stats.developers.total}
            icon={<PeopleIcon fontSize="large" />}
            color="#1976d2"
            subtitle={`${stats.developers.active} active, ${stats.developers.suspended} suspended`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Projects"
            value={stats.projects.total}
            icon={<ProjectIcon fontSize="large" />}
            color="#388e3c"
            subtitle={`${stats.projects.active} active`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Resources"
            value={stats.resources.total}
            icon={<ResourceIcon fontSize="large" />}
            color="#f57c00"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Categories"
            value={stats.categories.total}
            icon={<CategoryIcon fontSize="large" />}
            color="#7b1fa2"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="API Keys"
            value={stats.apiKeys.total}
            icon={<ApiKeyIcon fontSize="large" />}
            color="#c2185b"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="API Calls Today"
            value={stats.apiCalls.today}
            icon={<AnalyticsIcon fontSize="large" />}
            color="#00796b"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;