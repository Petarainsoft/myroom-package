import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Developers from './pages/Developers';
import ResourcesAndCategories from './pages/ResourcesAndCategories';
import AvatarCategoriesAndParts from './pages/AvatarCategoriesAndParts';
import Room from './pages/Room';
import Admins from './pages/Admins';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}> {/* Protected wrapper */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              }
            />
            {/* Placeholder routes for future features */}
            {/* Developers */}
            <Route
              path="/developers"
              element={<MainLayout><Developers /></MainLayout>}
            />
            {/* Resources and Categories */}
            <Route
              path="/resources"
              element={<MainLayout><ResourcesAndCategories /></MainLayout>}
            />
            <Route
              path="/avatar"
              element={<MainLayout><AvatarCategoriesAndParts /></MainLayout>}
            />
            <Route
              path="/room"
              element={<MainLayout><Room /></MainLayout>}
            />
            <Route
              path="/categories"
              element={<MainLayout><ResourcesAndCategories /></MainLayout>}
            />
            {/* Admins */}
            <Route
              path="/admins"
              element={<MainLayout><Admins /></MainLayout>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
