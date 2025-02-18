import React from 'react';
import { Box } from '@mui/material';

export default function BorderBeam() {
  return (
    <Box
      style={{
        '--size': 250,
        '--duration': 7,
        '--anchor': 90,
        '--border-width': 1.5,
        '--color-from': '#842bd2',
        '--color-to': '#ff5451',
        '--delay': '-9s',
      }}
      sx={{
        pointerEvents: 'none',
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        border: 'calc(var(--border-width) * 1px) solid transparent',
        maskClip: 'padding-box, border-box',
        maskComposite: 'intersect',
        maskImage: 'linear-gradient(transparent, transparent), linear-gradient(white, white)',

        '&::after': {
          content: '""',
          position: 'absolute',

          width: 'calc(var(--size) * 1px)',
          height: 'calc(var(--size) * 1px)',

          background: 'linear-gradient(to left, #842bd2, #ff5451, #8c52ff, #00bf63, transparent)',

          // The “border-beam” keyframes:
          animation: 'borderBeam calc(var(--duration) * 1s) infinite linear',
          animationDelay: 'var(--delay)',

          // The offset-path & offset-anchor are experimental:
          offsetPath: 'rect(0 auto auto 0 round calc(var(--size) * 1px))',
          offsetAnchor: 'calc(var(--anchor) * 1%) 50%',
        },

        /* Keyframes (Tailwind's `animate-border-beam`) 
           We only need a single "to { offset-distance: 100%; }"
        */
        '@keyframes borderBeam': {
          to: {
            offsetDistance: '100%',
          },
        },
      }}
    />
  );
}
