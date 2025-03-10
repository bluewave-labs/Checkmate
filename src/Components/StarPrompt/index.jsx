import React from 'react';
import { Typography, IconButton, Stack, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@emotion/react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setStarPromptOpen } from '../../Features/UI/uiSlice';

const StarPrompt = ({
  repoUrl = 'https://github.com/bluewave-labs/checkmate'
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const isOpen = useSelector((state) => state.ui?.starPromptOpen ?? true);
  const mode = useSelector((state) => state.ui.mode);

  const handleClose = () => {
    dispatch(setStarPromptOpen(false));
  };

  const handleStarClick = () => {
    window.open(repoUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <Stack
      direction="column"
      sx={{
        width: '100%',
        padding: `${theme.spacing(6)} ${theme.spacing(6)}`,
        borderTop: `1px solid ${theme.palette.primary.lowContrast}`,
        borderBottom: `1px solid ${theme.palette.primary.lowContrast}`,
        borderRadius: 0,
        gap: theme.spacing(1.5),
        backgroundColor: theme.palette.primary.main,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%" pl={theme.spacing(4)}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.text.primary,
            mt: theme.spacing(3)
          }}
        >
          {t('starPromptTitle')}
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: theme.palette.text.primary,
            padding: 0,
            marginTop: theme.spacing(-5),
            '&:hover': {
              backgroundColor: 'transparent',
              opacity: 0.8
            },
          }}
        >
          <CloseIcon sx={{ fontSize: '1.25rem' }} />
        </IconButton>
      </Stack>

      <Typography 
        variant="body1"
        sx={{ 
          color: theme.palette.text.secondary,
          fontSize: '0.938rem',
          lineHeight: 1.5,
          mb: 1,
          px: theme.spacing(4)
        }}
      >
        {t('starPromptDescription')}
      </Typography>

      <Box 
        component="img"
        src={`https://img.shields.io/github/stars/bluewave-labs/checkmate?label=checkmate&style=social${mode === 'dark' ? '&color=white' : ''}`}
        alt="GitHub stars"
        onClick={handleStarClick}
        sx={{
          cursor: 'pointer',
          transform: 'scale(0.65)',
          transformOrigin: 'left center',
          '&:hover': {
            opacity: 0.8
          },
          pl: theme.spacing(4),
          filter: mode === 'dark' ? 'invert(1)' : 'none'
        }}
      />
    </Stack>
  );
};

export default StarPrompt;
