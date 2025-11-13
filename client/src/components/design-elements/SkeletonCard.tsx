import React from "react";
import { Box, Stack, useTheme } from "@mui/material";

interface SkeletonCardProps {
  width?: number | string;
  showHalo?: boolean;
}

/**
 * Skeleton card stack component for empty states
 * Shows an animated stacked card design with pulsing skeleton elements
 * Default size is 60% of original design
 */
const SkeletonCard: React.FC<SkeletonCardProps> = ({
  width = 216,
  showHalo = true,
}) => {
  const theme = useTheme();
  const pulseAnimation = {
    "@keyframes pulse": {
      "0%, 100%": { opacity: 1 },
      "50%": { opacity: 0.72 },
    },
  };

  const floatAnimation = {
    "@keyframes float": {
      "0%, 100%": { transform: "rotate(5deg) translate(12px, -20px)" },
      "50%": { transform: "rotate(5deg) translate(12px, -24px)" },
    },
  };

  const cardStyle = {
    width: width,
    height: 57,
    borderRadius: theme.shape.borderRadius,
    background:
      theme.palette.mode === "dark" ? "#222222" : theme.palette.primary.main,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 8px 30px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.05) inset"
        : "0 8px 30px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.05) inset",
    display: "flex",
    gap: theme.spacing(5),
    alignItems: "center",
    padding: theme.spacing(5),
  };

  const blockStyle = {
    width: 55,
    height: 34,
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.secondary.main,
    border: `1px solid ${theme.palette.primary.lowContrast}`,
    animation: "pulse 1.6s ease-in-out infinite",
    ...pulseAnimation,
  };

  const lineStyle = {
    height: 7,
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.secondary.main,
    border: `1px solid ${theme.palette.primary.lowContrast}`,
    animation: "pulse 1.6s ease-in-out infinite",
    ...pulseAnimation,
  };

  return (
    <Box sx={{ position: "relative" }}>
      {showHalo && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            "&::before": {
              content: '""',
              width: "260px",
              height: "260px",
              borderRadius: "999px",
              background:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#fff",
              filter: "blur(60px)",
              opacity: 0.9,
            },
          }}
          aria-hidden="true"
        />
      )}

      {/* Card stack */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        {/* Front card (now at bottom) */}
        <Box sx={cardStyle}>
          <Box sx={blockStyle} />
          <Stack sx={{ flex: 1, gap: "12px" }}>
            {/* Empty space to maintain card height */}
          </Stack>
        </Box>

        {/* Back card A */}
        <Box
          sx={{
            ...cardStyle,
            transform: "rotate(-4deg) translate(-12px, -12px)",
            filter: "blur(.2px)",
            position: "absolute",
            left: 0,
            top: 0,
          }}
          aria-hidden="true"
        >
          <Box sx={blockStyle} />
          <Stack sx={{ flex: 1, gap: "12px" }}>
            <Box sx={{ ...lineStyle, width: "60%" }} />
            <Box sx={{ ...lineStyle, width: "80%" }} />
            <Box sx={{ ...lineStyle, width: "40%" }} />
          </Stack>
        </Box>

        {/* Back card B */}
        <Box
          sx={{
            ...cardStyle,
            transform: "rotate(5deg) translate(12px, -20px)",
            filter: "blur(.3px)",
            position: "absolute",
            left: 0,
            top: 0,
            animation: "float 3s ease-in-out 5",
            ...floatAnimation,
          }}
          aria-hidden="true"
        >
          <Box sx={blockStyle} />
          <Stack sx={{ flex: 1, gap: "12px" }}>
            <Box sx={{ ...lineStyle, width: "60%" }} />
            <Box sx={{ ...lineStyle, width: "80%" }} />
            <Box sx={{ ...lineStyle, width: "40%" }} />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default SkeletonCard;
