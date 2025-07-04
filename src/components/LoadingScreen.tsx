'use client';

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Fade,
  Paper,
  Avatar
} from '@mui/material';
import { keyframes } from '@mui/system';

// Animation keyframes
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

interface LoadingScreenProps {
  message?: string;
  variant?: 'full' | 'component' | 'minimal';
  progress?: number;
}

export default function LoadingScreen({ 
  message = 'Loading...', 
  variant = 'full',
  progress 
}: LoadingScreenProps) {

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (variant === 'component') {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
          border: '1px solid rgba(25, 118, 210, 0.1)'
        }}
      >
        <CircularProgress
          size={40}
          sx={{
            color: '#1976d2',
            mb: 2
          }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {message}
        </Typography>
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #1976d2, #9c27b0)',
                  borderRadius: 3
                }
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
              {Math.round(progress)}% complete
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }

  // Full screen loading
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
            `,
          }
        }}
      >
        {/* Logo Animation */}
        <Box
          sx={{
            animation: `${float} 3s ease-in-out infinite`,
            mb: 4,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'white'
            }}
          >
            L
          </Avatar>
        </Box>

        {/* Brand */}
        <Typography
          variant="h3"
          sx={{
            color: 'white',
            fontWeight: 700,
            mb: 1,
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}
        >
          Locall
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 400,
            mb: 4,
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}
        >
          Advanced Communication Platform
        </Typography>

        {/* Loading Indicator */}
        <Box sx={{ position: 'relative', zIndex: 1, mb: 3 }}>
          <CircularProgress
            size={50}
            thickness={3}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
        </Box>

        {/* Loading Message */}
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 500,
            animation: `${pulse} 2s ease-in-out infinite`,
            position: 'relative',
            zIndex: 1,
            mb: 2
          }}
        >
          {message}
        </Typography>

        {/* Progress Bar */}
        {progress !== undefined && (
          <Box sx={{ width: 300, position: 'relative', zIndex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 3
                }
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                mt: 1,
                display: 'block',
                textAlign: 'center'
              }}
            >
              {Math.round(progress)}% complete
            </Typography>
          </Box>
        )}

        {/* Decorative Elements */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.6)',
                animation: `${pulse} 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </Box>
      </Box>
    </Fade>
  );
}

// Skeleton Loading Component
export function SkeletonLoader({ 
  variant = 'rectangular',
  width = '100%',
  height = 40,
  animation = 'pulse',
  count = 1
}: {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | false;
  count?: number;
}) {
  const getSkeletonStyle = () => {
    const baseStyle = {
      background: animation === 'wave' 
        ? `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`
        : '#f0f0f0',
      backgroundSize: animation === 'wave' ? '200% 100%' : 'auto',
      animation: animation === 'wave' 
        ? `${shimmer} 1.5s infinite linear`
        : animation === 'pulse' 
          ? `${pulse} 1.5s ease-in-out infinite`
          : 'none',
      borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? 4 : 8,
      width,
      height: variant === 'text' ? 20 : height
    };

    return baseStyle;
  };

  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            ...getSkeletonStyle(),
            mb: count > 1 ? 1 : 0
          }}
        />
      ))}
    </Box>
  );
}
