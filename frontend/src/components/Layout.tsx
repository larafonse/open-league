import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import {
  Home,
  People,
  Person,
  CalendarToday,
  EmojiEvents,
  SportsSoccer,
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
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
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Arch Suite
        </Typography>
      </Toolbar>
      <List>
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
