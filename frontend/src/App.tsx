import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Simple placeholder components with Tailwind CSS
const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to your sports league management system</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
        <p className="text-3xl font-bold text-blue-600">0</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Players</h3>
        <p className="text-3xl font-bold text-green-600">0</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Games</h3>
        <p className="text-3xl font-bold text-purple-600">0</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
        <p className="text-3xl font-bold text-orange-600">0</p>
      </div>
    </div>
  </div>
);

const Teams = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
      <p className="mt-2 text-gray-600">Manage your league teams</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Team management features coming soon...</p>
    </div>
  </div>
);

const Players = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Players</h1>
      <p className="mt-2 text-gray-600">Manage league players</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Player management features coming soon...</p>
    </div>
  </div>
);

const Games = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Games</h1>
      <p className="mt-2 text-gray-600">Manage league games and schedules</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Game management features coming soon...</p>
    </div>
  </div>
);

const Standings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">League Standings</h1>
      <p className="mt-2 text-gray-600">Current league standings and statistics</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Standings will appear once games are played.</p>
    </div>
  </div>
);

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