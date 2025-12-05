import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Games from './pages/Games';
import Standings from './pages/Standings';
import Seasons from './pages/Seasons';
import TeamDetail from './pages/TeamDetail';
import PlayerDetail from './pages/PlayerDetail';
import Layout from './components/Layout';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<TeamDetail />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:id" element={<PlayerDetail />} />
            <Route path="/games" element={<Games />} />
            <Route path="/seasons" element={<Seasons />} />
            <Route path="/standings" element={<Standings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;