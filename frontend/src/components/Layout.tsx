import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Avatar,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Home,
  People,
  Person,
  CalendarToday,
  EmojiEvents,
  SportsSoccer,
  Logout,
  Groups,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Leagues', href: '/leagues', icon: Groups },
    { name: 'Teams', href: '/teams', icon: People },
    { name: 'Players', href: '/players', icon: Person },
    { name: 'Games', href: '/games', icon: CalendarToday },
    { name: 'Seasons', href: '/seasons', icon: SportsSoccer },
    { name: 'Standings', href: '/standings', icon: EmojiEvents },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Arch Suite
        </Typography>
      </Toolbar>
      <List sx={{ flexGrow: 1 }}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <ListItem key={item.name} disablePadding>
              <ListItemButton
                component={Link}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                sx={{
                  backgroundColor: isActive ? theme.palette.primary.light : 'transparent',
                  color: isActive ? theme.palette.primary.contrastText : 'inherit',
                  '&:hover': {
                    backgroundColor: isActive ? theme.palette.primary.light : theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? theme.palette.primary.contrastText : 'inherit' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.name} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <ListItemButton
          component={Link}
          to="/profile"
          onClick={() => setMobileOpen(false)}
          sx={{
            borderRadius: 1,
            mb: 2,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 1 }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {user?.email}
            </Typography>
          </Box>
        </ListItemButton>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${240}px)` },
          ml: { lg: `${240}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Arch Suite Management
          </Typography>
        </Toolbar>
      </AppBar> */}

      <Box
        component="nav"
        sx={{ width: { lg: 240 }, flexShrink: { lg: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { lg: `calc(100% - ${240}px)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
