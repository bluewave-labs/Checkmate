import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';


// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

const LogoCarousel = () => {
  const mode = useSelector((state) => state.ui.mode);
  const theme = useTheme();

  const lightLogos = [
    { src: '/images/borderless-dark.png', alt: 'borderless' },
    { src: '/images/draperdragon-dark.png', alt: 'draperdragon' },
    { src: '/images/animoca-dark.png', alt: 'animoca' },
    { src: '/images/gydra-dark.png', alt: 'gydra' },
    { src: '/images/fusion7-dark.png', alt: 'fusion7' },
    { src: '/images/initialvc-dark.png', alt: 'initialvc' },
    { src: '/images/gummies-dark.png', alt: 'gummies' },
    { src: '/images/laserdigital-dark.png', alt: 'laserdigital' },
    { src: '/images/depinhub-dark.png', alt: 'depinhub' },
    { src: '/images/decentralised-dark.png', alt: 'decentralised' },
    { src: '/images/sagadao-dark.png', alt: 'sagadao' },
    { src: '/images/seancarey-dark.png', alt: 'seancarey' },
    { src: '/images/alvarograce-dark.png', alt: 'alvarograce' },
  ];

  const darkLogos = [
    { src: '/images/borderless-light.png', alt: 'borderless' },
    { src: '/images/draperdragon-light.png', alt: 'draperdragon' },
    { src: '/images/animoca-light.png', alt: 'animoca' },
    { src: '/images/gydra-light.png', alt: 'gydra' },
    { src: '/images/fusion7-light.png', alt: 'fusion7' },
    { src: '/images/initialvc-light.png', alt: 'initialvc' },
    { src: '/images/gummies-light.png', alt: 'gummies' },
    { src: '/images/laserdigital-light.png', alt: 'laserdigital' },
    { src: '/images/depinhub-light.png', alt: 'depinhub' },
    { src: '/images/decentralised-light.png', alt: 'decentralised' },
    { src: '/images/sagadao-light.png', alt: 'sagadao' },
    { src: '/images/seancarey-light.png', alt: 'seancarey' },
    { src: '/images/alvarograce-light.png', alt: 'alvarograce' },
  ];

  const logos = mode === 'light' ? lightLogos : darkLogos;

  const logoStyle = {
    width: 'auto',
    height: '50px',
    maxWidth: '100%',
    margin: '0 12px',
    opacity: 1,
  };

  return (
    <Box
      component="section"
      className="brand-slider-section section-padding fix"
      sx={{
        py: 28,
        px: 12,
      }}
    >
      <Box className="brand-slider-container-wrapper">
        <Box className="brand-slider-wrapper" textAlign="center">
          <Typography
            variant="h4"
            sx={{ mb: 18, opacity: 1, color: theme.palette.text.primary }}
            fontFamily="BabaPro"
          >
            Backed by the best
          </Typography>

          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 0, disableOnInteraction: false }}
            speed={5000}
            loop={true}
            breakpoints={{
              0: { slidesPerView: 3, spaceBetween: 10 },
              576: { slidesPerView: 4, centeredSlides: true },
              768: { slidesPerView: 5 },
              1025: { slidesPerView: 6 },
              1400: { slidesPerView: 7 },
              1600: { slidesPerView: 8 },
            }}
            spaceBetween={20}
          >
            {logos.map((logo, index) => (
              <SwiperSlide key={index}>
                <Box className="brand-logo">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    style={logoStyle}
                  />
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </Box>
    </Box>
  );
};

export default LogoCarousel;
