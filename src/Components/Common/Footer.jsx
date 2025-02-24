import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { FaFacebook, FaLinkedin, FaGithub, FaTwitter, FaEnvelope } from 'react-icons/fa';


function Copyright() {
  return (
    <Typography sx={{ color: 'text.secondary', mt: 1 }}>
      {'Copyright © '}
      <Link color="text.secondary" href="https://prism.uprock.com/">
        UpRock
      </Link>
      &nbsp;
      {new Date().getFullYear()}
    </Typography>
  );
}

export default function Footer() {
  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 4, sm: 8 },
        py: { xs: 24, sm: 24 },
        px: { xs: 12, sm: 12 },
        textAlign: { sm: 'center', md: 'left' },
      }}
    >
     
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          pt: { xs: 4, sm: 8 },
          width: '100%',
          borderColor: 'divider',
        }}
      >
        <div>
          <Link color="text.secondary" href="https://uprock.com/privacy-policy">
            Privacy Policy
          </Link>
          <Typography sx={{ display: 'inline', mx: 0.5, opacity: 0.5 }}>
            &nbsp;•&nbsp;
          </Typography>
          <Link color="text.secondary" href="https://uprock.com/terms-of-use">
            Terms of Service
          </Link>
          <Copyright />
        </div>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ justifyContent: 'left', color: 'text.secondary' }}
        >
          <IconButton
            color="inherit"
            size="small"
            href="mailto:prism@uprock.com?subject=Interested%20in%20UpRock%20Prism"
            aria-label="Contact Us"
            sx={{ alignSelf: 'center' }}
          >
            <FaEnvelope />
          </IconButton>
          <IconButton
            color="inherit"
            size="small"
            href="https://facebook.com/uprockcom"
            aria-label="Facebook"
            sx={{ alignSelf: 'center' }}
          >
            <FaFacebook />
          </IconButton>
          <IconButton
            color="inherit"
            size="small"
            href="https://x.com/uprockcom"
            aria-label="X"
            sx={{ alignSelf: 'center' }}
          >
            <FaTwitter />
          </IconButton>
          <IconButton
            color="inherit"
            size="small"
            href="https://www.linkedin.com/company/uprock/"
            aria-label="LinkedIn"
            sx={{ alignSelf: 'center' }}
          >
            <FaLinkedin />
          </IconButton>
          <IconButton
            color="inherit"
            size="small"
            href="https://github.com/uprockcom"
            aria-label="GitHub"
            sx={{ alignSelf: 'center' }}
          >
            <FaGithub />
          </IconButton>

        </Stack>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 4,
        }}
      >
        <Typography variant="h2" sx={{ color: 'text.secondary' }}>
          Made with ❤️ by&nbsp;
          <Link href="https://uprock.com" color="inherit" sx={{ mx: 0.5 }}>
            UpRock&nbsp;
          </Link>
          &&nbsp; 
          <Link href="https://bluewavelabs.ca" color="inherit" sx={{ mx: 0.5 }}>
            Bluewave Labs
          </Link>
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <Typography variant="h2" sx={{ color: 'text.secondary', mr: 1 }}>
            Built on&nbsp;
          </Typography>
          <svg
            id="Layer_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 397.7 311.7"
            xmlSpace="preserve"
            width="15"
            height="15"
          >
            <style type="text/css">
              {`.st0{fill:url(#SVGID_1_);}
                .st1{fill:url(#SVGID_2_);}
                .st2{fill:url(#SVGID_3_);}`}
            </style>
            <linearGradient
              id="SVGID_1_"
              gradientUnits="userSpaceOnUse"
              x1="360.8791"
              y1="351.4553"
              x2="141.213"
              y2="-69.2936"
              gradientTransform="matrix(1 0 0 -1 0 314)"
            >
              <stop offset="0" style={{ stopColor: 'rgb(0, 255, 163)' }} />
              <stop offset="1" style={{ stopColor: 'rgb(220, 31, 255)' }} />
            </linearGradient>
            <path
              className="st0"
              d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5 c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"
            />
            <linearGradient
              id="SVGID_2_"
              gradientUnits="userSpaceOnUse"
              x1="264.8291"
              y1="401.6014"
              x2="45.163"
              y2="-19.1475"
              gradientTransform="matrix(1 0 0 -1 0 314)"
            >
              <stop offset="0" style={{ stopColor: 'rgb(0, 255, 163)' }} />
              <stop offset="1" style={{ stopColor: 'rgb(220, 31, 255)' }} />
            </linearGradient>
            <path
              className="st1"
              d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5 c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"
            />
            <linearGradient
              id="SVGID_3_"
              gradientUnits="userSpaceOnUse"
              x1="312.5484"
              y1="376.688"
              x2="92.8822"
              y2="-44.061"
              gradientTransform="matrix(1 0 0 -1 0 314)"
            >
              <stop offset="0" style={{ stopColor: 'rgb(0, 255, 163)' }} />
              <stop offset="1" style={{ stopColor: 'rgb(220, 31, 255)' }} />
            </linearGradient>
            <path
              className="st2"
              d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4 c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"
            />
          </svg>
          <Typography variant="h2" sx={{ color: 'text.secondary', ml: 1 }}>
          &nbsp;Solana
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
