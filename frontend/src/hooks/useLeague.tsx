import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { leaguesApi } from '../services/api';
import type { League } from '../types';

interface LeagueContextType {
  selectedLeague: League | null;
  setSelectedLeague: (league: League | null) => void;
  userLeagues: League[];
  isLoading: boolean;
  refreshLeagues: () => Promise<void>;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
};

type LeagueProviderProps = {
  children: ReactNode;
};

export const LeagueProvider: React.FC<LeagueProviderProps> = ({ children }) => {
  const [selectedLeague, setSelectedLeagueState] = useState<League | null>(null);
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshLeagues = async () => {
    try {
      const leagues = await leaguesApi.getMyLeagues();
      setUserLeagues(leagues);
      
      // If a league was selected but is no longer in user's leagues, clear it
      if (selectedLeague && !leagues.find(l => l._id === selectedLeague._id)) {
        setSelectedLeagueState(null);
        localStorage.removeItem('selectedLeagueId');
      }
      
      // If no league selected but user has leagues, select the first one
      if (!selectedLeague && leagues.length > 0) {
        const savedLeagueId = localStorage.getItem('selectedLeagueId');
        const leagueToSelect = savedLeagueId 
          ? leagues.find(l => l._id === savedLeagueId) || leagues[0]
          : leagues[0];
        setSelectedLeagueState(leagueToSelect);
        localStorage.setItem('selectedLeagueId', leagueToSelect._id);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLeagues();
  }, []);

  // Load selected league from localStorage on mount
  useEffect(() => {
    const savedLeagueId = localStorage.getItem('selectedLeagueId');
    if (savedLeagueId && userLeagues.length > 0) {
      const league = userLeagues.find(l => l._id === savedLeagueId);
      if (league) {
        setSelectedLeagueState(league);
      }
    }
  }, [userLeagues]);

  const setSelectedLeague = (league: League | null) => {
    setSelectedLeagueState(league);
    if (league) {
      localStorage.setItem('selectedLeagueId', league._id);
    } else {
      localStorage.removeItem('selectedLeagueId');
    }
  };

  const value: LeagueContextType = {
    selectedLeague,
    setSelectedLeague,
    userLeagues,
    isLoading,
    refreshLeagues,
  };

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
};

