import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UploadTrack from './components/UploadTrack';
import RadioPlayer from './components/RadioPlayer';
import Dashboard from './components/Dashboard';
import RadioProfile from './components/RadioProfile';
import AddProfile from './components/AddProfile';
import EditProfile from './components/EditProfile';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddProfile />} />
        <Route path="/radio/:id/edit" element={<EditProfile />} />
        <Route path="/radio/:id/profile" element={<RadioProfile />} />
        <Route path="/radio/:id" element={<RadioPlayer />} />
       
      </Routes>
    </Router>
  );
};

export default App;
