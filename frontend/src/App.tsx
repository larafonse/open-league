import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Games from './pages/Games';
import Standings from './pages/Standings';

// Simple navigation with Tailwind CSS
const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    <nav className="bg-white shadow-sm border-b border-gray-200 p-4">
      <div className="max-w-7xl mx-auto flex space-x-8">
        <a href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</a>
        <a href="/teams" className="text-gray-600 hover:text-gray-900 font-medium">Teams</a>
        <a href="/players" className="text-gray-600 hover:text-gray-900 font-medium">Players</a>
        <a href="/games" className="text-gray-600 hover:text-gray-900 font-medium">Games</a>
        <a href="/standings" className="text-gray-600 hover:text-gray-900 font-medium">Standings</a>
      </div>
    </nav>
    <main className="max-w-7xl mx-auto py-6 px-4">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/games" element={<Games />} />
          <Route path="/standings" element={<Standings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;