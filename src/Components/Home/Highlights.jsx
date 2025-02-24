import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import MuiChip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import StrokeAnimation from './StrokeAnimation';
import { useSelector } from 'react-redux';

import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import EdgesensorHighRoundedIcon from '@mui/icons-material/EdgesensorHighRounded';
import ViewQuiltRoundedIcon from '@mui/icons-material/ViewQuiltRounded';

const items = [
  {
    icon: <ViewQuiltRoundedIcon />,
    title: 'Unrivaled Dashboard',
    description:
      'Experience the ultimate control center with unparalleled insights into your website and online product performance.',
    imageLight: "/images/dashboard-light.png",
    imageDark: "/images/dashboard-dark.png",
  },
  {
    icon: <EdgesensorHighRoundedIcon />,
    title: 'Global Mobile Integration',
    description:
      'Harness the power of a groundbreaking DePIN network, with data from over 2.65 million devices worldwide.',
    imageLight: "/images/dash-light.png",
    imageDark: "/images/dash-dark.png",
  },
  {
    icon: <DevicesRoundedIcon />,
    title: 'Universal Platform Access',
    description:
      'Access Prism on any device, anywhere. Our platform ensures you receive comprehensive data from every corner of the globe.',
    imageLight: "/images/all-platforms.png",
    imageDark: "/images/all-platforms.png",
  },
];

const Chip = styled(MuiChip)(({ theme, selected }) => ({
  variants: [
    {
      props: { selected },
      style: {
        background:
          'linear-gradient(to bottom right, hsl(210, 98%, 48%), hsl(210, 98%, 35%))',
        color: 'hsl(0, 0%, 100%)',
        borderColor: (theme.vars || theme).palette.primary.light,
        '& .MuiChip-label': {
          color: 'hsl(0, 0%, 100%)',
        },
        ...theme.applyStyles('dark', {
          borderColor: (theme.vars || theme).palette.primary.dark,
        }),
      },
    },
  ],
}));

export function MobileLayout({ selectedItemIndex, handleItemClick, selectedFeature }) {
  const mode = useSelector((state) => state.ui.mode);

  if (!items[selectedItemIndex]) {
    return null;
  }

  return (
    <Box
      sx={{
        display: { xs: 'flex', sm: 'none' },
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', gap: 4, overflow: 'auto', mb: 4, pb: 6 }}>
        {items.map(({ title }, index) => (
          <Chip
            size="medium"
            key={index}
            label={title}
            onClick={() => handleItemClick(index)}
            selected={selectedItemIndex === index}
          />
        ))}
      </Box>
      <Card variant="outlined">
        <Box
          sx={{
            mb: 2,
            position: 'relative',
            minHeight: 280,
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <img
            src={mode === 'dark'
              ? items[selectedItemIndex].imageDark.replace('url("', '').replace('")', '')
              : items[selectedItemIndex].imageLight.replace('url("', '').replace('")', '')
            }
            alt={items[selectedItemIndex].title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        </Box>
        <Box sx={{ px: 6, py: 4 }}>
          <Typography
            gutterBottom
            sx={{
              color: 'text.primary',
              fontWeight: 'medium',
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            {selectedFeature.title}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
            {selectedFeature.description}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}

MobileLayout.propTypes = {
  selectedItemIndex: PropTypes.number.isRequired,
  handleItemClick: PropTypes.func.isRequired,
  selectedFeature: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    imageLight: PropTypes.string.isRequired,
    imageDark: PropTypes.string.isRequired,
  }).isRequired,
};

export default function Features() {
  const [selectedItemIndex, setSelectedItemIndex] = React.useState(0);
  const mode = useSelector((state) => state.ui.mode);
  const handleItemClick = (index) => {
    setSelectedItemIndex(index);
  };

  const selectedFeature = items[selectedItemIndex];

  return (
    <Container id="features" sx={{ py: { xs: 8, sm: 16 }, px: { xs: 12, sm: 12 } }}>
      <Box sx={{ width: { sm: '100%', md: '60%' } }}>
        <Typography
          component="h2"
          variant="h4"
          gutterBottom
          fontFamily="BabaPro"
          sx={{ color: 'text.primary' }}
        >
          Prism Highlights
        </Typography>
        <Typography
          sx={{ color: 'text.secondary', mb: { xs: 12, sm: 12 } }}
        >
          Discover the world's first and most advanced uptime monitoring service, powered by a vibrant web3 community. Prism delivers superior insights and a clearer picture of your digital presence, supported by a global network of real devices.
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row-reverse' },
          gap: 2,
        }}
      >
        <div>
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              gap: 2,
              ml: 6,
              mb: 0,
              height: '100%',
            }}
          >
            {items.map(({ icon, title, description }, index) => (
              <Box
                key={index}
                component={Button}
                onClick={() => handleItemClick(index)}
                sx={[
                  (theme) => ({
                    p: 8,
                    height: '100%',
                    width: '100%',
                    '&:hover': {
                      backgroundColor: mode === 'dark'
                        ? 'rgba(133, 113, 255, 0.1)'
                        : (theme.vars || theme).palette.action.hover,
                    },
                  }),
                  selectedItemIndex === index && {
                    backgroundColor: (theme) => (mode === 'dark' ? 'rgba(133, 113, 255, 0.1)' : theme.palette.action.selected),
                  },
                ]}
              >
                <Box
                  sx={[
                    {
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'left',
                      gap: 1,
                      py: 6,
                      textAlign: 'left',
                      textTransform: 'none',
                      color: 'text.secondary',
                    },
                    selectedItemIndex === index && {
                      color: 'text.primary',
                    },
                  ]}
                >
                  {icon}

                  <Typography variant="h6">{title}</Typography>
                  <Typography>{description}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <MobileLayout
            selectedItemIndex={selectedItemIndex}
            handleItemClick={handleItemClick}
            selectedFeature={selectedFeature}
          />
        </div>
        <Box id="stroke-animation"
          sx={{
            position: 'relative',
            display: { xs: 'none', sm: 'flex' },
            width: { xs: '100%', md: '70%' },
            height: 'var(--items-image-height)',
          }}
        >
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              width: '100%',
              display: { xs: 'none', sm: 'flex' },
              pointerEvents: 'none',
              mt: 0,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 500,
                overflow: 'hidden',
                objectFit: 'contain',
                objectPosition: 'center',
              }}
            >
              <img
                src={mode === 'dark'
                  ? items[selectedItemIndex]?.imageDark.replace('url("', '').replace('")', '')
                  : items[selectedItemIndex]?.imageLight.replace('url("', '').replace('")', '')
                }
                alt={items[selectedItemIndex]?.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
            </Box>
          </Card>
          <StrokeAnimation />
        </Box>
      </Box>
    </Container>
  );
}
