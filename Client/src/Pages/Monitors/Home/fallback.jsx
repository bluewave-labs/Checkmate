import { Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import Button from "../../../Components/Button";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const Fallback = ({ isAdmin }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Stack
      alignItems="center"
      backgroundColor={theme.palette.background.main}
      p={theme.spacing(30)}
      gap={theme.spacing(2)}
      border={1}
      borderRadius={theme.shape.borderRadius}
      borderColor={theme.palette.border.light}
      color={theme.palette.text.secondary}
    >
      <Typography component="h2">No monitors found</Typography>
      <Typography>
        It looks like you don’t have any monitors set up yet.
      </Typography>
      {isAdmin && (
        <Button
          level="primary"
          label="Create your first monitor"
          onClick={() => {
            navigate("/monitors/create");
          }}
          sx={{ mt: theme.spacing(12) }}
        />
      )}
    </Stack>
  );
};

Fallback.propTypes = {
  isAdmin: PropTypes.bool,
};

export default Fallback;
