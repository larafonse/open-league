import React from 'react';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import type { BasePlayer } from '../types';

interface SoccerPitchProps {
  players: BasePlayer[];
  teamColors: {
    primary: string;
    secondary: string;
  };
}

interface PositionedPlayer extends BasePlayer {
  x: number; // Percentage from left
  y: number; // Percentage from top
}

// Formation: 4-4-2 (y: 0 = top of field, 100 = bottom of field)
// Goalkeeper at bottom, forwards at top
const FORMATION_POSITIONS = {
  Goalkeeper: [{ x: 50, y: 92 }],
  Defender: [
    { x: 20, y: 75 },
    { x: 40, y: 75 },
    { x: 60, y: 75 },
    { x: 80, y: 75 },
  ],
  Midfielder: [
    { x: 20, y: 50 },
    { x: 40, y: 50 },
    { x: 60, y: 50 },
    { x: 80, y: 50 },
  ],
  Forward: [
    { x: 35, y: 25 },
    { x: 65, y: 25 },
  ],
};

const SoccerPitch: React.FC<SoccerPitchProps> = ({ players, teamColors }) => {
  // Filter out coaches and managers, and only get active players
  const fieldPlayers = players.filter(
    (p) => p.isActive && ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].includes(p.position)
  );

  // Group players by position
  const playersByPosition: Record<string, BasePlayer[]> = {
    Goalkeeper: [],
    Defender: [],
    Midfielder: [],
    Forward: [],
  };

  fieldPlayers.forEach((player) => {
    if (playersByPosition[player.position]) {
      playersByPosition[player.position].push(player);
    }
  });

  // Create positioned players
  const positionedPlayers: PositionedPlayer[] = [];
  
  Object.entries(FORMATION_POSITIONS).forEach(([position, positions]) => {
    const playersInPosition = playersByPosition[position] || [];
    positions.forEach((pos, index) => {
      if (playersInPosition[index]) {
        positionedPlayers.push({
          ...playersInPosition[index],
          x: pos.x,
          y: pos.y,
        });
      }
    });
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        aspectRatio: '2/3',
        background: 'linear-gradient(to bottom, #2d5016 0%, #2d5016 8%, #4a7c2a 8%, #4a7c2a 92%, #2d5016 92%, #2d5016 100%)',
        borderRadius: 2,
        border: '3px solid #fff',
        overflow: 'hidden',
        mx: 'auto',
      }}
    >
      {/* Center Circle */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '30%',
          height: '30%',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '50%',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '2px',
          height: '100%',
          bgcolor: 'rgba(255, 255, 255, 0.5)',
        }}
      />

      {/* Penalty Areas */}
      {/* Top Penalty Area */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '20%',
          width: '60%',
          height: '18%',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderBottom: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '35%',
          width: '30%',
          height: '8%',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderBottom: 'none',
        }}
      />

      {/* Bottom Penalty Area */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '20%',
          width: '60%',
          height: '18%',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderTop: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '35%',
          width: '30%',
          height: '8%',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderTop: 'none',
        }}
      />

      {/* Goal Areas */}
      {/* Top Goal */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '42%',
          width: '16%',
          height: '5%',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderBottom: 'none',
        }}
      />

      {/* Bottom Goal */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '42%',
          width: '16%',
          height: '5%',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderTop: 'none',
        }}
      />

      {/* Players */}
      {positionedPlayers.map((player) => (
        <Tooltip
          key={player._id}
          title={
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {player.firstName} {player.lastName}
              </Typography>
              <Typography variant="caption">
                {player.position} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
              </Typography>
              {player.isCaptain && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Captain
                </Typography>
              )}
            </Box>
          }
          arrow
        >
          <Box
            sx={{
              position: 'absolute',
              left: `${player.x}%`,
              top: `${player.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translate(-50%, -50%) scale(1.1)',
                zIndex: 10,
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: teamColors.primary,
                color: teamColors.secondary,
                width: 48,
                height: 48,
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                fontWeight: 'bold',
              }}
            >
              {player.jerseyNumber || player.firstName?.[0] || '?'}
            </Avatar>
            <Box
              sx={{
                mt: 0.5,
                textAlign: 'center',
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: 1,
                px: 0.5,
                py: 0.25,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '60px',
                }}
              >
                {player.firstName} {player.lastName}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      ))}

      {/* Formation Label */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          color: '#fff',
          px: 2,
          py: 0.5,
          borderRadius: 1,
        }}
      >
        <Typography variant="caption" fontWeight="bold">
          Starting Lineup {positionedPlayers.length > 0 ? '(4-4-2)' : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default SoccerPitch;

