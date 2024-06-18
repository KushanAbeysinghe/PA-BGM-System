// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RadioPlayer from './components/RadioPlayer';
import UploadTrack from './components/UploadTrack';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/radio" element={<RadioPlayer />} />
          <Route path="/upload" element={<UploadTrack />} />
          <Route path="/" element={<div><h1>Welcome to the Radio Streaming Website</h1></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
