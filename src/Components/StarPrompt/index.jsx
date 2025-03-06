import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@emotion/react';
import './index.css';

const StarPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const STORAGE_KEY = 'starPromptClosed';
  const theme = useTheme();

  useEffect(() => {
    const hasClosedPrompt = localStorage.getItem(STORAGE_KEY);
    if (!hasClosedPrompt) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  const handleStarClick = () => {
    window.open('https://github.com/bluewave-labs/checkmate', '_blank');
  };

  if (!isVisible) return null;

  return (
    <Box
      className="star-prompt"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: '100%',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          px: theme.spacing(8),
          py: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: '10px'
        }}>
          <Typography 
            sx={{ 
              color: '#344054',
              pt: '19px'
            }}
          >
            Star Checkmate
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ 
              color: theme.palette.primary.contrastTextTertiary,
              pt: 0,
              pr: 0,
              pb: 0,
              pl: 0,
              mr: -1,
              '&:hover': {
                backgroundColor: 'transparent',
                color: theme.palette.primary.contrastTextSecondary
              }
            }}
          >
            <CloseIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </Box>

        <Typography 
          className="description"
          sx={{ 
            color: '#344054',
            opacity: 0.8,
            mb: '15px'
          }}
        >
          See the latest releases and help grow the community on GitHub
        </Typography>

        <Box 
          component="img"
          src="https://img.shields.io/github/stars/bluewave-labs/checkmate?label=checkmate&style=social"
          alt="GitHub stars"
          onClick={handleStarClick}
          sx={{
            cursor: 'pointer',
            width: 'fit-content',
            pb: '18px',
            '&:hover': {
              opacity: 0.8
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default StarPrompt;
