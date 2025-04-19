import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";

const RoundGradientButton = styled(Button)(({ theme }) => ({
  position: "relative",
  border: "5px solid transparent",
  backgroundClip: "padding-box",
  borderRadius: 30,
  fontSize: "1.2rem",
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.background.main,

  "&:after": {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    background:
      theme.palette.mode === "dark"
        ? "linear-gradient(90deg, #842bd2, #ff5451, #8c52ff)"
        : "linear-gradient(90deg, #842bd2, #ff5451, #8c52ff)",
    content: '""',
    zIndex: -1,
    borderRadius: 30,
  },
}));

export default RoundGradientButton;
