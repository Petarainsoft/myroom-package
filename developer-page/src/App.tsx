import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, ApiKeyProvider } from './contexts';
import { Navbar, ProtectedRoute } from './components';
import {
  Home,
  Login,
  Register,
  Profile,
  Projects,
  ProjectDetail,
  Resources,
  ResourceDetail,
  ManifestDetail,
  UsageStats,
} from './pages';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ApiKeyProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/resources/:resourceId" element={<ResourceDetail />} />
                <Route path="/manifests/:manifestId" element={<ManifestDetail />} />
                <Route path="/usage-stats" element={<UsageStats />} />
              </Route>
            </Routes>
          </Router>
        </ApiKeyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
