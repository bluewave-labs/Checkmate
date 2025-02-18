import React from 'react';
import { Divider as MUIDivider } from '@mui/material';

const Divider = () => {
  return (
    <MUIDivider
      sx={{
        background: 'linear-gradient(90deg, #842bd2, #ff5451, #8c52ff, #00bf63, #842bd2)',
        backgroundSize: '400% 400%',
        animation: 'gradientAnimation 10s ease infinite',
        height: '2px', 
        opacity: 0.3,
      }}
    />
  );
};

export default Divider;

const styles = `
@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
} 