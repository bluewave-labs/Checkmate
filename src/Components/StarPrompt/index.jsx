import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';

const StarPrompt = ({
  repoUrl = 'https://github.com/bluewave-labs/checkmate',
  title = 'Star Checkmate',
  description = 'See the latest releases and help grow the community on GitHub',
  storageKey = 'starPromptClosed'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [starCount, setStarCount] = useState('0');

  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        const owner = 'bluewave-labs';
        const repo = 'checkmate';
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        const data = await response.json();
        
        const count = data.stargazers_count;
        const formattedCount = count >= 1000 
          ? `${(count / 1000).toFixed(1)}k`
          : count.toString();
        
        setStarCount(formattedCount);
      } catch (error) {
        console.error('Error fetching star count:', error);
      }
    };

    fetchStarCount();
    
    const hasClosedPrompt = localStorage.getItem(storageKey);
    if (!hasClosedPrompt) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleClose = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  const handleStarClick = () => {
    window.open(repoUrl, '_blank');
  };

  if (!isVisible) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        mx: 2,
        borderRadius: '8px',
        backgroundColor: 'background.paper',
        width: 'auto',
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 1 
      }}>
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, color: 'primary.contrastText' }}>
            {title}
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ 
              mt: -1, 
              mr: -1,
              color: 'primary.contrastTextSecondary',
              '&:hover': {
                color: 'primary.contrastText'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography sx={{ fontSize: '13px', color: 'primary.contrastTextSecondary' }}>
          {description}
        </Typography>

        <Box 
          onClick={handleStarClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 1,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
            width: '100%'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: '1px solid',
              borderColor: 'primary.lowContrastBorder',
              borderRadius: '6px',
              px: 1.5,
              py: 0.5,
              backgroundColor: 'background.paper',
            }}
          >
            <GitHubIcon sx={{ fontSize: 20, color: 'primary.contrastText' }} />
            <Typography sx={{ fontSize: '13px', color: 'primary.contrastText' }}>Checkmate</Typography>
          </Box>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'primary.lowContrastBorder',
              borderRadius: '6px',
              px: 1.5,
              py: 0.5,
              backgroundColor: 'background.paper',
            }}
          >
            <Typography sx={{ fontSize: '13px', color: 'primary.contrastText' }}>{starCount}</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default StarPrompt;
