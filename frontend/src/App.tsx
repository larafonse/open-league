import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Games from './pages/Games';
import Standings from './pages/Standings';
import Seasons from './pages/Seasons';
import TeamDetail from './pages/TeamDetail';
import PlayerDetail from './pages/PlayerDetail';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Leagues from './pages/Leagues';
import LeagueDetail from './pages/LeagueDetail';
import Layout from './components/Layout';
import { Box, CircularProgress } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Science Gothic", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Teams />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/players"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Players />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/players/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PlayerDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Games />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seasons"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Seasons />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/standings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Standings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leagues"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Leagues />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leagues/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LeagueDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            </Routes>
          </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;