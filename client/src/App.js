import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminLogin from './components/AdminLogin';
import RadioPlayer from './components/RadioPlayer';
import RadioProfile from './components/RadioProfile';
import AddProfile from './components/AddProfile';
import EditProfile from './components/EditProfile';
import Login from './components/Login';

const PrivateRoute = ({ element: Element, ...rest }) => {
  const isAuthenticated = !!localStorage.getItem('token') || !!localStorage.getItem('adminToken');
  return isAuthenticated ? <Element {...rest} /> : <Navigate to="/login" />;
};

const AdminPrivateRoute = ({ element: Element, ...rest }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  return isAuthenticated ? <Element {...rest} /> : <Navigate to="/admin/login" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<AdminPrivateRoute element={Dashboard} />} />
        <Route path="/add" element={<PrivateRoute element={AddProfile} />} />
        <Route path="/radio/:id/edit" element={<PrivateRoute element={EditProfile} />} />
        <Route path="/radio/:id/profile" element={<PrivateRoute element={RadioProfile} />} />
        <Route path="/radio/:id" element={<PrivateRoute element={RadioPlayer} />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
