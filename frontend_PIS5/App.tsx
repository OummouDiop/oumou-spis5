 import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './services/home_page';
import Dashboard from './services/dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;